import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiError, apiSuccess } from "@/lib/api/response";
import { checkRateLimit, extractClientIp } from "@/lib/security/rate-limiter";

export async function GET(req: NextRequest) {
  const ip = extractClientIp(req.headers);
  const rateLimit = checkRateLimit(ip, "PUBLIC_INFO");
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Limite de requisições excedido", 429);
  }

  const { searchParams } = new URL(req.url);
  const appId = searchParams.get("app_id");
  if (!appId) return apiError("INVALID_REQUEST", "app_id é obrigatório", 400);

  const [app] = await db
    .select({
      appId: applications.appId,
      name: applications.name,
      status: applications.status,
      maintenanceMessage: applications.maintenanceMessage,
      currentVersion: applications.currentVersion,
    })
    .from(applications)
    .where(eq(applications.appId, appId.toLowerCase()))
    .limit(1);

  if (!app) return apiError("APPLICATION_NOT_FOUND", "Aplicação não encontrada", 404);

  return apiSuccess(app);
}
