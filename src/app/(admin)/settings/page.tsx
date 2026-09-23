"use client";

import * as React from "react";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, KeyRound, Lock, Copy, Trash2, Plus, Check } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [adminData, setAdminData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // Change Password Form
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isChangingPass, setIsChangingPass] = React.useState(false);

  // 2FA State
  const [setup2FAData, setSetup2FAData] = React.useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [totpToken, setTotpToken] = React.useState("");
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[] | null>(null);
  const [is2FAModalOpen, setIs2FAModalOpen] = React.useState(false);

  // API Keys State
  const [apiKeys, setApiKeys] = React.useState<any[]>([]);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = React.useState(false);
  const [apiKeyName, setApiKeyName] = React.useState("");
  const [generatedApiKey, setGeneratedApiKey] = React.useState<string | null>(null);

  const fetchAdmin = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth/me");
      const json = await res.json();
      if (json.success) setAdminData(json.data);
    } catch {
      toast.error("Erro ao carregar dados do admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApiKeys = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/api-keys");
      const json = await res.json();
      if (json.success) setApiKeys(json.data);
    } catch {
      console.error("Erro ao carregar API Keys");
    }
  }, []);

  React.useEffect(() => {
    fetchAdmin();
    fetchApiKeys();
  }, [fetchAdmin, fetchApiKeys]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("A nova senha e confirmação não conferem.");
      return;
    }
    setIsChangingPass(true);

    try {
      const res = await fetch("/api/admin/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Senha alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(json.error?.message || "Erro ao alterar senha.");
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleStart2FA = async () => {
    try {
      const res = await fetch("/api/admin/auth/2fa");
      const json = await res.json();
      if (json.success) {
        setSetup2FAData(json.data);
        setIs2FAModalOpen(true);
      }
    } catch {
      toast.error("Erro ao iniciar configuração do 2FA.");
    }
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setup2FAData) return;

    try {
      const res = await fetch("/api/admin/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: setup2FAData.secret, token: totpToken }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("2FA habilitado com sucesso!");
        setRecoveryCodes(json.data.recoveryCodes);
        setIs2FAModalOpen(false);
        fetchAdmin();
      } else {
        toast.error(json.error?.message || "Código incorreto.");
      }
    } catch {
      toast.error("Erro ao validar token 2FA.");
    }
  };

  const handleDisable2FA = async () => {
    const token = prompt("Digite o código 2FA atual de 6 dígitos para desativar:");
    if (!token) return;

    try {
      const res = await fetch("/api/admin/auth/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("2FA desativado com sucesso.");
        fetchAdmin();
      } else {
        toast.error(json.error?.message || "Código incorreto.");
      }
    } catch {
      toast.error("Erro de conexão.");
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: apiKeyName,
          scopes: ["licenses:read", "licenses:write", "users:read", "applications:read"],
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Chave criada com sucesso!");
        setIsApiKeyModalOpen(false);
        setGeneratedApiKey(json.data.fullKey);
        setApiKeyName("");
        fetchApiKeys();
      }
    } catch {
      toast.error("Erro ao criar API Key.");
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm("Tem certeza que deseja revogar esta API Key?")) return;
    try {
      const res = await fetch(`/api/admin/api-keys?keyId=${keyId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Chave revogada.");
        fetchApiKeys();
      }
    } catch {
      toast.error("Erro ao revogar chave.");
    }
  };

  return (
    <>
      <Header
        title="Configurações & Segurança"
        subtitle="Gerenciamento da conta administrativa, 2FA e API Keys"
      />

      <main className="w-full max-w-[1600px] mx-auto px-6 md:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: 2FA TOTP */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Autenticação em Dois Fatores (2FA)</CardTitle>
                  <CardDescription>
                    Adiciona uma camada extra de proteção ao painel com Google Authenticator ou similar
                  </CardDescription>
                </div>
                {adminData?.totpEnabled ? (
                  <Badge variant="success">2FA Ativado</Badge>
                ) : (
                  <Badge variant="warning">2FA Desativado</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminData?.totpEnabled ? (
                <div className="flex items-center justify-between p-3 rounded-md bg-[#101014] border border-[#202024]">
                  <div className="text-xs text-neutral-300">
                    Sua conta está protegida por verificação em duas etapas via aplicativo TOTP.
                  </div>
                  <Button size="sm" variant="danger" onClick={handleDisable2FA}>
                    Desativar 2FA
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-md bg-[#101014] border border-[#202024]">
                  <div className="text-xs text-neutral-400">
                    Recomendamos ativar o 2FA para proteger o acesso administrativo ao seu servidor.
                  </div>
                  <Button size="sm" onClick={handleStart2FA}>
                    Configurar 2FA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Alterar Senha */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Alterar Senha do Administrador</CardTitle>
              <CardDescription>Utiliza hashing Argon2id com alta resistência a força bruta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-300">Senha Atual</label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-300">Nova Senha</label>
                    <Input
                      type="password"
                      required
                      minLength={8}
                      placeholder="Mínimo 8 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-300">Confirmar Nova Senha</label>
                    <Input
                      type="password"
                      required
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" isLoading={isChangingPass}>
                  Atualizar Senha
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Card: API Keys Administrativas */}
        <Card className="border-[#1C1C1F] bg-[#08080A]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">API Keys Administrativas</CardTitle>
                <CardDescription>
                  Permite automatizar rotinas administrativas (gerar licenças, consultar usuários) via script externo
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsApiKeyModalOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Criar Chave
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {apiKeys.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 font-mono">
                Nenhuma API Key administrativa criada.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#1C1C1F] text-neutral-400 font-mono uppercase text-[10px] bg-[#0A0A0C]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Identificador</th>
                      <th className="px-4 py-3 font-medium">Prefixo</th>
                      <th className="px-4 py-3 font-medium">Permissões (Scopes)</th>
                      <th className="px-4 py-3 font-medium">Criada em</th>
                      <th className="px-4 py-3 font-medium text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141416]">
                    {apiKeys.map((k) => (
                      <tr key={k.id} className="hover:bg-[#0E0E12] transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{k.name}</td>
                        <td className="px-4 py-3 font-mono text-neutral-400">{k.prefix}...</td>
                        <td className="px-4 py-3 font-mono text-neutral-400">
                          {Array.isArray(k.scopes) ? k.scopes.join(", ") : "all"}
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-500">
                          {new Date(k.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRevokeApiKey(k.id)}
                            className="text-xs text-rose-400 hover:text-rose-300"
                          >
                            Revogar
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

        {/* Modal: Setup 2FA */}
        <Modal
          isOpen={is2FAModalOpen}
          onClose={() => setIs2FAModalOpen(false)}
          title="Configurar Autenticação em 2 Etapas"
          description="Escaneie o QR Code com seu aplicativo autenticador (Google Authenticator, Authy, etc.)."
        >
          {setup2FAData && (
            <form onSubmit={handleConfirm2FA} className="space-y-4">
              <div className="flex flex-col items-center p-4 bg-white rounded-lg max-w-[200px] mx-auto">
                <img src={setup2FAData.qrCodeUrl} alt="2FA QR Code" className="w-44 h-44" />
              </div>

              <div className="space-y-1 text-center">
                <p className="text-[11px] text-neutral-400">Ou insira a chave secreta manualmente:</p>
                <p className="text-xs font-mono text-white bg-[#141418] p-2 rounded border border-[#27272A] select-all">
                  {setup2FAData.secret}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-300">Código de 6 dígitos gerado pelo app</label>
                <Input
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value)}
                  className="font-mono text-center tracking-widest text-base"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#1C1C1F]">
                <Button type="button" variant="ghost" onClick={() => setIs2FAModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Confirmar e Ativar</Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal: Recovery Codes */}
        {recoveryCodes && (
          <Modal
            isOpen={true}
            onClose={() => setRecoveryCodes(null)}
            title="Códigos de Recuperação do 2FA"
            description="Guarde estes códigos em local seguro. Cada código pode ser usado uma única vez se você perder o acesso ao celular."
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-md bg-[#101014] border border-[#27272A] font-mono text-xs text-emerald-400">
                {recoveryCodes.map((code, idx) => (
                  <div key={idx} className="p-1">{code}</div>
                ))}
              </div>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(recoveryCodes.join("\n"));
                  toast.success("Códigos copiados!");
                  setRecoveryCodes(null);
                }}
                className="w-full"
              >
                Copiar e Fechar
              </Button>
            </div>
          </Modal>
        )}

        {/* Modal: Nova API Key */}
        <Modal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          title="Nova API Key Administrativa"
          description="Crie uma chave para automações."
        >
          <form onSubmit={handleCreateApiKey} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300">Identificador da Chave</label>
              <Input
                placeholder="Ex: Bot Discord ou Script Backup"
                value={apiKeyName}
                onChange={(e) => setApiKeyName(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1C1C1F]">
              <Button type="button" variant="ghost" onClick={() => setIsApiKeyModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Gerar Chave</Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Exibir Chave Gerada */}
        {generatedApiKey && (
          <Modal
            isOpen={true}
            onClose={() => setGeneratedApiKey(null)}
            title="Sua API Key Foi Criada!"
            description="ATENÇÃO: Copie sua chave agora. Ela nunca mais será exibida."
          >
            <div className="space-y-4">
              <div className="p-3 bg-[#101014] border border-[#27272A] rounded font-mono text-xs text-white break-all select-all">
                {generatedApiKey}
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(generatedApiKey);
                  toast.success("Chave copiada para a área de transferência!");
                  setGeneratedApiKey(null);
                }}
              >
                Copiar Chave e Fechar
              </Button>
            </div>
          </Modal>
        )}
      </main>
    </>
  );
}
