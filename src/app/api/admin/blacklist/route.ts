import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { bans } from "@/lib/db/schema";
import { eq, or, isNull, and, desc, sql } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const createBanSchema = z.object({
  type: z.enum(["DEVICE", "IP", "USER"]),
  targetValue: z.string().min(1, "Alvo é obrigatório"),
  reason: z.string().min(1, "Motivo é obrigatório"),
  notes: z.string().optional(),
});

// GET: Listar todos os banimentos globais + estatísticas
export async function GET(req: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim().toLowerCase();
  const typeFilter = searchParams.get("type");

  let query = db
    .select()
    .from(bans)
    .where(or(eq(bans.isGlobal, true), isNull(bans.applicationId)))
    .orderBy(desc(bans.createdAt));

  const allGlobalBans = await query;

  let filtered = allGlobalBans;
  if (typeFilter && ["DEVICE", "IP", "USER"].includes(typeFilter)) {
    filtered = filtered.filter(b => b.type === typeFilter);
  }
  if (search) {
    filtered = filtered.filter(
      b =>
        b.targetValue.toLowerCase().includes(search) ||
        b.reason.toLowerCase().includes(search) ||
        (b.notes && b.notes.toLowerCase().includes(search))
    );
  }

  const totalBans = allGlobalBans.filter(b => b.active).length;
  const totalHwid = allGlobalBans.filter(b => b.active && b.type === "DEVICE").length;
  const totalIp = allGlobalBans.filter(b => b.active && b.type === "IP").length;
  const totalUser = allGlobalBans.filter(b => b.active && b.type === "USER").length;

  return apiSuccess({
    bans: filtered,
    stats: {
      totalBans,
      totalHwid,
      totalIp,
      totalUser,
    },
  });
}

// POST: Criar novo banimento global
export async function POST(req: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => null);
  const parseResult = createBanSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados de banimento inválidos", 400);
  }

  const { type, targetValue, reason, notes } = parseResult.data;
  const ip = extractClientIp(req.headers);

  // Checa se já existe banimento global ativo para esse alvo
  const [existing] = await db
    .select()
    .from(bans)
    .where(
      and(
        eq(bans.type, type),
        eq(bans.targetValue, targetValue.trim()),
        eq(bans.active, true),
        or(eq(bans.isGlobal, true), isNull(bans.applicationId))
      )
    )
    .limit(1);

  if (existing) {
    return apiError("INVALID_REQUEST", `Este ${type} já possui um banimento global ativo.`, 409);
  }

  const banId = crypto.randomUUID();
  await db.insert(bans).values({
    id: banId,
    applicationId: null,
    type,
    targetValue: targetValue.trim(),
    reason: reason.trim(),
    notes: notes?.trim() || null,
    active: true,
    isGlobal: true,
    createdAt: new Date(),
  });

  await logAuditAction({
    action: "CREATE_GLOBAL_BAN",
    resource: "ban",
    resourceId: banId,
    ipAddress: ip,
    metadata: { type, targetValue: targetValue.trim(), reason },
  });

  return apiSuccess({ message: "Banimento global aplicado com sucesso!", banId }, 201);
}

// DELETE: Remover / Desbanir globalmente
export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const { searchParams } = new URL(req.url);
  const banId = searchParams.get("banId");
  if (!banId) return apiError("INVALID_REQUEST", "banId é obrigatório", 400);

  const [ban] = await db
    .select()
    .from(bans)
    .where(eq(bans.id, banId))
    .limit(1);

  if (!ban) return apiError("INVALID_REQUEST", "Banimento não encontrado", 404);

  await db.delete(bans).where(eq(bans.id, banId));

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: "REMOVE_GLOBAL_BAN",
    resource: "ban",
    resourceId: banId,
    ipAddress: ip,
    metadata: { type: ban.type, targetValue: ban.targetValue },
  });

  return apiSuccess({ message: "Alvo desbanido globalmente com sucesso." });
}
