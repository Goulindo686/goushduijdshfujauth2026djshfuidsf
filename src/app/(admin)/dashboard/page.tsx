"use client";

import * as React from "react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Layers, 
  Users, 
  Key, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Activity, 
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface DashboardData {
  cards: {
    totalApplications: number;
    totalUsers: number;
    totalLicenses: number;
    activeLicenses: number;
    authenticationsToday: number;
    authenticationsLast7Days: number;
    authFailuresToday: number;
    bannedUsers: number;
    expiredLicenses: number;
  };
  timeline: Array<{
    day: string;
    total: number;
    successes: number;
    failures: number;
  }>;
  recentActivity: Array<{
    id: string;
    event: string;
    userIdentifier: string | null;
    licenseKeyMasked: string | null;
    deviceFingerprint: string | null;
    ipAddress: string | null;
    status: string;
    createdAt: string;
    appName: string | null;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchDashboard = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error("Erro ao carregar dados do dashboard.");
      }
    } catch {
      toast.error("Erro de conexão com a API.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <>
      <Header
        title="Dashboard Geral"
        subtitle="Visão unificada das suas aplicações, licenças e telemetria de segurança"
      />

      <main className="w-full max-w-[1600px] mx-auto px-6 md:px-8 py-6 space-y-6">
        {/* Top bar com refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Métricas Globais</h2>
            <p className="text-xs text-neutral-400">Dados consolidados de todas as aplicações ativas</p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchDashboard();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#101012] border border-[#27272A] text-xs text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* 4 Cards Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-mono uppercase text-neutral-400">Total Aplicações</CardTitle>
              <Layers className="h-4 w-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold font-mono text-white">
                  {data?.cards.totalApplications ?? 0}
                </div>
              )}
              <p className="text-[11px] text-neutral-500 mt-1">Ambientes configurados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-mono uppercase text-neutral-400">Total Usuários</CardTitle>
              <Users className="h-4 w-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold font-mono text-white">
                  {data?.cards.totalUsers ?? 0}
                </div>
              )}
              <p className="text-[11px] text-neutral-500 mt-1">Contas registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-mono uppercase text-neutral-400">Licenças Ativas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {data?.cards.activeLicenses ?? 0}
                  <span className="text-xs font-normal text-neutral-500 ml-1.5">
                    / {data?.cards.totalLicenses ?? 0} total
                  </span>
                </div>
              )}
              <p className="text-[11px] text-neutral-500 mt-1">
                {data?.cards.expiredLicenses ?? 0} expiradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-mono uppercase text-neutral-400">Autenticações Hoje</CardTitle>
              <Activity className="h-4 w-4 text-neutral-300" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold font-mono text-white">
                  {data?.cards.authenticationsToday ?? 0}
                </div>
              )}
              <p className="text-[11px] text-neutral-500 mt-1">
                {data?.cards.authenticationsLast7Days ?? 0} nos últimos 7 dias
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Linha Secundária: Métricas de Segurança e Gráfico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Atividade de Autenticação (Timeline 7D) */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-sm">Autenticações nos Últimos 7 Dias</CardTitle>
                <p className="text-xs text-neutral-400 mt-0.5">Volume diário de validações e autorizações</p>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <span className="h-2 w-2 rounded-full bg-white"></span> Total
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Sucesso
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span> Falha
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : data?.timeline && data.timeline.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {data.timeline.map((item) => {
                    const maxVal = Math.max(...data.timeline.map((t) => t.total), 1);
                    const pct = Math.round((item.total / maxVal) * 100);
                    return (
                      <div key={item.day} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-neutral-400">{item.day}</span>
                          <span className="text-neutral-200">
                            {item.total} reqs ({item.successes} ok, {item.failures} erros)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#18181B] rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 transition-all duration-300"
                            style={{ width: `${item.total ? (item.successes / item.total) * pct : 0}%` }}
                          />
                          <div
                            className="bg-rose-500 transition-all duration-300"
                            style={{ width: `${item.total ? (item.failures / item.total) * pct : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-neutral-500 font-mono">
                  Nenhuma atividade registrada nos últimos 7 dias.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cards de Segurança */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase text-neutral-400">Falhas de Auth Hoje</CardTitle>
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold font-mono text-rose-400">
                  {data?.cards.authFailuresToday ?? 0}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Tentativas inválidas ou bloqueadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase text-neutral-400">Usuários Banidos</CardTitle>
                <ShieldAlert className="h-4 w-4 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold font-mono text-neutral-300">
                  {data?.cards.bannedUsers ?? 0}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Bloqueios ativos por violação</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Atividade Recente */}
        <Card className="border-[#1C1C1F] bg-[#08080A]">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-sm">Atividade Recente</CardTitle>
              <p className="text-xs text-neutral-400 mt-0.5">Últimos eventos de validação e autenticação em tempo real</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : data?.recentActivity && data.recentActivity.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#1C1C1F] text-neutral-400 font-mono uppercase text-[10px] bg-[#0A0A0C]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Data/Hora</th>
                      <th className="px-4 py-3 font-medium">Aplicação</th>
                      <th className="px-4 py-3 font-medium">Evento</th>
                      <th className="px-4 py-3 font-medium">Identificador / Licença</th>
                      <th className="px-4 py-3 font-medium">Dispositivo (HWID)</th>
                      <th className="px-4 py-3 font-medium">IP</th>
                      <th className="px-4 py-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141416]">
                    {data.recentActivity.map((log) => (
                      <tr key={log.id} className="hover:bg-[#0E0E12] transition-colors">
                        <td className="px-4 py-3 font-mono text-neutral-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{log.appName || "—"}</td>
                        <td className="px-4 py-3 font-mono text-neutral-300">{log.event}</td>
                        <td className="px-4 py-3 font-mono text-neutral-300">
                          {log.userIdentifier || log.licenseKeyMasked || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-500 truncate max-w-[160px]" title={log.deviceFingerprint || ""}>
                          {log.deviceFingerprint || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-500">{log.ipAddress || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <StatusBadge status={log.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-8 text-xs text-neutral-500 font-mono">
                Nenhum evento registrado até o momento.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
