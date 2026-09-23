import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/security/crypto";
import { checkRateLimit, extractClientIp } from "@/lib/security/rate-limiter";
import { createAdminSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuditAction } from "@/lib/services/audit.service";
import { authenticator } from "otplib";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);
  const userAgent = req.headers.get("user-agent") || undefined;

  // Rate Limiting
  const rateLimit = checkRateLimit(ip, "ADMIN_LOGIN");
  if (!rateLimit.allowed) {
    return apiError(
      "RATE_LIMITED",
      `Muitas tentativas de login. Aguarde ${rateLimit.resetInSeconds} segundos.`,
      429
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_REQUEST", "JSON inválido", 400);
  }

  const parseResult = loginSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados de login inválidos", 400, parseResult.error.flatten());
  }

  const { email, password, totpCode } = parseResult.data;

  // Busca admin
  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email.toLowerCase().trim()))
    .limit(1);

  if (!admin) {
    return apiError("INVALID_CREDENTIALS", "Email ou senha incorretos", 401);
  }

  // Validação Argon2id
  const isPasswordValid = await verifyPassword(password, admin.passwordHash);
  if (!isPasswordValid) {
    await logAuditAction({
      action: "ADMIN_LOGIN_FAILED",
      resource: "admin",
      resourceId: admin.id,
      ipAddress: ip,
      metadata: { reason: "Senha incorreta" },
    });
    return apiError("INVALID_CREDENTIALS", "Email ou senha incorretos", 401);
  }

  // Validação 2FA se habilitado
  if (admin.totpEnabled) {
    if (!totpCode) {
      return apiSuccess({
        requires2FA: true,
        message: "Código de autenticação de dois fatores (2FA) obrigatório.",
      });
    }

    const isValidToken = authenticator.verify({
      token: totpCode,
      secret: admin.totpSecret || "",
    });

    const isRecoveryCode = admin.recoveryCodes?.includes(totpCode.toUpperCase().trim());

    if (!isValidToken && !isRecoveryCode) {
      return apiError("INVALID_CREDENTIALS", "Código 2FA ou de recuperação inválido", 401);
    }

    // Se usou código de recuperação, consome o código
    if (isRecoveryCode) {
      const updatedCodes = admin.recoveryCodes?.filter(c => c !== totpCode.toUpperCase().trim()) || [];
      await db.update(admins).set({ recoveryCodes: updatedCodes }).where(eq(admins.id, admin.id));
    }
  }

  // Cria sessão segura
  await createAdminSession(admin.id, ip, userAgent);

  await logAuditAction({
    action: "ADMIN_LOGIN_SUCCESS",
    resource: "admin",
    resourceId: admin.id,
    ipAddress: ip,
  });

  return apiSuccess({
    authorized: true,
    email: admin.email,
    totpEnabled: admin.totpEnabled,
  });
}
