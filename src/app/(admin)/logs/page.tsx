"use client";

import * as React from "react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, ShieldAlert, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function LogsPage() {
  const [tab, setTab] = React.useState<"auth" | "audit">("auth");
  const [logs, setLogs] = React.useState<any[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const fetchAuthLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "30",
        search,
      });
      const res = await fetch(`/api/admin/logs?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.items);
        setTotalPages(json.data.pagination.totalPages);
      }
    } catch {
      toast.error("Erro ao carregar logs.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchAuditLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "30",
      });
      const res = await fetch(`/api/admin/audit?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setAuditLogs(json.data.items);
        setTotalPages(json.data.pagination.totalPages);
      }
    } catch {
      toast.error("Erro ao carregar trilha de auditoria.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  React.useEffect(() => {
    if (tab === "auth") fetchAuthLogs();
    else fetchAuditLogs();
  }, [tab, fetchAuthLogs, fetchAuditLogs]);

  return (
    <>
      <Header
        title="Logs & Auditoria"
        subtitle="Registro em tempo real de eventos de autenticação e ações administrativas"
      />

      <main className="p-8 space-y-6 max-w-7xl w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1 border-b sm:border-b-0 border-[#1C1C1F]">
            <button
              onClick={() => {
                setTab("auth");
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === "auth" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white"
              }`}
            >
              Autenticação de Clientes
            </button>
            <button
              onClick={() => {
                setTab("audit");
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === "audit" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white"
              }`}
            >
              Auditoria Administrativa
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {tab === "auth" && (
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                <Input
                  placeholder="Pesquisar evento, IP, chave..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 text-xs h-8"
                />
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => (tab === "auth" ? fetchAuthLogs() : fetchAuditLogs())}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : tab === "auth" ? (
              logs.length === 0 ? (
                <div className="p-12 text-center text-xs text-neutral-500 font-mono">
                  Nenhum log de autenticação encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#1C1C1F] text-neutral-500 font-mono uppercase text-[10px] bg-[#0A0A0C]">
                      <tr>
                        <th className="p-3">Data/Hora</th>
                        <th className="p-3">Aplicação</th>
                        <th className="p-3">Evento</th>
                        <th className="p-3">Identificador / Licença</th>
                        <th className="p-3">HWID</th>
                        <th className="p-3">IP</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141416]">
                      {logs.map((item) => (
                        <tr key={item.id} className="hover:bg-[#0E0E12]">
                          <td className="p-3 font-mono text-neutral-400 whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleString("pt-BR")}
                          </td>
                          <td className="p-3 font-medium text-white">{item.appName || "—"}</td>
                          <td className="p-3 font-mono text-neutral-300">{item.event}</td>
                          <td className="p-3 font-mono text-neutral-300">
                            {item.userIdentifier || item.licenseKeyMasked || "—"}
                          </td>
                          <td className="p-3 font-mono text-neutral-500 truncate max-w-[120px]">
                            {item.deviceFingerprint || "—"}
                          </td>
                          <td className="p-3 font-mono text-neutral-500">{item.ipAddress || "—"}</td>
                          <td className="p-3"><StatusBadge status={item.status} /></td>
                          <td className="p-3 text-right text-neutral-400 font-mono truncate max-w-xs">
                            {item.failureReason || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-500 font-mono">
                Nenhum registro de auditoria encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#1C1C1F] text-neutral-500 font-mono uppercase text-[10px] bg-[#0A0A0C]">
                    <tr>
                      <th className="p-3">Data/Hora</th>
                      <th className="p-3">Ação</th>
                      <th className="p-3">Recurso</th>
                      <th className="p-3">ID do Recurso</th>
                      <th className="p-3">IP do Admin</th>
                      <th className="p-3 text-right">Metadados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141416]">
                    {auditLogs.map((item) => (
                      <tr key={item.id} className="hover:bg-[#0E0E12]">
                        <td className="p-3 font-mono text-neutral-400 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString("pt-BR")}
                        </td>
                        <td className="p-3 font-mono font-medium text-white">{item.action}</td>
                        <td className="p-3 font-mono text-neutral-300">{item.resource}</td>
                        <td className="p-3 font-mono text-neutral-500 truncate max-w-[100px]">{item.resourceId || "—"}</td>
                        <td className="p-3 font-mono text-neutral-500">{item.ipAddress || "—"}</td>
                        <td className="p-3 text-right font-mono text-neutral-400 text-[11px] truncate max-w-xs">
                          {JSON.stringify(item.metadata || {})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 pt-2">
            <span>Página {page} de {totalPages}</span>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
