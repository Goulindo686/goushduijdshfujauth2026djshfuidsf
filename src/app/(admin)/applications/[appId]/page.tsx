"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Key,
  Users,
  Layers,
  Smartphone,
  ShieldAlert,
  GitBranch,
  Code,
  Webhook as WebhookIcon,
  Settings as SettingsIcon,
  Play,
  Plus,
  Copy,
  Check,
  RotateCcw,
  Pause,
  PlayCircle,
  Clock,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Search,
  Ban
} from "lucide-react";
import { toast } from "sonner";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;

  const [activeTab, setActiveTab] = React.useState<
    "overview" | "licenses" | "users" | "plans" | "devices" | "versions" | "variables" | "webhooks" | "playground" | "settings"
  >("overview");

  // Application Data & Stats
  const [app, setApp] = React.useState<any>(null);
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [showSecret, setShowSecret] = React.useState(false);

  // Tab: Licenses State
  const [licensesList, setLicensesList] = React.useState<any[]>([]);
  const [licensesLoading, setLicensesLoading] = React.useState(false);
  const [licenseSearch, setLicenseSearch] = React.useState("");
  const [licenseStatusFilter, setLicenseStatusFilter] = React.useState("ALL");
  const [licensePage, setLicensePage] = React.useState(1);
  const [licenseTotalPages, setLicenseTotalPages] = React.useState(1);
  const [isGenModalOpen, setIsGenModalOpen] = React.useState(false);

  // License Gen Form
  const [genQuantity, setGenQuantity] = React.useState(1);
  const [genDuration, setGenDuration] = React.useState<number | "lifetime">(30);
  const [genPlanId, setGenPlanId] = React.useState("");
  const [genPrefix, setGenPrefix] = React.useState("GOU");
  const [genDeviceLimit, setGenDeviceLimit] = React.useState(1);
  const [genNotes, setGenNotes] = React.useState("");
  const [generatedKeysModal, setGeneratedKeysModal] = React.useState<string[] | null>(null);

  // Tab: Plans State
  const [plansList, setPlansList] = React.useState<any[]>([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = React.useState(false);
  const [planName, setPlanName] = React.useState("");
  const [planDuration, setPlanDuration] = React.useState<number | "lifetime">(30);
  const [planLevel, setPlanLevel] = React.useState(1);

  // Tab: Users State
  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [userSearch, setUserSearch] = React.useState("");
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [newUsername, setNewUsername] = React.useState("");
  const [newUserPassword, setNewUserPassword] = React.useState("");
  const [newUserPlanId, setNewUserPlanId] = React.useState("");

  // Tab: Devices & Bans State
  const [devicesList, setDevicesList] = React.useState<any[]>([]);
  const [bansList, setBansList] = React.useState<any[]>([]);

  // Tab: Versions State
  const [versionsList, setVersionsList] = React.useState<any[]>([]);
  const [isVersionModalOpen, setIsVersionModalOpen] = React.useState(false);
  const [newVersionNum, setNewVersionNum] = React.useState("");
  const [newVersionChangelog, setNewVersionChangelog] = React.useState("");
  const [newVersionDownload, setNewVersionDownload] = React.useState("");
  const [newVersionRequired, setNewVersionRequired] = React.useState(false);

  // Tab: Variables State
  const [variablesList, setVariablesList] = React.useState<any[]>([]);
  const [isVarModalOpen, setIsVarModalOpen] = React.useState(false);
  const [varKey, setVarKey] = React.useState("");
  const [varValue, setVarValue] = React.useState("");
  const [varType, setVarType] = React.useState<"STRING" | "NUMBER" | "BOOLEAN" | "JSON">("STRING");
  const [varClientExposed, setVarClientExposed] = React.useState(true);

  // Tab: Webhooks State
  const [webhooksList, setWebhooksList] = React.useState<any[]>([]);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = React.useState(false);
  const [webhookUrl, setWebhookUrl] = React.useState("");

  // Tab: Playground State
  const [playgroundEndpoint, setPlaygroundEndpoint] = React.useState<"license" | "login">("license");
  const [playgroundKey, setPlaygroundKey] = React.useState("");
  const [playgroundHwid, setPlaygroundHwid] = React.useState("HWID-TEST-USER-MACHINE-01");
  const [playgroundUser, setPlaygroundUser] = React.useState("");
  const [playgroundPass, setPlaygroundPass] = React.useState("");
  const [playgroundResponse, setPlaygroundResponse] = React.useState<any>(null);
  const [playgroundLatency, setPlaygroundLatency] = React.useState<number | null>(null);
  const [playgroundLoading, setPlaygroundLoading] = React.useState(false);

  // App Settings Form
  const [editName, setEditName] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [editStatus, setEditStatus] = React.useState("ACTIVE");
  const [editMaintMsg, setEditMaintMsg] = React.useState("");
  const [editVersion, setEditVersion] = React.useState("");

  // Fetch App Data
  const fetchAppData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/applications/${appId}`);
      const json = await res.json();
      if (json.success) {
        setApp(json.data.application);
        setStats(json.data.stats);
        setEditName(json.data.application.name);
        setEditDesc(json.data.application.description || "");
        setEditStatus(json.data.application.status);
        setEditMaintMsg(json.data.application.maintenanceMessage || "");
        setEditVersion(json.data.application.currentVersion || "1.0.0");
      } else {
        toast.error("Aplicação não encontrada.");
        router.push("/applications");
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }, [appId, router]);

  React.useEffect(() => {
    fetchAppData();
  }, [fetchAppData]);

  // Fetch Licenses
  const fetchLicenses = React.useCallback(async () => {
    setLicensesLoading(true);
    try {
      const query = new URLSearchParams({
        page: licensePage.toString(),
        limit: "25",
        status: licenseStatusFilter,
        search: licenseSearch,
      });
      const res = await fetch(`/api/admin/applications/${appId}/licenses?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLicensesList(json.data.items);
        setLicenseTotalPages(json.data.pagination.totalPages);
      }
    } catch {
      toast.error("Erro ao carregar licenças.");
    } finally {
      setLicensesLoading(false);
    }
  }, [appId, licensePage, licenseStatusFilter, licenseSearch]);

  // Fetch Plans
  const fetchPlans = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/applications/${appId}/plans`);
      const json = await res.json();
      if (json.success) setPlansList(json.data);
    } catch {
      console.error("Erro ao carregar planos");
    }
  }, [appId]);

  // Fetch Users
  const fetchUsers = React.useCallback(async () => {
    setUsersLoading(true);
    try {
      const query = new URLSearchParams({ search: userSearch });
      const res = await fetch(`/api/admin/applications/${appId}/users?${query.toString()}`);
      const json = await res.json();
      if (json.success) setUsersList(json.data.items);
    } catch {
      toast.error("Erro ao carregar usuários.");
    } finally {
      setUsersLoading(false);
    }
  }, [appId, userSearch]);

  // Fetch Devices & Bans
  const fetchDevicesAndBans = React.useCallback(async () => {
    try {
      const [devRes, banRes] = await Promise.all([
        fetch(`/api/admin/applications/${appId}/devices`),
        fetch(`/api/admin/applications/${appId}/bans`),
      ]);
      const [devJson, banJson] = await Promise.all([devRes.json(), banRes.json()]);
      if (devJson.success) setDevicesList(devJson.data);
      if (banJson.success) setBansList(banJson.data);
    } catch {
      console.error("Erro ao carregar dispositivos e bans");
    }
  }, [appId]);

  // Fetch Versions
  const fetchVersions = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/applications/${appId}/versions`);
      const json = await res.json();
      if (json.success) setVersionsList(json.data);
    } catch {
      console.error("Erro ao carregar versões");
    }
  }, [appId]);

  // Fetch Variables
  const fetchVariables = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/applications/${appId}/variables`);
      const json = await res.json();
      if (json.success) setVariablesList(json.data);
    } catch {
      console.error("Erro ao carregar variáveis");
    }
  }, [appId]);

  // Fetch Webhooks
  const fetchWebhooks = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/applications/${appId}/webhooks`);
      const json = await res.json();
      if (json.success) setWebhooksList(json.data);
    } catch {
      console.error("Erro ao carregar webhooks");
    }
  }, [appId]);

  // Tab switch effect
  React.useEffect(() => {
    if (activeTab === "licenses") {
      fetchLicenses();
      fetchPlans();
    } else if (activeTab === "plans") {
      fetchPlans();
    } else if (activeTab === "users") {
      fetchUsers();
      fetchPlans();
    } else if (activeTab === "devices") {
      fetchDevicesAndBans();
    } else if (activeTab === "versions") {
      fetchVersions();
    } else if (activeTab === "variables") {
      fetchVariables();
    } else if (activeTab === "webhooks") {
      fetchWebhooks();
    }
  }, [activeTab, fetchLicenses, fetchPlans, fetchUsers, fetchDevicesAndBans, fetchVersions, fetchVariables, fetchWebhooks]);

  // Bulk Generate Action
  const handleGenerateLicenses = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/applications/${appId}/licenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(genQuantity),
          durationDays: genDuration === "lifetime" ? null : Number(genDuration),
          planId: genPlanId || null,
          prefix: genPrefix,
          deviceLimit: Number(genDeviceLimit),
          notes: genNotes || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message);
        setIsGenModalOpen(false);
        setGeneratedKeysModal(json.data.keys);
        fetchLicenses();
        fetchAppData();
      } else {
        toast.error(json.error?.message || "Erro ao gerar licenças.");
      }
    } catch {
      toast.error("Erro de conexão.");
    }
  };

  // License Row Action
  const handleLicenseAction = async (licenseId: string, action: string, payload: any = {}) => {
    try {
      const res = await fetch(`/api/admin/applications/${appId}/licenses/${licenseId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message);
        fetchLicenses();
      } else {
        toast.error(json.error?.message || "Erro na ação.");
      }
    } catch {
      toast.error("Erro ao executar ação.");
    }
  };

  // Delete License
  const handleDeleteLicense = async (licenseId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta licença permanentemente?")) return;
    try {
      const res = await fetch(`/api/admin/applications/${appId}/licenses/${licenseId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Licença excluída com sucesso.");
        fetchLicenses();
        fetchAppData();
      }
    } catch {
      toast.error("Erro ao excluir licença.");
    }
  };

  // Create Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/applications/${appId}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planName,
          durationDays: planDuration === "lifetime" ? null : Number(planDuration),
          level: Number(planLevel),
          permissions: ["standard"],
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Plano criado!");
        setIsPlanModalOpen(false);
        setPlanName("");
        fetchPlans();
      }
    } catch {
      toast.error("Erro ao criar plano.");
    }
  };

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/applications/${appId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newUserPassword,
          planId: newUserPlanId || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Usuário criado com sucesso!");
        setIsUserModalOpen(false);
        setNewUsername("");
        setNewUserPassword("");
        fetchUsers();
        fetchAppData();
      } else {
        toast.error(json.error?.message || "Erro ao criar usuário.");
      }
    } catch {
      toast.error("Erro de conexão.");
    }
  };

  // Create Version
  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/applications/${appId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: newVersionNum,
          changelog: newVersionChangelog,
          downloadUrl: newVersionDownload,
          isRequired: newVersionRequired,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Versão cadastrada com sucesso!");
        setIsVersionModalOpen(false);
        setNewVersionNum("");
        setNewVersionChangelog("");
        setNewVersionDownload("");
        fetchVersions();
        fetchAppData();
      }
    } catch {
      toast.error("Erro ao criar versão.");
    }
  };

  // Create Variable
  const handleCreateVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/applications/${appId}/variables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: varKey,
          value: varValue,
          type: varType,
          isClientExposed: varClientExposed,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Variável remota criada!");
        setIsVarModalOpen(false);
        setVarKey("");
        setVarValue("");
        fetchVariables();
      }
    } catch {
      toast.error("Erro ao criar variável.");
    }
  };

  // Create Webhook
  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/applications/${appId}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          events: ["license.activated", "user.login"],
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Webhook configurado com sucesso!");
        setIsWebhookModalOpen(false);
        setWebhookUrl("");
        fetchWebhooks();
      }
    } catch {
      toast.error("Erro ao configurar webhook.");
    }
  };

  // Run API Playground Test
  const handleRunPlayground = async () => {
    setPlaygroundLoading(true);
    setPlaygroundResponse(null);
    const start = performance.now();

    try {
      let res;
      if (playgroundEndpoint === "license") {
        res = await fetch("/api/v1/auth/license", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            app_id: app.appId,
            license: playgroundKey,
            hwid: playgroundHwid,
          }),
        });
      } else {
        res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            app_id: app.appId,
            username: playgroundUser,
            password: playgroundPass,
            hwid: playgroundHwid,
          }),
        });
      }

      const elapsed = Math.round(performance.now() - start);
      setPlaygroundLatency(elapsed);
      const json = await res.json();
      setPlaygroundResponse({
        status: res.status,
        statusText: res.statusText,
        body: json,
      });
    } catch (err: any) {
      setPlaygroundResponse({
        status: 0,
        statusText: "Network Error",
        body: { error: err.message },
      });
    } finally {
      setPlaygroundLoading(false);
    }
  };

  // Update App Settings
  const handleUpdateAppSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          status: editStatus,
          maintenanceMessage: editMaintMsg,
          currentVersion: editVersion,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Configurações atualizadas!");
        fetchAppData();
      }
    } catch {
      toast.error("Erro ao salvar configurações.");
    }
  };

  // Delete Entire App
  const handleDeleteApp = async () => {
    if (!confirm(`TEM CERTEZA ABSOLUTA? Isso apagará a aplicação "${app.name}", todas as licenças, usuários e dados vinculados!`)) return;
    try {
      const res = await fetch(`/api/admin/applications/${appId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Aplicação excluída.");
        router.push("/applications");
      }
    } catch {
      toast.error("Erro ao excluir aplicação.");
    }
  };

  if (loading || !app) {
    return (
      <>
        <Header title="Carregando..." />
        <main className="w-full max-w-[1600px] mx-auto px-6 md:px-8 py-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
        </main>
      </>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "licenses", label: "Licenses", icon: Key },
    { id: "users", label: "Users", icon: Users },
    { id: "plans", label: "Plans", icon: GitBranch },
    { id: "devices", label: "HWID & Bans", icon: Smartphone },
    { id: "versions", label: "Versions", icon: GitBranch },
    { id: "variables", label: "Variables", icon: Code },
    { id: "webhooks", label: "Webhooks", icon: WebhookIcon },
    { id: "playground", label: "API Playground", icon: Play },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <>
      <Header
        title={app.name}
        subtitle={`App ID: ${app.appId} • Versão: v${app.currentVersion || "1.0.0"}`}
      />

      <main className="w-full max-w-[1600px] mx-auto px-6 md:px-8 py-6 space-y-6">
        {/* Banner de Manutenção Ativo */}
        {app.status === "MAINTENANCE" && (
          <div className="flex items-center space-x-3 rounded-lg bg-amber-950/30 border border-amber-800/40 p-3 text-xs text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <div className="flex-1">
              <span className="font-semibold">Modo de Manutenção Ativo:</span> {app.maintenanceMessage}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditStatus("ACTIVE");
                handleUpdateAppSettings({ preventDefault: () => {} } as any);
              }}
            >
              Desativar Manutenção
            </Button>
          </div>
        )}

        {/* Sub-navegação com Abas */}
        <div className="flex items-center space-x-1 border-b border-[#1C1C1F] overflow-x-auto pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-t-md transition-all whitespace-nowrap border-b-2 ${
                  isActive
                    ? "border-white text-white bg-[#101012]"
                    : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#0A0A0C]"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-neutral-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* TAB: OVERVIEW */}
        {/* ======================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-mono uppercase text-neutral-400">Total Licenças</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-white">{stats?.totalLicenses ?? 0}</div>
                  <p className="text-[11px] text-emerald-400 font-mono mt-1">{stats?.activeLicenses ?? 0} ativas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-mono uppercase text-neutral-400">Total Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-white">{stats?.totalUsers ?? 0}</div>
                  <p className="text-[11px] text-neutral-500 mt-1">Contas registradas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-mono uppercase text-neutral-400">Dispositivos Vinculados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-white">{stats?.totalDevices ?? 0}</div>
                  <p className="text-[11px] text-neutral-500 mt-1">HWIDs registrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-mono uppercase text-neutral-400">Autenticações Hoje</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-white">{stats?.authenticationsToday ?? 0}</div>
                  <p className="text-[11px] text-neutral-500 mt-1">Últimas 24 horas</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Credenciais & Integração</CardTitle>
                <CardDescription>Parâmetros para conectar seu software à API pública do GouAuth</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400">App Identifier (App ID)</label>
                  <div className="flex items-center space-x-2">
                    <Input readOnly value={app.appId} className="font-mono text-xs bg-[#141418]" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(app.appId);
                        toast.success("App ID copiado!");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-400">API Secret (Privado)</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type={showSecret ? "text" : "password"}
                      readOnly
                      value={app.apiSecret}
                      className="font-mono text-xs bg-[#141418]"
                    />
                    <Button size="sm" variant="outline" onClick={() => setShowSecret(!showSecret)}>
                      {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(app.apiSecret);
                        toast.success("API Secret copiado!");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    Nunca coloque o API Secret dentro de aplicações distribuídas aos clientes finais.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-400">Exemplo de Chamada no seu Programa</label>
                  <pre className="p-3 rounded-md bg-[#101014] border border-[#1E1E22] text-[11px] font-mono text-neutral-300 overflow-x-auto">
{`// Chamada POST /api/v1/auth/license
const res = await fetch("${typeof window !== 'undefined' ? window.location.origin : 'https://gouauth.squareweb.app'}/api/v1/auth/license", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    app_id: "${app.appId}",
    license: "XXXX-XXXX-XXXX-XXXX",
    hwid: "HWID_DO_DISPOSITIVO"
  })
});
const data = await res.json();
if (data.success && data.data.authorized) {
  console.log("Acesso autorizado!");
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: LICENSES */}
        {/* ======================================================== */}
        {activeTab === "licenses" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    placeholder="Pesquisar por chave ou nota..."
                    value={licenseSearch}
                    onChange={(e) => {
                      setLicenseSearch(e.target.value);
                      setLicensePage(1);
                    }}
                    className="pl-9 text-xs"
                  />
                </div>

                <select
                  value={licenseStatusFilter}
                  onChange={(e) => {
                    setLicenseStatusFilter(e.target.value);
                    setLicensePage(1);
                  }}
                  className="h-9 px-3 rounded-md bg-[#0E0E10] border border-[#27272A] text-xs text-neutral-300 focus:outline-none"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="UNUSED">UNUSED (Não ativadas)</option>
                  <option value="ACTIVE">ACTIVE (Ativas)</option>
                  <option value="EXPIRED">EXPIRED (Expiradas)</option>
                  <option value="PAUSED">PAUSED (Pausadas)</option>
                  <option value="BANNED">BANNED (Banidas)</option>
                  <option value="REVOKED">REVOKED (Revogadas)</option>
                </select>
              </div>

              <Button onClick={() => setIsGenModalOpen(true)} className="flex items-center space-x-1.5 shrink-0">
                <Plus className="h-4 w-4 mr-1" />
                <span>Gerar Licenças</span>
              </Button>
            </div>

            {/* Tabela de Licenças */}
            <Card>
              <CardContent className="p-0">
                {licensesLoading ? (
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : licensesList.length === 0 ? (
                  <div className="p-12 text-center text-xs text-neutral-500 font-mono">
                    Nenhuma licença encontrada para os filtros atuais.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[#1C1C1F] text-neutral-500 font-mono uppercase text-[10px] bg-[#0A0A0C]">
                        <tr>
                          <th className="p-3">License Key</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Plano</th>
                          <th className="p-3">Duração / Expiração</th>
                          <th className="p-3">Limite HWID</th>
                          <th className="p-3">Criada em</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141416]">
                        {licensesList.map((lic) => (
                          <tr key={lic.id} className="hover:bg-[#0E0E12] transition-colors">
                            <td className="p-3 font-mono font-medium text-white flex items-center space-x-2">
                              <span>{lic.key}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(lic.key);
                                  toast.success("Licença copiada!");
                                }}
                                className="text-neutral-500 hover:text-white"
                                title="Copiar chave"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </td>
                            <td className="p-3">
                              <StatusBadge status={lic.status} />
                            </td>
                            <td className="p-3 font-medium text-neutral-300">
                              {lic.planName || "Padrão"}
                            </td>
                            <td className="p-3 font-mono text-neutral-400">
                              {lic.expiresAt
                                ? new Date(lic.expiresAt).toLocaleDateString("pt-BR")
                                : lic.durationDays
                                ? `${lic.durationDays} dias`
                                : "Vitalício (Lifetime)"}
                            </td>
                            <td className="p-3 font-mono text-neutral-400">
                              {lic.deviceLimit === 0 ? "Ilimitado" : `${lic.deviceLimit} aparelho(s)`}
                            </td>
                            <td className="p-3 font-mono text-neutral-500">
                              {new Date(lic.createdAt).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => handleLicenseAction(lic.id, "reset_device")}
                                  title="Resetar dispositivos (HWID)"
                                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#18181B]"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                                {lic.status === "PAUSED" ? (
                                  <button
                                    onClick={() => handleLicenseAction(lic.id, "reactivate")}
                                    title="Reativar licença"
                                    className="p-1 rounded text-emerald-400 hover:bg-[#18181B]"
                                  >
                                    <PlayCircle className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleLicenseAction(lic.id, "pause")}
                                    title="Pausar licença"
                                    className="p-1 rounded text-amber-400 hover:bg-[#18181B]"
                                  >
                                    <Pause className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const days = prompt("Quantos dias deseja adicionar?");
                                    if (days && !isNaN(Number(days))) {
                                      handleLicenseAction(lic.id, "add_time", { days: Number(days) });
                                    }
                                  }}
                                  title="Adicionar tempo"
                                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#18181B]"
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLicense(lic.id)}
                                  title="Excluir licença"
                                  className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-[#18181B]"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paginação */}
            {licenseTotalPages > 1 && (
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 pt-2">
                <span>Página {licensePage} de {licenseTotalPages}</span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={licensePage <= 1}
                    onClick={() => setLicensePage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={licensePage >= licenseTotalPages}
                    onClick={() => setLicensePage((p) => Math.min(licenseTotalPages, p + 1))}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: USERS */}
        {/* ======================================================== */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Pesquisar por usuário ou email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <Button onClick={() => setIsUserModalOpen(true)} className="flex items-center space-x-1.5">
                <Plus className="h-4 w-4 mr-1" />
                <span>Novo Usuário</span>
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : usersList.length === 0 ? (
                  <div className="p-12 text-center text-xs text-neutral-500 font-mono">
                    Nenhum usuário cadastrado nesta aplicação.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[#1C1C1F] text-neutral-500 font-mono uppercase text-[10px] bg-[#0A0A0C]">
                        <tr>
                          <th className="p-3">Usuário</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Plano</th>
                          <th className="p-3">Expiração</th>
                          <th className="p-3">Último Login</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141416]">
                        {usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-[#0E0E12] transition-colors">
                            <td className="p-3 font-medium text-white">{u.username}</td>
                            <td className="p-3">
                              <StatusBadge status={u.status} />
                            </td>
                            <td className="p-3 font-medium text-neutral-300">{u.planName || "Padrão"}</td>
                            <td className="p-3 font-mono text-neutral-400">
                              {u.expiresAt ? new Date(u.expiresAt).toLocaleDateString("pt-BR") : "Vitalício"}
                            </td>
                            <td className="p-3 font-mono text-neutral-500">
                              {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("pt-BR") : "Nunca"}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                {u.status === "BANNED" ? (
                                  <button
                                    onClick={async () => {
                                      await fetch(`/api/admin/applications/${appId}/users/${u.id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: "ACTIVE" }),
                                      });
                                      toast.success("Usuário desbanido.");
                                      fetchUsers();
                                    }}
                                    className="p-1 text-emerald-400 hover:bg-[#18181B] rounded"
                                    title="Desbanir"
                                  >
                                    <PlayCircle className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={async () => {
                                        const reason = prompt("Motivo do banimento nesta aplicação:");
                                        if (reason) {
                                          await fetch(`/api/admin/applications/${appId}/users/${u.id}`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ status: "BANNED", banReason: reason }),
                                          });
                                          toast.success("Usuário banido nesta aplicação.");
                                          fetchUsers();
                                        }
                                      }}
                                      className="p-1 text-amber-400 hover:bg-[#18181B] rounded"
                                      title="Banir somente nesta aplicação"
                                    >
                                      <ShieldAlert className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const reason = prompt(`Motivo do banimento GLOBAL do usuário "${u.username}" (em todos os apps):`);
                                        if (reason) {
                                          await fetch(`/api/admin/applications/${appId}/users/${u.id}`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ status: "BANNED", banReason: reason }),
                                          });
                                          await fetch("/api/admin/blacklist", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                              type: "USER",
                                              targetValue: u.username,
                                              reason,
                                              notes: `Banido globalmente a partir da aplicação ${app?.name || appId}`,
                                            }),
                                          });
                                          toast.success(`Usuário ${u.username} banido globalmente em todos os apps!`);
                                          fetchUsers();
                                        }
                                      }}
                                      className="p-1 text-rose-500 hover:text-rose-400 hover:bg-[#18181B] rounded"
                                      title="Banir globalmente em TODOS os aplicativos"
                                    >
                                      <Ban className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={async () => {
                                    if (confirm(`Excluir o usuário ${u.username}?`)) {
                                      await fetch(`/api/admin/applications/${appId}/users/${u.id}`, { method: "DELETE" });
                                      toast.success("Usuário removido.");
                                      fetchUsers();
                                    }
                                  }}
                                  className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-[#18181B] rounded"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: PLANS */}
        {/* ======================================================== */}
        {activeTab === "plans" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Planos de Assinatura</h3>
                <p className="text-xs text-neutral-400">Defina níveis de acesso para suas licenças e usuários</p>
              </div>
              <Button onClick={() => setIsPlanModalOpen(true)} className="flex items-center space-x-1.5">
                <Plus className="h-4 w-4 mr-1" />
                <span>Novo Plano</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plansList.map((plan) => (
                <Card key={plan.id} className="border-[#202024]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{plan.name}</CardTitle>
                      <Badge variant="outline">Nível {plan.level}</Badge>
                    </div>
                    <CardDescription>{plan.description || "Plano personalizado"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 text-xs font-mono text-neutral-300">
                    <p>Duração: {plan.durationDays ? `${plan.durationDays} dias` : "Vitalício (Lifetime)"}</p>
                    <div className="flex justify-end pt-3 border-t border-[#1C1C1F]">
                      <button
                        onClick={async () => {
                          if (confirm(`Excluir o plano ${plan.name}?`)) {
                            await fetch(`/api/admin/applications/${appId}/plans/${plan.id}`, { method: "DELETE" });
                            toast.success("Plano excluído.");
                            fetchPlans();
                          }
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        Excluir Plano
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: HWID & BANS */}
        {/* ======================================================== */}
        {activeTab === "devices" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dispositivos Registrados (HWID)</CardTitle>
                <CardDescription>Aparelhos vinculados a licenças ou contas ativas nesta aplicação</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {devicesList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500 font-mono">
                    Nenhum dispositivo registrado ainda.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[#1C1C1F] text-neutral-500 font-mono uppercase text-[10px] bg-[#0A0A0C]">
                        <tr>
                          <th className="p-3">Fingerprint (HWID)</th>
                          <th className="p-3">Licença / Usuário</th>
                          <th className="p-3">Primeiro Visto</th>
                          <th className="p-3">Último Visto</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141416]">
                        {devicesList.map((dev) => (
                          <tr key={dev.id} className="hover:bg-[#0E0E12]">
                            <td className="p-3 font-mono text-neutral-300 truncate max-w-xs">{dev.deviceFingerprint}</td>
                            <td className="p-3 font-mono text-white">{dev.licenseKey || dev.username || "—"}</td>
                            <td className="p-3 font-mono text-neutral-500">{new Date(dev.firstSeen).toLocaleDateString("pt-BR")}</td>
                            <td className="p-3 font-mono text-neutral-500">{new Date(dev.lastSeen).toLocaleDateString("pt-BR")}</td>
                            <td className="p-3"><StatusBadge status={dev.status} /></td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={async () => {
                                  await fetch(`/api/admin/applications/${appId}/devices/${dev.id}`, { method: "DELETE" });
                                  toast.success("Dispositivo desvinculado.");
                                  fetchDevicesAndBans();
                                }}
                                className="text-xs text-neutral-400 hover:text-white"
                              >
                                Desvincular
                              </button>
                              <button
                                onClick={async () => {
                                  await fetch(`/api/admin/applications/${appId}/devices/${dev.id}`, { method: "POST" });
                                  toast.success("Dispositivo banido nesta aplicação!");
                                  fetchDevicesAndBans();
                                }}
                                className="text-xs text-amber-400 hover:text-amber-300"
                                title="Bloquear apenas neste app"
                              >
                                Banir no App
                              </button>
                              <button
                                onClick={async () => {
                                  const reason = prompt("Motivo do banimento GLOBAL deste computador (em todas as aplicações):");
                                  if (reason) {
                                    await fetch(`/api/admin/applications/${appId}/devices/${dev.id}`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ isGlobal: true, reason }),
                                    });
                                    toast.success("Dispositivo banido globalmente!");
                                    fetchDevicesAndBans();
                                  }
                                }}
                                className="text-xs text-rose-500 hover:text-rose-400 font-semibold"
                                title="Bloquear este computador em TODOS os seus aplicativos"
                              >
                                Banir Global
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Banimentos Ativos</CardTitle>
                <CardDescription>Bloqueios de Licenças, Usuários, HWID ou IPs</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {bansList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500 font-mono">
                    Nenhum banimento registrado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[#1C1C1F] text-neutral-500 font-mono uppercase text-[10px] bg-[#0A0A0C]">
                        <tr>
                          <th className="p-3">Tipo</th>
                          <th className="p-3">Alvo Bloqueado</th>
                          <th className="p-3">Motivo</th>
                          <th className="p-3">Data</th>
                          <th className="p-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141416]">
                        {bansList.map((ban) => (
                          <tr key={ban.id} className="hover:bg-[#0E0E12]">
                            <td className="p-3"><Badge variant="danger">{ban.type}</Badge></td>
                            <td className="p-3 font-mono text-white truncate max-w-xs">{ban.targetValue}</td>
                            <td className="p-3 text-neutral-300">{ban.reason}</td>
                            <td className="p-3 font-mono text-neutral-500">{new Date(ban.createdAt).toLocaleDateString("pt-BR")}</td>
                            <td className="p-3 text-right">
                              {ban.active ? (
                                <button
                                  onClick={async () => {
                                    await fetch(`/api/admin/applications/${appId}/bans?banId=${ban.id}`, { method: "DELETE" });
                                    toast.success("Alvo desbanido!");
                                    fetchDevicesAndBans();
                                  }}
                                  className="text-xs text-emerald-400 hover:text-emerald-300"
                                >
                                  Desbanir
                                </button>
                              ) : (
                                <span className="text-xs text-neutral-600">Inativo</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: VERSIONS */}
        {/* ======================================================== */}
        {activeTab === "versions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Controle de Versões</h3>
                <p className="text-xs text-neutral-400">Gerencie releases e atualizações obrigatórias do seu software</p>
              </div>
              <Button onClick={() => setIsVersionModalOpen(true)} className="flex items-center space-x-1.5">
                <Plus className="h-4 w-4 mr-1" />
                <span>Lançar Versão</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {versionsList.map((v) => (
                <Card key={v.id} className="border-[#202024]">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-mono">v{v.version}</CardTitle>
                      {v.isRequired ? <Badge variant="warning">Update Obrigatório</Badge> : <Badge variant="outline">Opcional</Badge>}
                    </div>
                    <CardDescription>{new Date(v.createdAt).toLocaleString("pt-BR")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {v.changelog && (
                      <p className="text-neutral-300 bg-[#121216] p-2.5 rounded border border-[#1E1E22] whitespace-pre-line font-mono">
                        {v.changelog}
                      </p>
                    )}
                    {v.downloadUrl && (
                      <p className="text-neutral-400 truncate">
                        Download: <a href={v.downloadUrl} target="_blank" className="text-white underline">{v.downloadUrl}</a>
                      </p>
                    )}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={async () => {
                          if (confirm(`Excluir release v${v.version}?`)) {
                            await fetch(`/api/admin/applications/${appId}/versions?versionId=${v.id}`, { method: "DELETE" });
                            toast.success("Versão excluída.");
                            fetchVersions();
                          }
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        Excluir
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: VARIABLES */}
        {/* ======================================================== */}
        {activeTab === "variables" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Variáveis Remotas & Feature Flags</h3>
                <p className="text-xs text-neutral-400">Configure parâmetros dinâmicos consumidos remotamente pelo seu programa</p>
              </div>
              <Button onClick={() => setIsVarModalOpen(true)} className="flex items-center space-x-1.5">
                <Plus className="h-4 w-4 mr-1" />
                <span>Nova Variável</span>
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {variablesList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500 font-mono">
                    Nenhuma variável remota configurada.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[#1C1C1F] text-neutral-500 font-mono uppercase text-[10px] bg-[#0A0A0C]">
                        <tr>
                          <th className="p-3">Chave (Key)</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3">Valor</th>
                          <th className="p-3">Visível ao Cliente</th>
                          <th className="p-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141416]">
                        {variablesList.map((vr) => (
                          <tr key={vr.id} className="hover:bg-[#0E0E12]">
                            <td className="p-3 font-mono font-medium text-white">{vr.key}</td>
                            <td className="p-3 font-mono text-neutral-400">{vr.type}</td>
                            <td className="p-3 font-mono text-neutral-300 truncate max-w-xs">{vr.value}</td>
                            <td className="p-3">
                              {vr.isClientExposed ? <Badge variant="success">Sim (Pública)</Badge> : <Badge variant="default">Privada</Badge>}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={async () => {
                                  await fetch(`/api/admin/applications/${appId}/variables?variableId=${vr.id}`, { method: "DELETE" });
                                  toast.success("Variável removida.");
                                  fetchVariables();
                                }}
                                className="text-xs text-rose-400 hover:text-rose-300"
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: WEBHOOKS */}
        {/* ======================================================== */}
        {activeTab === "webhooks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Webhooks da Aplicação</h3>
                <p className="text-xs text-neutral-400">Receba notificações HTTP POST assinadas com HMAC-SHA256 em tempo real</p>
              </div>
              <Button onClick={() => setIsWebhookModalOpen(true)} className="flex items-center space-x-1.5">
                <Plus className="h-4 w-4 mr-1" />
                <span>Configurar Webhook</span>
              </Button>
            </div>

            <div className="space-y-3">
              {webhooksList.map((hk) => (
                <Card key={hk.id} className="p-4 flex items-center justify-between border-[#202024]">
                  <div className="space-y-1">
                    <p className="text-xs font-mono font-medium text-white">{hk.url}</p>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      Eventos: {Array.isArray(hk.events) ? hk.events.join(", ") : "todos"}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await fetch(`/api/admin/applications/${appId}/webhooks?webhookId=${hk.id}`, { method: "DELETE" });
                      toast.success("Webhook removido.");
                      fetchWebhooks();
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Excluir
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: API PLAYGROUND */}
        {/* ======================================================== */}
        {activeTab === "playground" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Simulador de Requisições da API</CardTitle>
                <CardDescription>Teste as chamadas públicas simulando a execução do seu programa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400">Endpoint a Testar</label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setPlaygroundEndpoint("license")}
                      className={`flex-1 py-1.5 px-3 rounded text-xs font-mono border transition-colors ${
                        playgroundEndpoint === "license"
                          ? "bg-white text-black border-white font-semibold"
                          : "bg-[#101014] text-neutral-400 border-[#27272A]"
                      }`}
                    >
                      POST /auth/license
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaygroundEndpoint("login")}
                      className={`flex-1 py-1.5 px-3 rounded text-xs font-mono border transition-colors ${
                        playgroundEndpoint === "login"
                          ? "bg-white text-black border-white font-semibold"
                          : "bg-[#101014] text-neutral-400 border-[#27272A]"
                      }`}
                    >
                      POST /auth/login
                    </button>
                  </div>
                </div>

                {playgroundEndpoint === "license" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400">License Key para Teste</label>
                    <Input
                      placeholder="GOU-XXXX-XXXX-XXXX"
                      value={playgroundKey}
                      onChange={(e) => setPlaygroundKey(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400">Usuário</label>
                      <Input
                        placeholder="username"
                        value={playgroundUser}
                        onChange={(e) => setPlaygroundUser(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400">Senha</label>
                      <Input
                        type="password"
                        placeholder="••••••"
                        value={playgroundPass}
                        onChange={(e) => setPlaygroundPass(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400">Dispositivo HWID (Simulado)</label>
                  <Input
                    value={playgroundHwid}
                    onChange={(e) => setPlaygroundHwid(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <Button onClick={handleRunPlayground} isLoading={playgroundLoading} className="w-full">
                  Disparar Chamada de Teste
                </Button>
              </CardContent>
            </Card>

            {/* Resultado do Teste */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Resposta do Servidor</CardTitle>
                  {playgroundLatency !== null && (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                      {playgroundLatency} ms
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {playgroundResponse ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-mono">
                      <span className="text-neutral-500">Status:</span>
                      <span className={playgroundResponse.status === 200 ? "text-emerald-400" : "text-rose-400"}>
                        {playgroundResponse.status} {playgroundResponse.statusText}
                      </span>
                    </div>
                    <pre className="p-3 rounded bg-[#101014] border border-[#1E1E22] text-xs font-mono text-neutral-200 overflow-x-auto max-h-72">
                      {JSON.stringify(playgroundResponse.body, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-neutral-500 font-mono">
                    Aguardando execução do teste...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: SETTINGS */}
        {/* ======================================================== */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configurações Gerais da Aplicação</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateAppSettings} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400">Nome da Aplicação</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400">Descrição</label>
                    <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400">Status da Aplicação</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full h-9 px-3 rounded-md bg-[#0E0E10] border border-[#27272A] text-xs text-neutral-200 focus:outline-none"
                    >
                      <option value="ACTIVE">ACTIVE (Em operação normal)</option>
                      <option value="MAINTENANCE">MAINTENANCE (Modo Manutenção)</option>
                      <option value="DISABLED">DISABLED (Desativada)</option>
                    </select>
                  </div>

                  {editStatus === "MAINTENANCE" && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400">Mensagem de Manutenção</label>
                      <Input
                        value={editMaintMsg}
                        onChange={(e) => setEditMaintMsg(e.target.value)}
                        placeholder="Estamos realizando uma manutenção preventiva."
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400">Versão Atual</label>
                    <Input value={editVersion} onChange={(e) => setEditVersion(e.target.value)} className="font-mono text-xs" />
                  </div>

                  <Button type="submit">Salvar Alterações</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-rose-950 bg-rose-950/10">
              <CardHeader>
                <CardTitle className="text-sm text-rose-400">Zona de Perigo</CardTitle>
                <CardDescription>Ações irreversíveis nesta aplicação</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="danger" onClick={handleDeleteApp}>
                  Excluir Permanentemente esta Aplicação
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal: Geração de Licenças */}
        <Modal
          isOpen={isGenModalOpen}
          onClose={() => setIsGenModalOpen(false)}
          title="Gerar License Keys"
          description="Gere chaves individuais ou em massa utilizando geração CSPRNG de alta entropia."
        >
          <form onSubmit={handleGenerateLicenses} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-300">Quantidade</label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={genQuantity}
                  onChange={(e) => setGenQuantity(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-300">Prefixo</label>
                <Input
                  value={genPrefix}
                  onChange={(e) => setGenPrefix(e.target.value.toUpperCase())}
                  className="font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-300">Duração</label>
                <select
                  value={genDuration}
                  onChange={(e) => setGenDuration(e.target.value === "lifetime" ? "lifetime" : Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-md bg-[#0E0E10] border border-[#27272A] text-xs text-neutral-200"
                >
                  <option value={1}>1 Dia</option>
                  <option value={7}>7 Dias</option>
                  <option value={30}>30 Dias</option>
                  <option value={90}>90 Dias</option>
                  <option value={365}>365 Dias (1 Ano)</option>
                  <option value="lifetime">Vitalício (Lifetime)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-300">Limite de Dispositivos (HWID)</label>
                <Input
                  type="number"
                  min={0}
                  value={genDeviceLimit}
                  onChange={(e) => setGenDeviceLimit(Number(e.target.value))}
                />
                <p className="text-[10px] text-neutral-500">0 = sem limite de aparelhos</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">Plano Vinculado (Opcional)</label>
              <select
                value={genPlanId}
                onChange={(e) => setGenPlanId(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-[#0E0E10] border border-[#27272A] text-xs text-neutral-200"
              >
                <option value="">Sem plano específico</option>
                {plansList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Nível {p.level})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">Notas / Observação (Opcional)</label>
              <Input
                placeholder="Ex: Lote promocional Discord"
                value={genNotes}
                onChange={(e) => setGenNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1C1C1F]">
              <Button type="button" variant="ghost" onClick={() => setIsGenModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Gerar Licença(s)</Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Chaves Geradas */}
        {generatedKeysModal && (
          <Modal
            isOpen={true}
            onClose={() => setGeneratedKeysModal(null)}
            title="Licenças Geradas com Sucesso!"
            description={`${generatedKeysModal.length} chave(s) gerada(s). Copie agora para entregar aos usuários.`}
          >
            <div className="space-y-4">
              <textarea
                readOnly
                rows={8}
                value={generatedKeysModal.join("\n")}
                className="w-full rounded-md bg-[#101014] border border-[#27272A] p-3 text-xs font-mono text-neutral-100 select-all focus:outline-none"
              />
              <div className="flex justify-between items-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKeysModal.join("\n"));
                    toast.success("Todas as chaves foram copiadas!");
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copiar Todas
                </Button>
                <Button size="sm" onClick={() => setGeneratedKeysModal(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal: Novo Plano */}
        <Modal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          title="Novo Plano de Assinatura"
          description="Crie uma nova categoria de acesso."
        >
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">Nome do Plano</label>
              <Input
                placeholder="Ex: VIP Premium"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-300">Duração</label>
                <select
                  value={planDuration}
                  onChange={(e) => setPlanDuration(e.target.value === "lifetime" ? "lifetime" : Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-md bg-[#0E0E10] border border-[#27272A] text-xs text-neutral-200"
                >
                  <option value={30}>30 Dias</option>
                  <option value={90}>90 Dias</option>
                  <option value={365}>365 Dias</option>
                  <option value="lifetime">Vitalício</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-300">Nível (Level)</label>
                <Input
                  type="number"
                  min={1}
                  value={planLevel}
                  onChange={(e) => setPlanLevel(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1C1C1F]">
              <Button type="button" variant="ghost" onClick={() => setIsPlanModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Plano</Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Novo Usuário */}
        <Modal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          title="Criar Usuário"
          description="Cadastre um usuário manualmente para a aplicação."
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">Nome de Usuário</label>
              <Input
                placeholder="usuario123"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">Senha Inicial</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">Plano (Opcional)</label>
              <select
                value={newUserPlanId}
                onChange={(e) => setNewUserPlanId(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-[#0E0E10] border border-[#27272A] text-xs text-neutral-200"
              >
                <option value="">Sem plano</option>
                {plansList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1C1C1F]">
              <Button type="button" variant="ghost" onClick={() => setIsUserModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Criar Usuário</Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Nova Versão */}
        <Modal
          isOpen={isVersionModalOpen}
          onClose={() => setIsVersionModalOpen(false)}
          title="Lançar Nova Versão"
          description="Publique uma nova release para os clientes."
        >
          <form onSubmit={handleCreateVersion} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">Número da Versão</label>
              <Input
                placeholder="Ex: 2.0.0"
                value={newVersionNum}
                onChange={(e) => setNewVersionNum(e.target.value)}
                required
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">URL de Download</label>
              <Input
                type="url"
                placeholder="https://..."
                value={newVersionDownload}
                onChange={(e) => setNewVersionDownload(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">Notas de Atualização (Changelog)</label>
              <textarea
                rows={3}
                placeholder="Novidades desta versão..."
                value={newVersionChangelog}
                onChange={(e) => setNewVersionChangelog(e.target.value)}
                className="w-full rounded-md bg-[#0E0E10] border border-[#27272A] p-2 text-xs text-neutral-200 font-mono"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="reqUpdate"
                checked={newVersionRequired}
                onChange={(e) => setNewVersionRequired(e.target.checked)}
                className="rounded bg-[#0E0E10] border-[#27272A]"
              />
              <label htmlFor="reqUpdate" className="text-xs text-neutral-300">
                Atualização Obrigatória (bloqueia versões anteriores)
              </label>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1C1C1F]">
              <Button type="button" variant="ghost" onClick={() => setIsVersionModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Release</Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Nova Variável */}
        <Modal
          isOpen={isVarModalOpen}
          onClose={() => setIsVarModalOpen(false)}
          title="Nova Variável Remota"
          description="Crie uma variável ou feature flag consumível pela API."
        >
          <form onSubmit={handleCreateVariable} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">Nome da Chave (Key)</label>
              <Input
                placeholder="ex: maintenance_mode ou discord_link"
                value={varKey}
                onChange={(e) => setVarKey(e.target.value)}
                required
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">Tipo</label>
              <select
                value={varType}
                onChange={(e) => setVarType(e.target.value as any)}
                className="w-full h-9 px-3 rounded-md bg-[#0E0E10] border border-[#27272A] text-xs text-neutral-200"
              >
                <option value="STRING">STRING</option>
                <option value="BOOLEAN">BOOLEAN</option>
                <option value="NUMBER">NUMBER</option>
                <option value="JSON">JSON</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">Valor</label>
              <Input
                placeholder="Valor da variável"
                value={varValue}
                onChange={(e) => setVarValue(e.target.value)}
                required
                className="font-mono text-xs"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="varExposed"
                checked={varClientExposed}
                onChange={(e) => setVarClientExposed(e.target.checked)}
                className="rounded bg-[#0E0E10] border-[#27272A]"
              />
              <label htmlFor="varExposed" className="text-xs text-neutral-300">
                Permitir que o cliente leia esta variável via API pública
              </label>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1C1C1F]">
              <Button type="button" variant="ghost" onClick={() => setIsVarModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Variável</Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Novo Webhook */}
        <Modal
          isOpen={isWebhookModalOpen}
          onClose={() => setIsWebhookModalOpen(false)}
          title="Configurar Webhook"
          description="Insira a URL que receberá os payloads HTTP POST assinados."
        >
          <form onSubmit={handleCreateWebhook} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">URL de Destino</label>
              <Input
                type="url"
                placeholder="https://meuservidor.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                required
              />
            </div>
            <p className="text-[11px] text-neutral-500">
              Assinatura HMAC-SHA256 no header <code>X-GouAuth-Signature</code> com chave secreta gerada automaticamente.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1C1C1F]">
              <Button type="button" variant="ghost" onClick={() => setIsWebhookModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Webhook</Button>
            </div>
          </form>
        </Modal>
      </main>
    </>
  );
}
