import { NextRequest } from "next/server";
import { z } from "zod";
import { db, pool } from "@/lib/db";
import { applications, applicationUsers, licenses, plans, devices, bans } from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { hashPassword, generateSecureToken } from "@/lib/security/crypto";
import { checkRateLimit, extractClientIp } from "@/lib/security/rate-limiter";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuthEvent } from "@/lib/services/audit.service";
import { triggerWebhooksForApp } from "@/lib/services/webhook.service";

const registerSchema = z.object({
  app_id: z.string().min(1),
  username: z.string().min(3).max(100),
  password: z.string().min(6),
  license: z.string().min(1),
  email: z.string().email().optional(),
  hwid: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);

  // Rate Limiting
  const rateLimit = checkRateLimit(ip, "REGISTER");
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", `Limite de registros atingido. Aguarde ${rateLimit.resetInSeconds}s.`, 429);
  }

  const body = await req.json().catch(() => null);
  const parseResult = registerSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados de registro inválidos", 400);
  }

  const { app_id, username, password, license: licenseKey, email, hwid } = parseResult.data;

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

  // 1.1 Checa ban de IP ou HWID (específico ou global)
  if (hwid) {
    const [bannedHwid] = await db
      .select()
      .from(bans)
      .where(
        and(
          eq(bans.type, "DEVICE"),
          eq(bans.targetValue, hwid),
          eq(bans.active, true),
          or(eq(bans.applicationId, app.id), eq(bans.isGlobal, true), isNull(bans.applicationId))
        )
      )
      .limit(1);

    if (bannedHwid) {
      const scope = bannedHwid.isGlobal ? "globalmente" : "nesta aplicação";
      return apiError("DEVICE_BANNED", `Dispositivo banido ${scope}: ${bannedHwid.reason}`, 403);
    }
  }

  if (ip) {
    const [bannedIp] = await db
      .select()
      .from(bans)
      .where(
        and(
          eq(bans.type, "IP"),
          eq(bans.targetValue, ip),
          eq(bans.active, true),
          or(eq(bans.applicationId, app.id), eq(bans.isGlobal, true), isNull(bans.applicationId))
        )
      )
      .limit(1);

    if (bannedIp) {
      const scope = bannedIp.isGlobal ? "globalmente" : "nesta aplicação";
      return apiError("IP_BANNED", `Endereço IP banido ${scope}: ${bannedIp.reason}`, 403);
    }
  }

  // 2. Checa se o username já existe
  const [existingUser] = await db
    .select()
    .from(applicationUsers)
    .where(and(eq(applicationUsers.applicationId, app.id), eq(applicationUsers.username, username.trim())))
    .limit(1);

  if (existingUser) {
    return apiError("INVALID_REQUEST", "Nome de usuário já cadastrado.", 400);
  }

  // 3. Validação da licença dentro de transação atômica
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const licRes = await client.query(
      `SELECT l.*, p.name as plan_name, p.level as plan_level, p.duration_days as plan_duration 
       FROM licenses l 
       LEFT JOIN plans p ON l.plan_id = p.id
       WHERE l.application_id = $1 AND l.key = $2 
       FOR UPDATE OF l`,
      [app.id, licenseKey.trim().toUpperCase()]
    );

    if (licRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return apiError("INVALID_LICENSE", "Licença inválida ou inexistente.", 400);
    }

    const lic = licRes.rows[0];

    if (lic.status !== "UNUSED") {
      await client.query("ROLLBACK");
      return apiError("INVALID_LICENSE", `Esta licença já foi utilizada (${lic.status}).`, 400);
    }

    const now = new Date();
    const duration = lic.duration_days ?? lic.plan_duration;
    const expiresAt = duration ? new Date(now.getTime() + duration * 24 * 60 * 60 * 1000) : null;

    // Atualiza licença
    await client.query(
      `UPDATE licenses SET status = 'ACTIVE', activated_at = $1, expires_at = $2, updated_at = $3 WHERE id = $4`,
      [now, expiresAt, now, lic.id]
    );

    // Cria usuário
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    await client.query(
      `INSERT INTO application_users (id, application_id, plan_id, username, password_hash, email, status, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, $8, $9)`,
      [userId, app.id, lic.plan_id, username.trim(), passwordHash, email || null, expiresAt, now, now]
    );

    // Registra HWID se fornecido
    if (hwid) {
      await client.query(
        `INSERT INTO devices (id, application_id, license_id, user_id, device_fingerprint, first_seen, last_seen, status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [crypto.randomUUID(), app.id, lic.id, userId, hwid, now, now, "ACTIVE", JSON.stringify({})]
      );
    }

    await client.query("COMMIT");

    await logAuthEvent({
      applicationId: app.id,
      event: "USER_REGISTERED",
      userIdentifier: username,
      ipAddress: ip,
      deviceFingerprint: hwid,
      status: "SUCCESS",
    });

    triggerWebhooksForApp(app.id, "user.created", {
      username,
      license: lic.key,
      plan: lic.plan_name,
      hwid,
    }).catch(e => console.error(e));

    return apiSuccess(
      {
        message: "Usuário registrado com sucesso.",
        username,
        expiresAt,
        plan: lic.plan_name ? { name: lic.plan_name, level: lic.plan_level } : null,
      },
      201
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[API v1 /auth/register] Erro:", err);
    return apiError("INTERNAL_SERVER_ERROR", "Erro ao registrar usuário", 500);
  } finally {
    client.release();
  }
}
