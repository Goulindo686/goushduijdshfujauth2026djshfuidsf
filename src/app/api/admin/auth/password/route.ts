import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { hashPassword, verifyPassword } from "@/lib/security/crypto";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres"),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) {
    return apiError("UNAUTHORIZED", "Não autenticado", 401);
  }

  const body = await req.json().catch(() => null);
  const parseResult = changePasswordSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400, parseResult.error.flatten());
  }

  const { currentPassword, newPassword } = parseResult.data;

  const [dbAdmin] = await db.select().from(admins).where(eq(admins.id, admin.adminId)).limit(1);
  if (!dbAdmin) {
    return apiError("UNAUTHORIZED", "Administrador não encontrado", 401);
  }

  const isCurrentValid = await verifyPassword(currentPassword, dbAdmin.passwordHash);
  if (!isCurrentValid) {
    return apiError("INVALID_CREDENTIALS", "Senha atual incorreta", 400);
  }

  const newHash = await hashPassword(newPassword);
  await db.update(admins).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(admins.id, admin.adminId));

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: "CHANGE_ADMIN_PASSWORD",
    resource: "admin",
    resourceId: admin.adminId,
    ipAddress: ip,
  });

  return apiSuccess({ message: "Senha alterada com sucesso." });
}
