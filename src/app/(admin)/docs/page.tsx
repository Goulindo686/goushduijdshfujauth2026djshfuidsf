"use client";

import * as React from "react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Terminal, Check } from "lucide-react";
import { toast } from "sonner";

export default function DocsPage() {
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const endpoints = [
    {
      method: "POST",
      path: "/api/v1/auth/license",
      title: "Autenticação por Licença",
      description: "Valida a chave de licença, vincula o identificador do aparelho (HWID) e retorna status, expiração e permissões.",
      body: `{
  "app_id": "meu-launcher-vip",
  "license": "GOU-XXXX-XXXX-XXXX",
  "hwid": "hwid_hash_do_dispositivo"
}`,
      response: `{
  "success": true,
  "data": {
    "authorized": true,
    "license": "GOU-XXXX-XXXX-XXXX",
    "status": "ACTIVE",
    "expiresAt": "2026-10-23T00:00:00.000Z",
    "timeRemainingSeconds": 2592000,
    "plan": {
      "name": "VIP Premium",
      "level": 2,
      "permissions": ["standard", "vip"]
    },
    "device": {
      "fingerprint": "hwid_hash_do_dispositivo",
      "currentCount": 1,
      "limit": 1
    }
  },
  "error": null
}`,
    },
    {
      method: "POST",
      path: "/api/v1/auth/login",
      title: "Login de Usuário",
      description: "Autentica usuário da aplicação cadastrado previamente através de credenciais e validação de HWID.",
      body: `{
  "app_id": "meu-launcher-vip",
  "username": "usuario123",
  "password": "suaSenhaForte",
  "hwid": "hwid_hash_do_dispositivo"
}`,
      response: `{
  "success": true,
  "data": {
    "authorized": true,
    "user": {
      "username": "usuario123",
      "expiresAt": "2026-10-23T00:00:00.000Z",
      "timeRemainingSeconds": 2592000,
      "plan": {
        "name": "VIP",
        "level": 1,
        "permissions": ["standard"]
      }
    },
    "session_token": "a1b2c3d4..."
  },
  "error": null
}`,
    },
    {
      method: "POST",
      path: "/api/v1/auth/register",
      title: "Registro de Usuário com Licença",
      description: "Cria uma conta de usuário consumindo uma chave de licença válida e vinculando o dispositivo.",
      body: `{
  "app_id": "meu-launcher-vip",
  "username": "novo_usuario",
  "password": "senhaDoUsuario",
  "license": "GOU-XXXX-XXXX-XXXX",
  "hwid": "hwid_hash_do_dispositivo"
}`,
      response: `{
  "success": true,
  "data": {
    "message": "Usuário registrado com sucesso.",
    "username": "novo_usuario",
    "expiresAt": "2026-10-23T00:00:00.000Z",
    "plan": { "name": "VIP", "level": 1 }
  },
  "error": null
}`,
    },
    {
      method: "GET",
      path: "/api/v1/app/status?app_id=meu-launcher-vip",
      title: "Status da Aplicação & Manutenção",
      description: "Verifica se a aplicação está operacional ou em modo de manutenção antes de carregar o cliente.",
      body: null,
      response: `{
  "success": true,
  "data": {
    "appId": "meu-launcher-vip",
    "name": "Meu Launcher VIP",
    "status": "ACTIVE",
    "maintenanceMessage": "Estamos realizando uma manutenção.",
    "currentVersion": "1.0.0"
  },
  "error": null
}`,
    },
    {
      method: "GET",
      path: "/api/v1/app/version?app_id=meu-launcher-vip&current_version=1.0.0",
      title: "Checagem de Versão & Atualizações",
      description: "Consulta a versão mais recente e se uma atualização obrigatória é exigida para prosseguir.",
      body: null,
      response: `{
  "success": true,
  "data": {
    "latest_version": "1.1.0",
    "download_url": "https://meudominio.com/download/update.zip",
    "update_available": true,
    "update_required": true,
    "changelog": "- Correções de bugs\\n- Novo layout",
    "checksum": "sha256_hash_do_arquivo"
  },
  "error": null
}`,
    },
    {
      method: "GET",
      path: "/api/v1/app/variables?app_id=meu-launcher-vip",
      title: "Variáveis Remotas & Feature Flags",
      description: "Lê variáveis públicas configuradas no painel administrativo.",
      body: null,
      response: `{
  "success": true,
  "data": {
    "variables": {
      "discord_link": "https://discord.gg/exemplo",
      "feature_vip_enabled": true,
      "server_port": 8080
    }
  },
  "error": null
}`,
    },
  ];

  return (
    <>
      <Header
        title="Documentação da API REST"
        subtitle="Referência completa de endpoints públicos e integração com SDK"
      />

      <main className="p-8 space-y-8 max-w-5xl w-full">
        {/* Intro */}
        <Card className="border-[#202024]">
          <CardHeader>
            <CardTitle className="text-base">Guia de Integração GouAuth</CardTitle>
            <CardDescription>
              Todos os endpoints públicos da API utilizam JSON no padrão de resposta padronizado:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-[#101014] border border-[#1E1E22] rounded-md font-mono text-xs text-neutral-300">
              <span className="text-neutral-500">// URL Base de Produção (Square Cloud):</span>
              <br />
              <span className="text-white font-semibold">https://gouauth.squareweb.app/api/v1</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded bg-[#0A0A0C] border border-[#1C1C1F]">
                <p className="text-emerald-400 font-semibold mb-1">Padrão de Sucesso:</p>
                <pre>{`{
  "success": true,
  "data": { ... },
  "error": null
}`}</pre>
              </div>

              <div className="p-3 rounded bg-[#0A0A0C] border border-[#1C1C1F]">
                <p className="text-rose-400 font-semibold mb-1">Padrão de Erro:</p>
                <pre>{`{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_LICENSE",
    "message": "Mensagem detalhada..."
  }
}`}</pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SDK Quickstart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4 text-white" />
              SDK TypeScript Oficial
            </CardTitle>
            <CardDescription>
              Utilize a classe <code>GouAuth</code> disponibilizada em <code>src/sdk/gouauth.ts</code> no seu cliente Node/Electron:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="p-4 rounded-md bg-[#101014] border border-[#1E1E22] text-xs font-mono text-neutral-200 overflow-x-auto">
{`import { GouAuth } from "./sdk/gouauth";

const auth = new GouAuth({
  appId: "meu-launcher-vip",
  baseUrl: "https://gouauth.squareweb.app" // ou http://localhost:3000 em dev
});

// Autenticação com Licença
try {
  const result = await auth.loginWithLicense({
    license: "GOU-ABCD-1234-EFGH"
  });

  if (result.authorized) {
    console.log("Sucesso! Plano:", result.plan?.name);
    console.log("Expira em:", result.expiresAt);
  }
} catch (error) {
  console.error("Falha na autenticação:", error.message);
}`}
              </pre>
              <button
                onClick={() => copyCode("sdk", `import { GouAuth } from "./sdk/gouauth";\n...`)}
                className="absolute top-3 right-3 p-1.5 rounded bg-[#1C1C20] text-neutral-400 hover:text-white"
              >
                {copiedSection === "sdk" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints detalhados */}
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-white tracking-tight">Endpoints da API Pública</h3>

          {endpoints.map((ep, idx) => (
            <Card key={idx} className="border-[#202024]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      ep.method === "POST" ? "bg-white text-black" : "bg-neutral-800 text-neutral-200"
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs font-semibold text-white">{ep.path}</span>
                  </div>
                  <Badge variant="outline">{ep.title}</Badge>
                </div>
                <CardDescription className="pt-1">{ep.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {ep.body && (
                  <div>
                    <p className="text-[11px] font-mono text-neutral-400 mb-1">Request Body (JSON):</p>
                    <pre className="p-2.5 rounded bg-[#101014] border border-[#1E1E22] text-xs font-mono text-neutral-300 overflow-x-auto">
                      {ep.body}
                    </pre>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-mono text-neutral-400 mb-1">Response (JSON):</p>
                  <pre className="p-2.5 rounded bg-[#101014] border border-[#1E1E22] text-xs font-mono text-neutral-300 overflow-x-auto">
                    {ep.response}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
