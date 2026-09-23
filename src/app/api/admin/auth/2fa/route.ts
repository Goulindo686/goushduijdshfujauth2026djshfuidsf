import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuditAction } from "@/lib/services/audit.service";
import { generateSecureToken } from "@/lib/security/crypto";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";

// GET: Iniciar setup do 2FA (gera secret e qrcode)
export async function GET() {
  const admin = await getAdminFromSession();
  if (!admin) {
    return apiError("UNAUTHORIZED", "Não autenticado", 401);
  }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(admin.email, "GouAuth", secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauth);

  return apiSuccess({
    secret,
    qrCodeUrl,
    otpauth,
  });
}

const verifySchema = z.object({
  secret: z.string().min(10),
  token: z.string().length(6),
});

// POST: Validar token e ativar 2FA
export async function POST(req: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) {
    return apiError("UNAUTHORIZED", "Não autenticado", 401);
  }

  const body = await req.json().catch(() => null);
  const parseResult = verifySchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400);
  }

  const { secret, token } = parseResult.data;
  const isValid = authenticator.verify({ token, secret });

  if (!isValid) {
    return apiError("INVALID_REQUEST", "Código 2FA incorreto", 400);
  }

  // Gera 8 recovery codes
  const recoveryCodes = Array.from({ length: 8 }, () =>
    generateSecureToken(4).toUpperCase() + "-" + generateSecureToken(4).toUpperCase()
  );

  await db
    .update(admins)
    .set({
      totpSecret: secret,
      totpEnabled: true,
      recoveryCodes,
      updatedAt: new Date(),
    })
    .where(eq(admins.id, admin.adminId));

  await logAuditAction({
    action: "ENABLE_2FA",
    resource: "admin",
    resourceId: admin.adminId,
  });

  return apiSuccess({
    enabled: true,
    recoveryCodes,
    message: "2FA habilitado com sucesso. Guarde os códigos de recuperação.",
  });
}

// DELETE: Desativar 2FA
export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) {
    return apiError("UNAUTHORIZED", "Não autenticado", 401);
  }

  const body = await req.json().catch(() => null);
  const token = body?.token;

  const [dbAdmin] = await db.select().from(admins).where(eq(admins.id, admin.adminId)).limit(1);
  if (!dbAdmin || !dbAdmin.totpSecret) {
    return apiError("INVALID_REQUEST", "2FA não configurado", 400);
  }

  const isValid = authenticator.verify({ token: token || "", secret: dbAdmin.totpSecret });
  if (!isValid) {
    return apiError("INVALID_CREDENTIALS", "Código 2FA inválido para confirmação", 400);
  }

  await db
    .update(admins)
    .set({
      totpSecret: null,
      totpEnabled: false,
      recoveryCodes: [],
      updatedAt: new Date(),
    })
    .where(eq(admins.id, admin.adminId));

  await logAuditAction({
    action: "DISABLE_2FA",
    resource: "admin",
    resourceId: admin.adminId,
  });

  return apiSuccess({
    enabled: false,
    message: "2FA desativado com sucesso.",
  });
}
