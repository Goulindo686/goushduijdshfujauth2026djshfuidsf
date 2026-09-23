import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { applications, licenses, applicationUsers, devices, authLogs, bans } from "@/lib/db/schema";
import { eq, sql, gte, and, desc } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Totais
  const [totalAppsRes] = await db.select({ val: sql<number>`count(*)::int` }).from(applications);
  const [totalUsersRes] = await db.select({ val: sql<number>`count(*)::int` }).from(applicationUsers);
  const [totalLicensesRes] = await db.select({ val: sql<number>`count(*)::int` }).from(licenses);
  const [activeLicensesRes] = await db.select({ val: sql<number>`count(*)::int` }).from(licenses).where(eq(licenses.status, "ACTIVE"));
  const [bannedUsersRes] = await db.select({ val: sql<number>`count(*)::int` }).from(applicationUsers).where(eq(applicationUsers.status, "BANNED"));
  const [expiredLicensesRes] = await db.select({ val: sql<number>`count(*)::int` }).from(licenses).where(eq(licenses.status, "EXPIRED"));

  // 2. Autenticações
  const [authTodayRes] = await db
    .select({ val: sql<number>`count(*)::int` })
    .from(authLogs)
    .where(gte(authLogs.createdAt, dayAgo));

  const [auth7dRes] = await db
    .select({ val: sql<number>`count(*)::int` })
    .from(authLogs)
    .where(gte(authLogs.createdAt, sevenDaysAgo));

  const [failedAuthTodayRes] = await db
    .select({ val: sql<number>`count(*)::int` })
    .from(authLogs)
    .where(and(gte(authLogs.createdAt, dayAgo), eq(authLogs.status, "FAILED")));

  // 3. Timeline de autenticações dos últimos 7 dias agrupados por dia
  const timelineRes = await db.execute(sql`
    SELECT to_char(created_at, 'YYYY-MM-DD') as day,
           count(*)::int as total,
           count(CASE WHEN status = 'SUCCESS' THEN 1 END)::int as successes,
           count(CASE WHEN status != 'SUCCESS' THEN 1 END)::int as failures
    FROM auth_logs
    WHERE created_at >= ${sevenDaysAgo}
    GROUP BY day
    ORDER BY day ASC
  `);

  // 4. Atividades recentes
  const recentLogs = await db
    .select({
      id: authLogs.id,
      event: authLogs.event,
      userIdentifier: authLogs.userIdentifier,
      licenseKeyMasked: authLogs.licenseKeyMasked,
      deviceFingerprint: authLogs.deviceFingerprint,
      ipAddress: authLogs.ipAddress,
      status: authLogs.status,
      createdAt: authLogs.createdAt,
      appName: applications.name,
    })
    .from(authLogs)
    .leftJoin(applications, eq(authLogs.applicationId, applications.id))
    .orderBy(desc(authLogs.createdAt))
    .limit(10);

  return apiSuccess({
    cards: {
      totalApplications: totalAppsRes?.val || 0,
      totalUsers: totalUsersRes?.val || 0,
      totalLicenses: totalLicensesRes?.val || 0,
      activeLicenses: activeLicensesRes?.val || 0,
      authenticationsToday: authTodayRes?.val || 0,
      authenticationsLast7Days: auth7dRes?.val || 0,
      authFailuresToday: failedAuthTodayRes?.val || 0,
      bannedUsers: bannedUsersRes?.val || 0,
      expiredLicenses: expiredLicensesRes?.val || 0,
    },
    timeline: timelineRes.rows || [],
    recentActivity: recentLogs,
  });
}
