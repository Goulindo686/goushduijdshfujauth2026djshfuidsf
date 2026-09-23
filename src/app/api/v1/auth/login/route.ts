import { NextRequest } from "next/server";
import { z } from "zod";
import { db, pool } from "@/lib/db";
import { applications, applicationUsers, bans, devices, plans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyPassword, generateSecureToken } from "@/lib/security/crypto";
import { checkRateLimit, extractClientIp } from "@/lib/security/rate-limiter";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuthEvent } from "@/lib/services/audit.service";
import { triggerWebhooksForApp } from "@/lib/services/webhook.service";

const loginSchema = z.object({
  app_id: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  hwid: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);

  // Rate Limiting
  const rateLimit = checkRateLimit(ip, "USER_AUTH");
  if (!rateLimit.allowed) {
    return apiError(
      "RATE_LIMITED",
      `Muitas tentativas de login. Aguarde ${rateLimit.resetInSeconds} segundos.`,
      429
    );
  }

  const body = await req.json().catch(() => null);
  const parseResult = loginSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Requisição inválida", 400);
  }

  const { app_id, username, password, hwid } = parseResult.data;

  // 1. Busca aplicação
  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.appId, app_id.toLowerCase()))
    .limit(1);

  if (!app) return apiError("APPLICATION_NOT_FOUND", "Aplicação não encontrada", 404);
  if (app.status === "DISABLED") return apiError("APPLICATION_DISABLED", "Aplicação desativada", 403);
  if (app.status === "MAINTENANCE") {
    return apiError("APPLICATION_MAINTENANCE", app.maintenanceMessage || "Aplicação em manutenção", 503);
  }

  // 2. Checa ban de IP ou HWID
  if (hwid) {
    const [bannedHwid] = await db
      .select()
      .from(bans)
      .where(and(eq(bans.applicationId, app.id), eq(bans.type, "DEVICE"), eq(bans.targetValue, hwid), eq(bans.active, true)))
      .limit(1);

    if (bannedHwid) return apiError("DEVICE_BANNED", `Dispositivo banido: ${bannedHwid.reason}`, 403);
  }

  // 3. Busca usuário com plano
  const [user] = await db
    .select({
      id: applicationUsers.id,
      username: applicationUsers.username,
      passwordHash: applicationUsers.passwordHash,
      status: applicationUsers.status,
      expiresAt: applicationUsers.expiresAt,
      planId: applicationUsers.planId,
      planName: plans.name,
      planLevel: plans.level,
      planPermissions: plans.permissions,
    })
    .from(applicationUsers)
    .leftJoin(plans, eq(applicationUsers.planId, plans.id))
    .where(and(eq(applicationUsers.applicationId, app.id), eq(applicationUsers.username, username.trim())))
    .limit(1);

  if (!user) {
    await logAuthEvent({
      applicationId: app.id,
      event: "LOGIN_FAILED",
      userIdentifier: username,
      ipAddress: ip,
      deviceFingerprint: hwid,
      status: "FAILED",
      failureReason: "Usuário não encontrado.",
    });
    return apiError("INVALID_CREDENTIALS", "Usuário ou senha incorretos", 401);
  }

  if (user.status === "BANNED") {
    return apiError("USER_BANNED", "Este usuário foi banido.", 403);
  }
  if (user.status === "DISABLED") {
    return apiError("USER_DISABLED", "Este usuário está desativado.", 403);
  }

  const now = new Date();
  if (user.expiresAt && new Date(user.expiresAt).getTime() < now.getTime()) {
    return apiError("USER_EXPIRED", "Acesso expirado para esta conta.", 403);
  }

  // 4. Valida senha Argon2id
  const isMatch = await verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    await logAuthEvent({
      applicationId: app.id,
      event: "LOGIN_FAILED",
      userIdentifier: username,
      ipAddress: ip,
      deviceFingerprint: hwid,
      status: "FAILED",
      failureReason: "Senha incorreta.",
    });
    return apiError("INVALID_CREDENTIALS", "Usuário ou senha incorretos", 401);
  }

  // 5. Atualiza last_login_at e vincula HWID se fornecido
  await db
    .update(applicationUsers)
    .set({ lastLoginAt: now, updatedAt: now })
    .where(eq(applicationUsers.id, user.id));

  if (hwid) {
    const [existingDev] = await db
      .select()
      .from(devices)
      .where(and(eq(devices.applicationId, app.id), eq(devices.userId, user.id), eq(devices.deviceFingerprint, hwid)))
      .limit(1);

    if (existingDev) {
      await db.update(devices).set({ lastSeen: now }).where(eq(devices.id, existingDev.id));
    } else {
      await db.insert(devices).values({
        id: crypto.randomUUID(),
        applicationId: app.id,
        userId: user.id,
        deviceFingerprint: hwid,
        firstSeen: now,
        lastSeen: now,
        status: "ACTIVE",
        metadata: {},
      });
    }
  }

  await logAuthEvent({
    applicationId: app.id,
    event: "LOGIN_SUCCESS",
    userIdentifier: username,
    ipAddress: ip,
    deviceFingerprint: hwid,
    status: "SUCCESS",
  });

  triggerWebhooksForApp(app.id, "user.login", {
    username,
    ip,
    hwid,
    timestamp: now,
  }).catch(e => console.error(e));

  const sessionToken = generateSecureToken(32);
  const timeRemainingSeconds = user.expiresAt
    ? Math.max(0, Math.floor((new Date(user.expiresAt).getTime() - now.getTime()) / 1000))
    : null;

  return apiSuccess({
    authorized: true,
    user: {
      username: user.username,
      expiresAt: user.expiresAt,
      timeRemainingSeconds,
      plan: user.planName
        ? {
            name: user.planName,
            level: user.planLevel || 1,
            permissions: user.planPermissions || [],
          }
        : null,
    },
    session_token: sessionToken,
  });
}
