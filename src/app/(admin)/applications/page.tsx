"use client";

import * as React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Layers, ArrowUpRight, Copy, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  appId: string;
  name: string;
  description: string | null;
  status: string;
  currentVersion: string | null;
  downloadUrl: string | null;
  createdAt: string;
}

export default function ApplicationsPage() {
  const [apps, setApps] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form states
  const [name, setName] = React.useState("");
  const [appId, setAppId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [currentVersion, setCurrentVersion] = React.useState("1.0.0");
  const [downloadUrl, setDownloadUrl] = React.useState("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const fetchApps = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/applications");
      const json = await res.json();
      if (json.success) {
        setApps(json.data);
      }
    } catch {
      toast.error("Erro ao carregar aplicações.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          appId,
          description: description || undefined,
          currentVersion: currentVersion || "1.0.0",
          downloadUrl: downloadUrl || undefined,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message || "Erro ao criar aplicação.");
        setIsSubmitting(false);
        return;
      }

      toast.success("Aplicação criada com sucesso!");
      setIsModalOpen(false);
      setName("");
      setAppId("");
      setDescription("");
      setDownloadUrl("");
      fetchApps();
    } catch {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyAppId = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("App ID copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <Header
        title="Aplicações"
        subtitle="Gerencie seus softwares, clientes e parametrizações remotas"
      />

      <main className="w-full max-w-[1600px] mx-auto px-6 md:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Suas Aplicações</h2>
            <p className="text-xs text-neutral-400">Clique em uma aplicação para administrar licenças, usuários e versões</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-1.5">
            <Plus className="h-4 w-4 mr-1" />
            <span>Nova Aplicação</span>
          </Button>
        </div>

        {/* Lista de Apps em Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : apps.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-[#27272A]">
            <Layers className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-200">Nenhuma aplicação cadastrada</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
              Crie sua primeira aplicação para começar a gerar License Keys e autenticar seus programas.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>Criar Primeira Aplicação</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {apps.map((app) => (
              <Link key={app.id} href={`/applications/${app.id}`}>
                <Card className="hover:border-neutral-500 hover:bg-[#0E0E12] transition-all cursor-pointer h-full flex flex-col justify-between group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base group-hover:text-white transition-colors flex items-center gap-1.5">
                        {app.name}
                        <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                      <StatusBadge status={app.status} />
                    </div>
                    <CardDescription className="line-clamp-2 mt-1">
                      {app.description || "Sem descrição informada."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center justify-between text-xs font-mono bg-[#141418] border border-[#1E1E22] px-2.5 py-1.5 rounded-md">
                      <span className="text-neutral-400 truncate">{app.appId}</span>
                      <button
                        onClick={(e) => copyAppId(app.appId, e)}
                        className="text-neutral-500 hover:text-white transition-colors ml-2"
                        title="Copiar App ID"
                      >
                        {copiedId === app.appId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-[#1C1C1F]">
                      <span>Versão: v{app.currentVersion || "1.0.0"}</span>
                      <span>{new Date(app.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Modal de Criação */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Criar Nova Aplicação"
          description="Cadastre um novo software para gerenciar licenças e autenticações."
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Nome da Aplicação</label>
              <Input
                required
                placeholder="Ex: Meu Launcher VIP"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!appId) {
                    setAppId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"));
                  }
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Identificador Público (App ID / Slug)
              </label>
              <Input
                required
                placeholder="ex: meu-launcher-vip"
                value={appId}
                onChange={(e) => setAppId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))}
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-neutral-500">
                Usado pelo seu programa ou SDK para se conectar à API.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Descrição (Opcional)</label>
              <Input
                placeholder="Breve descrição da aplicação"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Versão Inicial</label>
                <Input
                  placeholder="1.0.0"
                  value={currentVersion}
                  onChange={(e) => setCurrentVersion(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">URL de Download (Opcional)</label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1C1C1F]">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Criar Aplicação
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </>
  );
}
