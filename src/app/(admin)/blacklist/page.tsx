"use client";

import * as React from "react";
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  RefreshCw, 
  Trash2, 
  Laptop, 
  Globe, 
  User, 
  Copy,
  AlertTriangle,
  X,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";

interface GlobalBan {
  id: string;
  type: "DEVICE" | "IP" | "USER";
  targetValue: string;
  reason: string;
  notes?: string | null;
  active: boolean;
  isGlobal: boolean;
  createdAt: string;
}

interface BlacklistStats {
  totalBans: number;
  totalHwid: number;
  totalIp: number;
  totalUser: number;
}

export default function BlacklistPage() {
  const [bans, setBans] = React.useState<GlobalBan[]>([]);
  const [stats, setStats] = React.useState<BlacklistStats>({
    totalBans: 0,
    totalHwid: 0,
    totalIp: 0,
    totalUser: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalType, setModalType] = React.useState<"DEVICE" | "IP" | "USER">("DEVICE");
  const [modalTarget, setModalTarget] = React.useState("");
  const [modalReason, setModalReason] = React.useState("");
  const [modalNotes, setModalNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const fetchBans = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "ALL") params.set("type", typeFilter);

      const res = await fetch(`/api/admin/blacklist?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setBans(json.data.bans);
        setStats(json.data.stats);
      } else {
        toast.error("Erro ao carregar banimentos globais.");
      }
    } catch {
      toast.error("Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  React.useEffect(() => {
    fetchBans();
  }, [fetchBans]);

  const handleCreateBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTarget.trim()) {
      toast.error("Informe o alvo (HWID, IP ou Usuário).");
      return;
    }
    if (!modalReason.trim()) {
      toast.error("Informe o motivo do banimento.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: modalType,
          targetValue: modalTarget.trim(),
          reason: modalReason.trim(),
          notes: modalNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message || "Banimento global aplicado!");
        setIsModalOpen(false);
        setModalTarget("");
        setModalReason("");
        setModalNotes("");
        fetchBans();
      } else {
        toast.error(json.error?.message || "Erro ao aplicar banimento.");
      }
    } catch {
      toast.error("Falha ao comunicar com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnban = async (banId: string, target: string) => {
    if (!confirm(`Deseja realmente desbanir globalmente: "${target}"?`)) return;

    try {
      const res = await fetch(`/api/admin/blacklist?banId=${banId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Alvo desbanido globalmente!");
        fetchBans();
      } else {
        toast.error(json.error?.message || "Erro ao desbanir.");
      }
    } catch {
      toast.error("Falha na conexão.");
    }
  };

  return (
    <>
      <Header
        title="Blacklist Global"
        subtitle="Central de bloqueio de computadores (HWID), IPs e usuários em todas as aplicações"
      />

      <main className="w-full max-w-[1600px] mx-auto px-6 md:px-8 py-6 space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                Bloqueios em Nível Global
              </h2>
              <Badge variant="danger" className="text-[10px]">
                Multi-App
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Alvos cadastrados aqui são rejeitados instantaneamente em <strong className="text-white">todas</strong> as aplicações ativas da sua conta.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBans}
              className="flex items-center space-x-1.5 border-[#27272A] text-neutral-300 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Atualizar</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Ban Global</span>
            </Button>
          </div>
        </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#1C1C1F] bg-[#0A0A0C]">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-neutral-500 text-[11px] font-mono uppercase">
              Total Bloqueados
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white font-mono">
              {stats.totalBans}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-neutral-400">
            Alvos banidos em todo o ecossistema
          </CardContent>
        </Card>

        <Card className="border-[#1C1C1F] bg-[#0A0A0C]">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-neutral-500 text-[11px] font-mono uppercase flex items-center gap-1.5">
              <Laptop className="h-3 w-3 text-neutral-400" />
              HWIDs (Computadores)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white font-mono">
              {stats.totalHwid}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-neutral-400">
            Máquinas bloqueadas fisicamente
          </CardContent>
        </Card>

        <Card className="border-[#1C1C1F] bg-[#0A0A0C]">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-neutral-500 text-[11px] font-mono uppercase flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-neutral-400" />
              Endereços IP
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white font-mono">
              {stats.totalIp}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-neutral-400">
            Faixas de rede barradas
          </CardContent>
        </Card>

        <Card className="border-[#1C1C1F] bg-[#0A0A0C]">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-neutral-500 text-[11px] font-mono uppercase flex items-center gap-1.5">
              <User className="h-3 w-3 text-neutral-400" />
              Usuários / Contas
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white font-mono">
              {stats.totalUser}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-neutral-400">
            Contas suspensas globalmente
          </CardContent>
        </Card>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0A0A0C] p-3 rounded-lg border border-[#1C1C1F]">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por HWID, IP, usuário ou motivo..."
            className="pl-9 bg-[#040405] border-[#222226] text-xs h-9"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#040405] border border-[#222226] text-neutral-300 text-xs rounded-md h-9 px-3 focus:outline-none focus:border-neutral-500"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="DEVICE">HWID (Computador)</option>
            <option value="IP">Endereço IP</option>
            <option value="USER">Usuário</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-[#1C1C1F] bg-[#08080A]">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : bans.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-500 font-mono">
              {search || typeFilter !== "ALL"
                ? "Nenhum banimento encontrado para os filtros selecionados."
                : "Nenhum banimento global ativo no momento. Seu ambiente está livre de bloqueios globais."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#1C1C1F] text-neutral-400 font-mono uppercase text-[10px] bg-[#0A0A0C]">
                  <tr>
                    <th className="px-4 py-3 w-32 font-medium">Tipo</th>
                    <th className="px-4 py-3 w-80 font-medium">Alvo Bloqueado</th>
                    <th className="px-4 py-3 min-w-[180px] font-medium">Motivo</th>
                    <th className="px-4 py-3 w-48 font-medium">Notas</th>
                    <th className="px-4 py-3 w-44 font-medium">Data do Ban</th>
                    <th className="px-4 py-3 w-48 font-medium">Escopo</th>
                    <th className="px-4 py-3 w-28 text-right font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141416]">
                  {bans.map((ban) => {
                    const isDevice = ban.type === "DEVICE";
                    const isIp = ban.type === "IP";

                    return (
                      <tr key={ban.id} className="hover:bg-[#0E0E12] transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#18181B] text-neutral-300 border border-[#27272A]">
                            {isDevice && <Laptop className="h-3 w-3 text-amber-400" />}
                            {isIp && <Globe className="h-3 w-3 text-cyan-400" />}
                            {!isDevice && !isIp && <User className="h-3 w-3 text-purple-400" />}
                            {ban.type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-medium text-white">
                          <div className="flex items-center space-x-2">
                            <span className="truncate max-w-xs">{ban.targetValue}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(ban.targetValue);
                                toast.success("Copiado!");
                              }}
                              className="text-neutral-500 hover:text-white p-0.5 transition-colors"
                              title="Copiar alvo"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-neutral-300 max-w-xs truncate">
                          {ban.reason}
                        </td>
                        <td className="px-4 py-3.5 text-neutral-500 font-mono text-[11px] max-w-xs truncate">
                          {ban.notes || "—"}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-neutral-500 text-[11px] whitespace-nowrap">
                          {new Date(ban.createdAt).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Badge variant="danger" className="text-[10px]">
                            GLOBAL (TODOS OS APPS)
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnban(ban.id, ban.targetValue)}
                            className="h-7 px-2.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-[#121A15] border-[#1C2C22]"
                          >
                            Desbanir
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Novo Banimento Global */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0C0C0E] border border-[#27272A] rounded-xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1C1C1F] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                <h3 className="text-sm font-bold text-white">Novo Banimento Global</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBan} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-neutral-400">
                  Tipo de Alvo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "DEVICE", label: "HWID", icon: Laptop },
                    { id: "IP", label: "IP", icon: Globe },
                    { id: "USER", label: "Usuário", icon: User },
                  ].map((t) => {
                    const Icon = t.icon;
                    const selected = modalType === t.id;
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setModalType(t.id as any)}
                        className={`flex items-center justify-center space-x-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                          selected
                            ? "bg-white text-black border-white shadow-sm"
                            : "bg-[#141416] text-neutral-400 border-[#222226] hover:text-white"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-neutral-400">
                  {modalType === "DEVICE" && "Código do HWID / Computador"}
                  {modalType === "IP" && "Endereço IP (ex: 187.85.95.53)"}
                  {modalType === "USER" && "Nome do Usuário"}
                </label>
                <Input
                  value={modalTarget}
                  onChange={(e) => setModalTarget(e.target.value)}
                  placeholder={
                    modalType === "DEVICE"
                      ? "Ex: S-1-5-21-3021477846-3441347081..."
                      : modalType === "IP"
                      ? "Ex: 192.168.1.1"
                      : "Ex: usuario123"
                  }
                  className="bg-[#050507] border-[#222226] text-xs font-mono text-white h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-neutral-400">
                  Motivo do Banimento
                </label>
                <Input
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="Ex: Fraude, tentativa de revenda, leak de build..."
                  className="bg-[#050507] border-[#222226] text-xs text-white h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-neutral-400">
                  Notas Internas (Opcional)
                </label>
                <Input
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Ex: Discord do indivíduo, histórico anterior..."
                  className="bg-[#050507] border-[#222226] text-xs text-white h-9"
                />
              </div>

              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-[11px] text-rose-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>
                  <strong>Atenção:</strong> Esse alvo não conseguirá logar, ativar licenças ou abrir <strong>nenhum</strong> dos seus softwares conectados ao GouAuth.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1C1C1F]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="border-[#27272A] text-neutral-300 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-medium"
                >
                  {submitting ? "Aplicando..." : "Confirmar Ban Global"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </main>
    </>
  );
}
