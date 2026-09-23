import { redirect } from "next/navigation";
import { getAdminFromSession } from "@/lib/auth/admin-session";

export default async function HomePage() {
  const admin = await getAdminFromSession();
  if (admin) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
