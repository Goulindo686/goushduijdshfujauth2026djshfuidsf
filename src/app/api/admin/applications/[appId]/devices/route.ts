import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { devices, licenses, applicationUsers } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const deviceList = await db
    .select({
      id: devices.id,
      deviceFingerprint: devices.deviceFingerprint,
      firstSeen: devices.firstSeen,
      lastSeen: devices.lastSeen,
      status: devices.status,
      licenseKey: licenses.key,
      username: applicationUsers.username,
    })
    .from(devices)
    .leftJoin(licenses, eq(devices.licenseId, licenses.id))
    .leftJoin(applicationUsers, eq(devices.userId, applicationUsers.id))
    .where(eq(devices.applicationId, params.appId))
    .orderBy(desc(devices.lastSeen))
    .limit(100);

  return apiSuccess(deviceList);
}
