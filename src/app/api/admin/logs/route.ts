import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authLogs, applications } from "@/lib/db/schema";
import { eq, desc, and, sql, like, or } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status")?.trim().toUpperCase();
  const appId = searchParams.get("appId")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
  const offset = (page - 1) * limit;

  const conditions = [];

  if (appId && appId !== "ALL") {
    conditions.push(eq(authLogs.applicationId, appId));
  }

  if (status && status !== "ALL") {
    conditions.push(eq(authLogs.status, status));
  }

  if (search) {
    conditions.push(
      or(
        like(authLogs.event, `%${search}%`),
        like(authLogs.userIdentifier, `%${search}%`),
        like(authLogs.licenseKeyMasked, `%${search}%`),
        like(authLogs.ipAddress, `%${search}%`),
        like(authLogs.deviceFingerprint, `%${search}%`)
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(authLogs)
    .where(whereClause);

  const total = totalRes?.count || 0;

  const items = await db
    .select({
      id: authLogs.id,
      event: authLogs.event,
      userIdentifier: authLogs.userIdentifier,
      licenseKeyMasked: authLogs.licenseKeyMasked,
      ipAddress: authLogs.ipAddress,
      deviceFingerprint: authLogs.deviceFingerprint,
      status: authLogs.status,
      failureReason: authLogs.failureReason,
      createdAt: authLogs.createdAt,
      appName: applications.name,
    })
    .from(authLogs)
    .leftJoin(applications, eq(authLogs.applicationId, applications.id))
    .where(whereClause)
    .orderBy(desc(authLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return apiSuccess({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
