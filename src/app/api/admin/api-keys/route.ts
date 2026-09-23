import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminApiKeys } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { generateSecureToken, sha256 } from "@/lib/security/crypto";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const createApiKeySchema = z.object({
  name: z.string().min(2).max(100),
  scopes: z.array(z.string()).min(1),
  expiresInDays: z.number().int().positive().nullable().optional(),
});

export async function GET() {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const keys = await db
    .select({
      id: adminApiKeys.id,
      name: adminApiKeys.name,
      prefix: adminApiKeys.prefix,
      scopes: adminApiKeys.scopes,
      lastUsedAt: adminApiKeys.lastUsedAt,
      expiresAt: adminApiKeys.expiresAt,
      createdAt: adminApiKeys.createdAt,
    })
    .from(adminApiKeys)
    .orderBy(desc(adminApiKeys.createdAt));

  return apiSuccess(keys);
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => null);
  const parseResult = createApiKeySchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400);
  }

  const { name, scopes, expiresInDays } = parseResult.data;

  const rawSecret = generateSecureToken(24);
  const fullKey = `gou_live_${rawSecret}`;
  const prefix = fullKey.slice(0, 14); // Ex: gou_live_1234
  const keyHash = sha256(fullKey);

  const now = new Date();
  const expiresAt = expiresInDays ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000) : null;

  const newKeyRecord = {
    id: crypto.randomUUID(),
    name,
    prefix,
    keyHash,
    scopes,
    expiresAt,
    createdAt: now,
  };

  await db.insert(adminApiKeys).values(newKeyRecord);

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: "CREATE_ADMIN_API_KEY",
    resource: "api_key",
    resourceId: newKeyRecord.id,
    ipAddress: ip,
    metadata: { name, scopes, prefix },
  });

  return apiSuccess(
    {
      id: newKeyRecord.id,
      name,
      prefix,
      scopes,
      fullKey, // Exibido apenas nesta resposta inicial
      expiresAt,
      message: "Guarde a chave completa agora. Ela não será exibida novamente por segurança.",
    },
    201
  );
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get("keyId");
  if (!keyId) return apiError("INVALID_REQUEST", "keyId obrigatório", 400);

  await db.delete(adminApiKeys).where(eq(adminApiKeys.id, keyId));

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: "REVOKE_ADMIN_API_KEY",
    resource: "api_key",
    resourceId: keyId,
    ipAddress: ip,
  });

  return apiSuccess({ message: "Chave API revogada com sucesso." });
}
