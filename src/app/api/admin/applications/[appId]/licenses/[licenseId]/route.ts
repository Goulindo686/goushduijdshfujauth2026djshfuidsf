import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { licenses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const editLicenseSchema = z.object({
  deviceLimit: z.number().int().min(0).optional(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { appId: string; licenseId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => null);
  const parseResult = editLicenseSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400);
  }

  await db
    .update(licenses)
    .set({
      ...parseResult.data,
      updatedAt: new Date(),
    })
    .where(and(eq(licenses.id, params.licenseId), eq(licenses.applicationId, params.appId)));

  await logAuditAction({
    action: "EDIT_LICENSE",
    resource: "license",
    resourceId: params.licenseId,
    ipAddress: extractClientIp(req.headers),
    metadata: parseResult.data,
  });

  return apiSuccess({ message: "Licença atualizada." });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { appId: string; licenseId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  await db
    .delete(licenses)
    .where(and(eq(licenses.id, params.licenseId), eq(licenses.applicationId, params.appId)));

  await logAuditAction({
    action: "DELETE_LICENSE",
    resource: "license",
    resourceId: params.licenseId,
    ipAddress: extractClientIp(req.headers),
  });

  return apiSuccess({ message: "Licença excluída com sucesso." });
}
