import { cookies } from "next/headers";
import { db } from "../db";
import { admins, adminSessions } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";
import { generateSecureToken, sha256 } from "../security/crypto";

const SESSION_COOKIE_NAME = "gouauth_admin_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export async function createAdminSession(adminId: string, ipAddress?: string, userAgent?: string): Promise<string> {
  const rawToken = generateSecureToken(32);
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(adminSessions).values({
    id: crypto.randomUUID(),
    adminId,
    tokenHash,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    expiresAt,
  });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });

  return rawToken;
}

export async function getAdminFromSession() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const tokenHash = sha256(token);
    const now = new Date();

    const [session] = await db
      .select({
        sessionId: adminSessions.id,
        adminId: admins.id,
        email: admins.email,
        totpEnabled: admins.totpEnabled,
      })
      .from(adminSessions)
      .innerJoin(admins, eq(adminSessions.adminId, admins.id))
      .where(and(eq(adminSessions.tokenHash, tokenHash), gt(adminSessions.expiresAt, now)))
      .limit(1);

    if (!session) return null;

    return {
      adminId: session.adminId,
      email: session.email,
      totpEnabled: session.totpEnabled,
      sessionId: session.sessionId,
    };
  } catch {
    return null;
  }
}

export async function destroyAdminSession(): Promise<void> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const tokenHash = sha256(token);
      await db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenHash));
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (e) {
    console.error("Erro ao destruir sessão:", e);
  }
}
