"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Layers, 
  ScrollText, 
  Settings, 
  BookOpen, 
  LogOut, 
  ShieldCheck,
  Code
} from "lucide-react";
import { toast } from "sonner";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      toast.success("Sessão encerrada com sucesso.");
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Applications", href: "/applications", icon: Layers },
    { label: "Guia de Conexão", href: "/connect", icon: Code },
    { label: "Global Logs", href: "/logs", icon: ScrollText },
    { label: "Documentation", href: "/docs", icon: BookOpen },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-[#1C1C1F] bg-[#070708] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div>
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-[#1C1C1F]">
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded bg-white text-black flex items-center justify-center font-bold text-xs tracking-tighter shadow-sm">
              GA
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">GouAuth</span>
            <span className="text-[10px] font-mono uppercase bg-[#18181B] text-neutral-400 border border-[#27272A] px-1.5 py-0.5 rounded">
              v1.0
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
            Menu Principal
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-[#18181B] text-white border border-[#27272A]"
                    : "text-neutral-400 hover:text-white hover:bg-[#101012]"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-neutral-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-[#1C1C1F]">
        <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[#0C0C0E] border border-[#1C1C1F]">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="h-6 w-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[11px] text-neutral-300 font-medium shrink-0">
              A
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">Administrador</p>
              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Online
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sair da conta"
            className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-[#18181B] rounded transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
