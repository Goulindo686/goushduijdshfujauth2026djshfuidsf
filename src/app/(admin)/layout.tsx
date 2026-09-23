import { redirect } from "next/navigation";
import { getAdminFromSession } from "@/lib/auth/admin-session";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminFromSession();
  if (!admin) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-black text-neutral-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
