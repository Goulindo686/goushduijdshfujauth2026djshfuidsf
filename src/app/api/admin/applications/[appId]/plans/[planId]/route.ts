import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const updatePlanSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  durationDays: z.number().int().positive().nullable().optional(),
  level: z.number().int().optional(),
  permissions: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { appId: string; planId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => null);
  const parseResult = updatePlanSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400);
  }

  const [existingPlan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, params.planId), eq(plans.applicationId, params.appId)))
    .limit(1);

  if (!existingPlan) {
    return apiError("INVALID_REQUEST", "Plano não encontrado", 404);
  }

  await db
    .update(plans)
    .set(parseResult.data)
    .where(eq(plans.id, existingPlan.id));

  await logAuditAction({
    action: "UPDATE_PLAN",
    resource: "plan",
    resourceId: existingPlan.id,
    ipAddress: extractClientIp(req.headers),
    metadata: parseResult.data,
  });

  return apiSuccess({ message: "Plano atualizado com sucesso." });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { appId: string; planId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  await db
    .delete(plans)
    .where(and(eq(plans.id, params.planId), eq(plans.applicationId, params.appId)));

  await logAuditAction({
    action: "DELETE_PLAN",
    resource: "plan",
    resourceId: params.planId,
    ipAddress: extractClientIp(req.headers),
  });

  return apiSuccess({ message: "Plano removido com sucesso." });
}
