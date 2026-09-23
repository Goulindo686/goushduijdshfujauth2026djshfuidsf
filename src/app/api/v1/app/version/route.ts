import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { applications, applicationVersions } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
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
  const clientVersion = searchParams.get("current_version");

  if (!appId) return apiError("INVALID_REQUEST", "app_id é obrigatório", 400);

  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.appId, appId.toLowerCase()))
    .limit(1);

  if (!app) return apiError("APPLICATION_NOT_FOUND", "Aplicação não encontrada", 404);

  // Busca última versão cadastrada
  const [latestVersion] = await db
    .select()
    .from(applicationVersions)
    .where(eq(applicationVersions.applicationId, app.id))
    .orderBy(desc(applicationVersions.createdAt))
    .limit(1);

  const currentVersionStr = latestVersion?.version || app.currentVersion || "1.0.0";
  const downloadUrl = latestVersion?.downloadUrl || app.downloadUrl;
  const isUpdateAvailable = clientVersion ? clientVersion !== currentVersionStr : false;

  return apiSuccess({
    latest_version: currentVersionStr,
    download_url: downloadUrl,
    update_available: isUpdateAvailable,
    update_required: latestVersion?.isRequired || false,
    changelog: latestVersion?.changelog || null,
    checksum: latestVersion?.checksum || null,
  });
}
