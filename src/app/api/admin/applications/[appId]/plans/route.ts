import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { plans, applications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const createPlanSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  durationDays: z.number().int().positive().nullable(), // null = Lifetime
  level: z.number().int().default(1),
  permissions: z.array(z.string()).default([]),
});

// GET: Listar planos da aplicação
export async function GET(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const appPlans = await db
    .select()
    .from(plans)
    .where(eq(plans.applicationId, params.appId))
    .orderBy(desc(plans.createdAt));

  return apiSuccess(appPlans);
}

// POST: Criar plano
export async function POST(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const [app] = await db.select().from(applications).where(eq(applications.id, params.appId)).limit(1);
  if (!app) return apiError("APPLICATION_NOT_FOUND", "Aplicação não encontrada", 404);

  const body = await req.json().catch(() => null);
  const parseResult = createPlanSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400, parseResult.error.flatten());
  }

  const newPlan = {
    id: crypto.randomUUID(),
    applicationId: app.id,
    ...parseResult.data,
    status: "ACTIVE",
    createdAt: new Date(),
  };

  await db.insert(plans).values(newPlan);

  await logAuditAction({
    action: "CREATE_PLAN",
    resource: "plan",
    resourceId: newPlan.id,
    ipAddress: extractClientIp(req.headers),
    metadata: { name: newPlan.name, appId: app.appId },
  });

  return apiSuccess(newPlan, 201);
}
