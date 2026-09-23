import { destroyAdminSession } from "@/lib/auth/admin-session";
import { apiSuccess } from "@/lib/api/response";

export async function POST() {
  await destroyAdminSession();
  return apiSuccess({ message: "Logout realizado com sucesso." });
}
