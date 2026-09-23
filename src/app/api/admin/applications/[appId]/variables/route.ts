import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { remoteVariables } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const variableSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
  type: z.enum(["STRING", "NUMBER", "BOOLEAN", "JSON"]).default("STRING"),
  isClientExposed: z.boolean().default(false),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const vars = await db
    .select()
    .from(remoteVariables)
    .where(eq(remoteVariables.applicationId, params.appId))
    .orderBy(desc(remoteVariables.createdAt));

  return apiSuccess(vars);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => null);
  const parseResult = variableSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400);
  }

  const { key, value, type, isClientExposed } = parseResult.data;

  // Verifica se a chave já existe
  const [existing] = await db
    .select()
    .from(remoteVariables)
    .where(and(eq(remoteVariables.applicationId, params.appId), eq(remoteVariables.key, key.trim())))
    .limit(1);

  if (existing) {
    // Atualiza
    await db
      .update(remoteVariables)
      .set({ value, type, isClientExposed, updatedAt: new Date() })
      .where(eq(remoteVariables.id, existing.id));

    return apiSuccess({ message: "Variável atualizada com sucesso." });
  }

  const newVar = {
    id: crypto.randomUUID(),
    applicationId: params.appId,
    key: key.trim(),
    value,
    type,
    isClientExposed,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(remoteVariables).values(newVar);

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: "CREATE_REMOTE_VARIABLE",
    resource: "variable",
    resourceId: newVar.id,
    ipAddress: ip,
    metadata: { key, type, isClientExposed },
  });

  return apiSuccess(newVar, 201);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const { searchParams } = new URL(req.url);
  const variableId = searchParams.get("variableId");
  if (!variableId) return apiError("INVALID_REQUEST", "variableId obrigatório", 400);

  await db
    .delete(remoteVariables)
    .where(and(eq(remoteVariables.id, variableId), eq(remoteVariables.applicationId, params.appId)));

  return apiSuccess({ message: "Variável removida." });
}
