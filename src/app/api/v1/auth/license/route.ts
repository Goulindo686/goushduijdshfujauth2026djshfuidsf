import { NextRequest } from "next/server";
import { z } from "zod";
import { LicenseService } from "@/lib/services/license.service";
import { apiError, apiSuccess } from "@/lib/api/response";
import { checkRateLimit, extractClientIp } from "@/lib/security/rate-limiter";

const licenseAuthSchema = z.object({
  app_id: z.string().min(1, "app_id é obrigatório"),
  license: z.string().min(1, "license é obrigatória"),
  hwid: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);

  // Rate Limiting
  const rateLimit = checkRateLimit(ip, "LICENSE_AUTH");
  if (!rateLimit.allowed) {
    return apiError(
      "RATE_LIMITED",
      `Limite de requisições excedido. Tente novamente em ${rateLimit.resetInSeconds}s.`,
      429
    );
  }

  const body = await req.json().catch(() => null);
  const parseResult = licenseAuthSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Requisição inválida", 400, parseResult.error.flatten());
  }

  const { app_id, license, hwid } = parseResult.data;

  try {
    const result = await LicenseService.validateAndAuthenticate({
      appId: app_id,
      licenseKey: license,
      deviceFingerprint: hwid,
      ipAddress: ip,
    });

    if (!result.success) {
      return apiError(
        (result.errorCode as any) || "INVALID_LICENSE",
        result.errorMessage || "Falha na validação da licença",
        400
      );
    }

    return apiSuccess(result.data);
  } catch (err: unknown) {
    console.error("[API v1 /auth/license] Erro interno:", err);
    return apiError("INTERNAL_SERVER_ERROR", "Erro interno no servidor ao processar licença", 500);
  }
}
