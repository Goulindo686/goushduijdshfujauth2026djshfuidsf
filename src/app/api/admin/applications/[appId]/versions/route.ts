import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { applicationVersions, applications } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const versionSchema = z.object({
  version: z.string().min(1).max(50),
  changelog: z.string().optional(),
  downloadUrl: z.string().url().optional().or(z.literal("")),
  checksum: z.string().optional(),
  isRequired: z.boolean().default(false),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const versions = await db
    .select()
    .from(applicationVersions)
    .where(eq(applicationVersions.applicationId, params.appId))
    .orderBy(desc(applicationVersions.createdAt));

  return apiSuccess(versions);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => null);
  const parseResult = versionSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400);
  }

  const { version, changelog, downloadUrl, checksum, isRequired } = parseResult.data;

  const newVersion = {
    id: crypto.randomUUID(),
    applicationId: params.appId,
    version,
    changelog: changelog || null,
    downloadUrl: downloadUrl || null,
    checksum: checksum || null,
    isRequired,
    createdAt: new Date(),
  };

  await db.insert(applicationVersions).values(newVersion);

  // Atualiza versão atual da aplicação
  await db
    .update(applications)
    .set({ currentVersion: version, updatedAt: new Date() })
    .where(eq(applications.id, params.appId));

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: "CREATE_VERSION",
    resource: "version",
    resourceId: newVersion.id,
    ipAddress: ip,
    metadata: { version, applicationId: params.appId },
  });

  return apiSuccess(newVersion, 201);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const { searchParams } = new URL(req.url);
  const versionId = searchParams.get("versionId");
  if (!versionId) return apiError("INVALID_REQUEST", "versionId obrigatório", 400);

  await db
    .delete(applicationVersions)
    .where(and(eq(applicationVersions.id, versionId), eq(applicationVersions.applicationId, params.appId)));

  return apiSuccess({ message: "Versão removida." });
}
