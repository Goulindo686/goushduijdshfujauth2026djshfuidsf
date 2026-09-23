import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { webhooks, webhookDeliveries } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { generateSecureToken } from "@/lib/security/crypto";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const webhookSchema = z.object({
  url: z.string().url("URL de webhook inválida"),
  events: z.array(z.string()).min(1, "Selecione ao menos um evento"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const hooks = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.applicationId, params.appId))
    .orderBy(desc(webhooks.createdAt));

  return apiSuccess(hooks);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => null);
  const parseResult = webhookSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400);
  }

  const { url, events } = parseResult.data;
  const secret = generateSecureToken(32);

  const newWebhook = {
    id: crypto.randomUUID(),
    applicationId: params.appId,
    url,
    secret,
    events,
    status: "ACTIVE",
    createdAt: new Date(),
  };

  await db.insert(webhooks).values(newWebhook);

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: "CREATE_WEBHOOK",
    resource: "webhook",
    resourceId: newWebhook.id,
    ipAddress: ip,
    metadata: { url, events },
  });

  return apiSuccess(newWebhook, 201);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const { searchParams } = new URL(req.url);
  const webhookId = searchParams.get("webhookId");
  if (!webhookId) return apiError("INVALID_REQUEST", "webhookId obrigatório", 400);

  await db
    .delete(webhooks)
    .where(and(eq(webhooks.id, webhookId), eq(webhooks.applicationId, params.appId)));

  return apiSuccess({ message: "Webhook removido com sucesso." });
}
