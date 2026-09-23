import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { applications, remoteVariables } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
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
  const varKey = searchParams.get("key");

  if (!appId) return apiError("INVALID_REQUEST", "app_id é obrigatório", 400);

  const [app] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.appId, appId.toLowerCase()))
    .limit(1);

  if (!app) return apiError("APPLICATION_NOT_FOUND", "Aplicação não encontrada", 404);

  const conditions = [
    eq(remoteVariables.applicationId, app.id),
    eq(remoteVariables.isClientExposed, true), // Apenas variáveis autorizadas para o cliente
  ];

  if (varKey) {
    conditions.push(eq(remoteVariables.key, varKey.trim()));
  }

  const vars = await db
    .select({
      key: remoteVariables.key,
      value: remoteVariables.value,
      type: remoteVariables.type,
    })
    .from(remoteVariables)
    .where(and(...conditions));

  // Converte tipos conforme registrado
  const formatted: Record<string, unknown> = {};
  for (const item of vars) {
    if (item.type === "BOOLEAN") {
      formatted[item.key] = item.value === "true";
    } else if (item.type === "NUMBER") {
      formatted[item.key] = Number(item.value);
    } else if (item.type === "JSON") {
      try {
        formatted[item.key] = JSON.parse(item.value);
      } catch {
        formatted[item.key] = item.value;
      }
    } else {
      formatted[item.key] = item.value;
    }
  }

  return apiSuccess({ variables: formatted });
}
