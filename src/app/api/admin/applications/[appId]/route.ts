import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { applications, licenses, applicationUsers, devices, authLogs } from "@/lib/db/schema";
import { eq, count, sql, and, gte } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const updateApplicationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "DISABLED", "MAINTENANCE"]).optional(),
  maintenanceMessage: z.string().optional(),
  currentVersion: z.string().optional(),
  downloadUrl: z.string().url().optional().or(z.literal("")),
});

// GET: Detalhes da aplicação e estatísticas
export async function GET(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, params.appId))
    .limit(1);

  if (!app) {
    return apiError("APPLICATION_NOT_FOUND", "Aplicação não encontrada", 404);
  }

  // Estatísticas agregadas
  const [totalLicensesRes] = await db
    .select({ value: count() })
    .from(licenses)
    .where(eq(licenses.applicationId, app.id));

  const [activeLicensesRes] = await db
    .select({ value: count() })
    .from(licenses)
    .where(and(eq(licenses.applicationId, app.id), eq(licenses.status, "ACTIVE")));

  const [totalUsersRes] = await db
    .select({ value: count() })
    .from(applicationUsers)
    .where(eq(applicationUsers.applicationId, app.id));

  const [totalDevicesRes] = await db
    .select({ value: count() })
    .from(devices)
    .where(eq(devices.applicationId, app.id));

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [authTodayRes] = await db
    .select({ value: count() })
    .from(authLogs)
    .where(and(eq(authLogs.applicationId, app.id), gte(authLogs.createdAt, oneDayAgo)));

  return apiSuccess({
    application: app,
    stats: {
      totalLicenses: totalLicensesRes?.value || 0,
      activeLicenses: activeLicensesRes?.value || 0,
      totalUsers: totalUsersRes?.value || 0,
      totalDevices: totalDevicesRes?.value || 0,
      authenticationsToday: authTodayRes?.value || 0,
    },
  });
}

// PATCH: Atualizar aplicação
export async function PATCH(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => null);
  const parseResult = updateApplicationSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400, parseResult.error.flatten());
  }

  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, params.appId))
    .limit(1);

  if (!app) {
    return apiError("APPLICATION_NOT_FOUND", "Aplicação não encontrada", 404);
  }

  await db
    .update(applications)
    .set({
      ...parseResult.data,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, app.id));

  const [updatedApp] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, app.id))
    .limit(1);

  await logAuditAction({
    action: "UPDATE_APPLICATION",
    resource: "application",
    resourceId: app.id,
    ipAddress: extractClientIp(req.headers),
    metadata: parseResult.data,
  });

  return apiSuccess(updatedApp);
}

// DELETE: Excluir aplicação
export async function DELETE(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, params.appId))
    .limit(1);

  if (!app) {
    return apiError("APPLICATION_NOT_FOUND", "Aplicação não encontrada", 404);
  }

  await db.delete(applications).where(eq(applications.id, app.id));

  await logAuditAction({
    action: "DELETE_APPLICATION",
    resource: "application",
    resourceId: app.id,
    ipAddress: extractClientIp(req.headers),
    metadata: { name: app.name, appId: app.appId },
  });

  return apiSuccess({ message: "Aplicação excluída com sucesso." });
}
