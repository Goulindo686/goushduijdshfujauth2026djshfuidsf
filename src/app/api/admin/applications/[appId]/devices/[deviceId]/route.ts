import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { devices, bans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

// DELETE: Remover/Resetar dispositivo
export async function DELETE(
  req: NextRequest,
  { params }: { params: { appId: string; deviceId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const [dev] = await db
    .select()
    .from(devices)
    .where(and(eq(devices.id, params.deviceId), eq(devices.applicationId, params.appId)))
    .limit(1);

  if (!dev) return apiError("INVALID_REQUEST", "Dispositivo não encontrado", 404);

  await db.delete(devices).where(eq(devices.id, dev.id));

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: "RESET_DEVICE_INDIVIDUAL",
    resource: "device",
    resourceId: dev.id,
    ipAddress: ip,
    metadata: { fingerprint: dev.deviceFingerprint },
  });

  return apiSuccess({ message: "Dispositivo desvinculado com sucesso." });
}

// POST: Banir dispositivo (App específico ou Global)
export async function POST(
  req: NextRequest,
  { params }: { params: { appId: string; deviceId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => ({}));
  const isGlobal = body?.isGlobal === true;
  const reason = body?.reason || (isGlobal ? "Bloqueio global de dispositivo" : "Dispositivo bloqueado pelo administrador");

  const [dev] = await db
    .select()
    .from(devices)
    .where(and(eq(devices.id, params.deviceId), eq(devices.applicationId, params.appId)))
    .limit(1);

  if (!dev) return apiError("INVALID_REQUEST", "Dispositivo não encontrado", 404);

  await db.update(devices).set({ status: "BANNED" }).where(eq(devices.id, dev.id));

  await db.insert(bans).values({
    id: crypto.randomUUID(),
    applicationId: isGlobal ? null : params.appId,
    type: "DEVICE",
    targetValue: dev.deviceFingerprint,
    reason,
    active: true,
    isGlobal,
    createdAt: new Date(),
  });

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: isGlobal ? "BAN_DEVICE_GLOBAL" : "BAN_DEVICE",
    resource: "device",
    resourceId: dev.id,
    ipAddress: ip,
    metadata: { fingerprint: dev.deviceFingerprint, isGlobal },
  });

  return apiSuccess({ 
    message: isGlobal ? "Dispositivo banido globalmente em todos os apps!" : "Dispositivo banido com sucesso nesta aplicação." 
  });
}
