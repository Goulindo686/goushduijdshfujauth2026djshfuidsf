import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { applicationUsers, bans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { hashPassword } from "@/lib/security/crypto";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const updateUserSchema = z.object({
  password: z.string().min(6).optional(),
  planId: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "BANNED", "EXPIRED", "DISABLED"]).optional(),
  banReason: z.string().optional(),
  notes: z.string().optional().nullable(),
  daysToAdd: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { appId: string; userId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const [user] = await db
    .select()
    .from(applicationUsers)
    .where(and(eq(applicationUsers.id, params.userId), eq(applicationUsers.applicationId, params.appId)))
    .limit(1);

  if (!user) return apiError("INVALID_REQUEST", "Usuário não encontrado", 404);

  const body = await req.json().catch(() => null);
  const parseResult = updateUserSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400);
  }

  const data = parseResult.data;
  const updatePayload: Record<string, unknown> = { updatedAt: new Date() };

  if (data.password) {
    updatePayload.passwordHash = await hashPassword(data.password);
  }
  if (data.planId !== undefined) {
    updatePayload.planId = data.planId;
  }
  if (data.status) {
    updatePayload.status = data.status;

    if (data.status === "BANNED") {
      await db.insert(bans).values({
        id: crypto.randomUUID(),
        applicationId: params.appId,
        type: "USER",
        targetValue: user.username,
        reason: data.banReason || "Banido pelo administrador",
        active: true,
        createdAt: new Date(),
      });
    } else if (data.status === "ACTIVE") {
      await db
        .update(bans)
        .set({ active: false })
        .where(and(eq(bans.type, "USER"), eq(bans.targetValue, user.username)));
    }
  }
  if (data.notes !== undefined) {
    updatePayload.notes = data.notes;
  }
  if (data.daysToAdd) {
    const currentExpiry = user.expiresAt ? new Date(user.expiresAt) : new Date();
    updatePayload.expiresAt = new Date(currentExpiry.getTime() + data.daysToAdd * 24 * 60 * 60 * 1000);
  }

  await db
    .update(applicationUsers)
    .set(updatePayload)
    .where(eq(applicationUsers.id, user.id));

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: "UPDATE_APPLICATION_USER",
    resource: "user",
    resourceId: user.id,
    ipAddress: ip,
    metadata: { username: user.username, updates: Object.keys(updatePayload) },
  });

  return apiSuccess({ message: "Usuário atualizado com sucesso." });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { appId: string; userId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  await db
    .delete(applicationUsers)
    .where(and(eq(applicationUsers.id, params.userId), eq(applicationUsers.applicationId, params.appId)));

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: "DELETE_APPLICATION_USER",
    resource: "user",
    resourceId: params.userId,
    ipAddress: ip,
  });

  return apiSuccess({ message: "Usuário excluído com sucesso." });
}
