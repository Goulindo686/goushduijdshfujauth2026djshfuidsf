import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { applicationUsers, plans } from "@/lib/db/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { hashPassword } from "@/lib/security/crypto";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const createUserSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  planId: z.string().optional().nullable(),
  durationDays: z.number().int().positive().nullable().optional(),
  notes: z.string().optional(),
});

// GET: Listagem paginada de usuários da aplicação
export async function GET(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status")?.trim().toUpperCase();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
  const offset = (page - 1) * limit;

  const conditions = [eq(applicationUsers.applicationId, params.appId)];

  if (status && status !== "ALL") {
    conditions.push(eq(applicationUsers.status, status));
  }

  if (search) {
    conditions.push(
      or(
        like(applicationUsers.username, `%${search}%`),
        like(applicationUsers.email, `%${search}%`),
        like(applicationUsers.notes, `%${search}%`)
      )!
    );
  }

  const whereClause = and(...conditions);

  const [totalRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(applicationUsers)
    .where(whereClause);

  const total = totalRes?.count || 0;

  const items = await db
    .select({
      id: applicationUsers.id,
      username: applicationUsers.username,
      email: applicationUsers.email,
      status: applicationUsers.status,
      expiresAt: applicationUsers.expiresAt,
      lastLoginAt: applicationUsers.lastLoginAt,
      notes: applicationUsers.notes,
      createdAt: applicationUsers.createdAt,
      planName: plans.name,
      planLevel: plans.level,
    })
    .from(applicationUsers)
    .leftJoin(plans, eq(applicationUsers.planId, plans.id))
    .where(whereClause)
    .orderBy(desc(applicationUsers.createdAt))
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

// POST: Criar usuário para a aplicação
export async function POST(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => null);
  const parseResult = createUserSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400, parseResult.error.flatten());
  }

  const { username, password, email, planId, durationDays, notes } = parseResult.data;

  // Verifica duplicidade de username nesta app
  const [existing] = await db
    .select()
    .from(applicationUsers)
    .where(
      and(
        eq(applicationUsers.applicationId, params.appId),
        eq(applicationUsers.username, username.trim())
      )
    )
    .limit(1);

  if (existing) {
    return apiError("INVALID_REQUEST", "Nome de usuário já existe nesta aplicação.", 400);
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();
  const expiresAt = durationDays ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000) : null;

  const newUser = {
    id: crypto.randomUUID(),
    applicationId: params.appId,
    planId: planId || null,
    username: username.trim(),
    passwordHash,
    email: email || null,
    status: "ACTIVE",
    expiresAt,
    notes: notes || null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(applicationUsers).values(newUser);

  const ip = extractClientIp(req.headers);
  await logAuditAction({
    action: "CREATE_APPLICATION_USER",
    resource: "user",
    resourceId: newUser.id,
    ipAddress: ip,
    metadata: { username: newUser.username, applicationId: params.appId },
  });

  return apiSuccess(
    {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      status: newUser.status,
      expiresAt: newUser.expiresAt,
    },
    201
  );
}
