import { getAdminFromSession } from "@/lib/auth/admin-session";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  const admin = await getAdminFromSession();
  if (!admin) {
    return apiError("UNAUTHORIZED", "Sessão não autenticada ou expirada", 401);
  }

  return apiSuccess({
    adminId: admin.adminId,
    email: admin.email,
    totpEnabled: admin.totpEnabled,
  });
}
