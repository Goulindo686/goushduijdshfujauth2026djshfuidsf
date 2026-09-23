import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { bans } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const createBanSchema = z.object({
  type: z.enum(["USER", "LICENSE", "DEVICE", "IP"]),
  targetValue: z.string().min(1),
  reason: z.string().min(1),
  notes: z.string().optional(),
});

// GET: Listar banimentos da aplicação
export async function GET(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const banList = await db
    .select()
    .from(bans)
    .where(eq(bans.applicationId, params.appId))
    .orderBy(desc(bans.createdAt));

  return apiSuccess(banList);
}

// POST: Criar banimento
export async function POST(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => null);
  const parseResult = createBanSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400);
  }

  const { type, targetValue, reason, notes } = parseResult.data;

  const newBan = {
    id: crypto.randomUUID(),
    applicationId: params.appId,
    type,
    targetValue: targetValue.trim(),
    reason,
    notes: notes || null,
    active: true,
    createdAt: new Date(),
  };

  await db.insert(bans).values(newBan);

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: "BAN_RESOURCE",
    resource: "ban",
    resourceId: newBan.id,
    ipAddress: ip,
    metadata: { type, targetValue },
  });

  return apiSuccess(newBan, 201);
}

// DELETE: Desbanir (desativar ban)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const { searchParams } = new URL(req.url);
  const banId = searchParams.get("banId");
  if (!banId) return apiError("INVALID_REQUEST", "ID do banimento não fornecido", 400);

  await db
    .update(bans)
    .set({ active: false })
    .where(and(eq(bans.id, banId), eq(bans.applicationId, params.appId)));

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: "UNBAN_RESOURCE",
    resource: "ban",
    resourceId: banId,
    ipAddress: ip,
  });

  return apiSuccess({ message: "Desbanido com sucesso." });
}
