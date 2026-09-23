import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { licenses, plans, devices } from "@/lib/db/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { LicenseService } from "@/lib/services/license.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const generateLicensesSchema = z.object({
  quantity: z.number().int().min(1).max(500).default(1),
  planId: z.string().optional().nullable(),
  durationDays: z.number().int().positive().nullable().optional(), // null = Lifetime
  prefix: z.string().max(10).default("GOU"),
  deviceLimit: z.number().int().min(0).default(1),
  notes: z.string().optional(),
});

// GET: Listagem paginada com busca e filtros
export async function GET(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim().toUpperCase();
  const status = searchParams.get("status")?.trim().toUpperCase();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
  const offset = (page - 1) * limit;

  const conditions = [eq(licenses.applicationId, params.appId)];

  if (status && status !== "ALL") {
    conditions.push(eq(licenses.status, status));
  }

  if (search) {
    conditions.push(or(like(licenses.key, `%${search}%`), like(licenses.notes, `%${search}%`))!);
  }

  const whereClause = and(...conditions);

  // Total count
  const [totalRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(licenses)
    .where(whereClause);

  const total = totalRes?.count || 0;

  // Records com plano
  const items = await db
    .select({
      id: licenses.id,
      key: licenses.key,
      status: licenses.status,
      durationDays: licenses.durationDays,
      activatedAt: licenses.activatedAt,
      expiresAt: licenses.expiresAt,
      deviceLimit: licenses.deviceLimit,
      notes: licenses.notes,
      createdAt: licenses.createdAt,
      planName: plans.name,
    })
    .from(licenses)
    .leftJoin(plans, eq(licenses.planId, plans.id))
    .where(whereClause)
    .orderBy(desc(licenses.createdAt))
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

// POST: Geração de licenças (individual ou em massa)
export async function POST(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => null);
  const parseResult = generateLicensesSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Parâmetros inválidos", 400, parseResult.error.flatten());
  }

  const ip = extractClientIp(req.headers);
  const generatedKeys = await LicenseService.generateBulk(
    {
      applicationId: params.appId,
      ...parseResult.data,
    },
    ip
  );

  return apiSuccess(
    {
      quantity: generatedKeys.length,
      keys: generatedKeys,
      message: `${generatedKeys.length} licença(s) gerada(s) com sucesso.`,
    },
    201
  );
}
