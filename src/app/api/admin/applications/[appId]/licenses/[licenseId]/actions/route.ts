import { NextRequest } from "next/server";
import { z } from "zod";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { LicenseService } from "@/lib/services/license.service";
import { extractClientIp } from "@/lib/security/rate-limiter";

const actionSchema = z.object({
  action: z.enum(["reset_device", "add_time", "remove_time", "pause", "reactivate", "revoke", "ban"]),
  days: z.number().int().positive().optional(),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { appId: string; licenseId: string } }
) {
  const admin = await getAdminFromSession();
  if (!admin) return apiError("UNAUTHORIZED", "Não autenticado", 401);

  const body = await req.json().catch(() => null);
  const parseResult = actionSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError("INVALID_REQUEST", "Ação inválida", 400);
  }

  const { action, days, reason } = parseResult.data;
  const ip = extractClientIp(req.headers);

  switch (action) {
    case "reset_device":
      await LicenseService.resetDevices(params.licenseId, ip);
      return apiSuccess({ message: "Dispositivos vinculados foram resetados com sucesso." });

    case "add_time":
      if (!days) return apiError("INVALID_REQUEST", "Quantidade de dias obrigatória", 400);
      const newExpiryAdd = await LicenseService.adjustTime(params.licenseId, days, ip);
      return apiSuccess({ message: `Adicionado(s) ${days} dia(s).`, newExpiresAt: newExpiryAdd });

    case "remove_time":
      if (!days) return apiError("INVALID_REQUEST", "Quantidade de dias obrigatória", 400);
      const newExpirySub = await LicenseService.adjustTime(params.licenseId, -days, ip);
      return apiSuccess({ message: `Removido(s) ${days} dia(s).`, newExpiresAt: newExpirySub });

    case "pause":
      await LicenseService.pauseLicense(params.licenseId, ip);
      return apiSuccess({ message: "Licença pausada com sucesso." });

    case "reactivate":
      await LicenseService.reactivateLicense(params.licenseId, ip);
      return apiSuccess({ message: "Licença reativada com sucesso." });

    case "revoke":
      await LicenseService.revokeLicense(params.licenseId, ip);
      return apiSuccess({ message: "Licença revogada." });

    case "ban":
      await LicenseService.banLicense(params.licenseId, reason || "Banido pelo administrador", ip);
      return apiSuccess({ message: "Licença banida com sucesso." });

    default:
      return apiError("INVALID_REQUEST", "Ação desconhecida", 400);
  }
}
