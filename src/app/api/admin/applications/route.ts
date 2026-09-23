import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { generateSecureToken } from "@/lib/security/crypto";
import { logAuditAction } from "@/lib/services/audit.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const createApplicationSchema = z.object({
  name: z.string().min(2).max(100),
  appId: z.string().min(2).max(64).regex(/^[a-z0-9_-]+$/, "O identificador deve conter apenas letras minúsculas, números, hífens ou underlines"),
  description: z.string().optional(),
  currentVersion: z.string().default("1.0.0"),
  downloadUrl: z.string().url().optional().or(z.literal("")),
});

// GET: Listar aplicações
export async function GET() {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const apps = await db.select().from(applications).orderBy(desc(applications.createdAt));
  return apiSuccess(apps);
}

// POST: Criar aplicação
export async function POST(req: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => null);
  const parseResult = createApplicationSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Dados inválidos", 400, parseResult.error.flatten());
  }

  const { name, appId, description, currentVersion, downloadUrl } = parseResult.data;

  // Verifica se o appId já existe
  const existing = await db.query.applications.findFirst({
    where: (apps, { eq }) => eq(apps.appId, appId.toLowerCase().trim()),
  });

  if (existing) {
    return apiError("INVALID_REQUEST", "Identificador de aplicação (App ID) já está em uso.", 400);
  }

  const apiSecret = generateSecureToken(32);
  const newApp = {
    id: crypto.randomUUID(),
    appId: appId.toLowerCase().trim(),
    name,
    description: description || null,
    status: "ACTIVE",
    currentVersion: currentVersion || "1.0.0",
    downloadUrl: downloadUrl || null,
    apiSecret,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(applications).values(newApp);

  await logAuditAction({
    action: "CREATE_APPLICATION",
    resource: "application",
    resourceId: newApp.id,
    ipAddress: extractClientIp(req.headers),
    metadata: { name, appId: newApp.appId },
  });

  return apiSuccess(newApp, 201);
}
