"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Terminal, 
  Copy, 
  Check, 
  ArrowLeft, 
  Code, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export default function ConnectGuidePage() {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [selectedLang, setSelectedLang] = React.useState<"typescript" | "python" | "csharp" | "cpp" | "curl">("typescript");

  const copyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Código copiado para a área de transferência!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const codeSnippets = {
    typescript: `// 1. Instale ou importe o SDK GouAuth
import { GouAuth } from "./sdk/gouauth";

// 2. Inicialize o cliente com seu App ID
const auth = new GouAuth({
  appId: "sua-aplicacao-slug", // Encontrado no painel GouAuth
  baseUrl: "https://gouauth.squareweb.app" // ou http://localhost:3000 em dev
});

async function main() {
  try {
    // 3. Autentique enviando a licença (o HWID é capturado automaticamente pelo SDK)
    const result = await auth.loginWithLicense({
      license: "GOU-XXXX-XXXX-XXXX"
    });

    if (result.authorized) {
      console.log("✓ Acesso Liberado!");
      console.log("Plano:", result.plan?.name);
      console.log("Expira em:", result.expiresAt);
      console.log("Aparelho vinculado:", result.device.fingerprint);
    }
  } catch (error: any) {
    console.error("✗ Falha na autenticação:", error.message);
  }
}

main();`,

    python: `import requests
import hashlib
import platform
import uuid

# 1. Função para gerar o HWID do dispositivo
def get_hwid():
    raw = f"{platform.node()}:{platform.system()}:{platform.machine()}:{uuid.getnode()}"
    return hashlib.sha256(raw.encode()).hexdigest()

# 2. Configurações da sua aplicação
APP_ID = "sua-aplicacao-slug"
API_URL = "https://gouauth.squareweb.app/api/v1/auth/license"

def authenticate_license(license_key: str):
    payload = {
        "app_id": APP_ID,
        "license": license_key,
        "hwid": get_hwid()
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=10)
        data = response.json()
        
        if data.get("success") and data.get("data", {}).get("authorized"):
            print("✓ Acesso Liberado com sucesso!")
            print(f"Plano: {data['data'].get('plan', {}).get('name')}")
            print(f"Expira em: {data['data'].get('expiresAt')}")
            return True
        else:
            err = data.get("error", {})
            print(f"✗ Erro [{err.get('code')}]: {err.get('message')}")
            return False
    except Exception as e:
        print(f"✗ Erro de conexão com o GouAuth: {e}")
        return False

# Exemplo de uso
authenticate_license("GOU-XXXX-XXXX-XXXX")`,

    csharp: `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Security.Cryptography;

class Program
{
    private static readonly HttpClient client = new HttpClient();
    private const string APP_ID = "sua-aplicacao-slug";
    private const string API_URL = "https://gouauth.squareweb.app/api/v1/auth/license";

    // Gera um HWID básico baseado no nome da máquina e usuário
    private static string GetHWID()
    {
        string raw = Environment.MachineName + Environment.UserName + Environment.OSVersion;
        using var sha256 = SHA256.Create();
        byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes).ToLower();
    }

    public static async Task Main(string[] args)
    {
        string licenseKey = "GOU-XXXX-XXXX-XXXX";

        var payload = new
        {
            app_id = APP_ID,
            license = licenseKey,
            hwid = GetHWID()
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        try
        {
            var response = await client.PostAsync(API_URL, content);
            string responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);
            bool success = doc.RootElement.GetProperty("success").GetBoolean();

            if (success)
            {
                Console.WriteLine("✓ Acesso Liberado pelo GouAuth!");
            }
            else
            {
                string msg = doc.RootElement.GetProperty("error").GetProperty("message").GetString();
                Console.WriteLine($"✗ Falha na autenticação: {msg}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"✗ Erro de rede: {ex.Message}");
        }
    }
}`,

    cpp: `#include <iostream>
#include <string>
#include <windows.h>
#include <wininet.h>

#pragma comment(lib, "wininet.lib")

// Exemplo em C++ utilizando WinINet no Windows
void AuthenticateLicense(const std::string& appId, const std::string& license, const std::string& hwid) {
    HINTERNET hInternet = InternetOpenA("GouAuth-CPP-Client", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hInternet) return;

    HINTERNET hConnect = InternetConnectA(hInternet, "gouauth.squareweb.app", INTERNET_DEFAULT_HTTPS_PORT, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    if (!hConnect) { InternetCloseHandle(hInternet); return; }

    HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", "/api/v1/auth/license", NULL, NULL, NULL, INTERNET_FLAG_SECURE, 0);
    if (!hRequest) { InternetCloseHandle(hConnect); InternetCloseHandle(hInternet); return; }

    std::string jsonBody = "{\"app_id\":\"" + appId + "\",\"license\":\"" + license + "\",\"hwid\":\"" + hwid + "\"}";
    std::string headers = "Content-Type: application/json\\r\\n";

    if (HttpSendRequestA(hRequest, headers.c_str(), headers.length(), (LPVOID)jsonBody.c_str(), jsonBody.length())) {
        char buffer[2048];
        DWORD bytesRead = 0;
        std::string response = "";
        while (InternetReadFile(hRequest, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0) {
            buffer[bytesRead] = '\\0';
            response += buffer;
        }
        std::cout << "Resposta do GouAuth: " << response << std::endl;
    }

    InternetCloseHandle(hRequest);
    InternetCloseHandle(hConnect);
    InternetCloseHandle(hInternet);
}

int main() {
    AuthenticateLicense("sua-aplicacao-slug", "GOU-XXXX-XXXX-XXXX", "HWID-TEST-123");
    return 0;
}`,

    curl: `curl -X POST "https://gouauth.squareweb.app/api/v1/auth/license" \\
  -H "Content-Type: application/json" \\
  -d '{
    "app_id": "sua-aplicacao-slug",
    "license": "GOU-XXXX-XXXX-XXXX",
    "hwid": "HWID_DO_DISPOSITIVO"
  }'`
  };

  return (
    <div className="min-h-screen bg-black text-[#EDEDED] p-4 sm:p-8 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1C1C1F] pb-6">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-md bg-[#101012] border border-[#27272A] text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
              title="Voltar ao Painel"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-6 px-2 rounded bg-white text-black text-xs font-bold flex items-center">GouAuth</span>
                <h1 className="text-xl font-bold tracking-tight text-white">Guia Oficial de Conexão</h1>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Tudo o que seu software precisa para validar licenças e registrar dispositivos
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link href="/docs">
              <Button size="sm" variant="outline">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                API Reference
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">
                Ir ao Painel Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* 3 Passos Essenciais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-[#202024]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white bg-neutral-800 px-2 py-0.5 rounded">PASSO 1</span>
                <Code className="h-4 w-4 text-neutral-400" />
              </div>
              <CardTitle className="text-sm pt-2">Obter seu App ID</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-neutral-400 leading-relaxed">
              No painel do GouAuth, acesse <strong>Aplicações</strong> e copie o <strong>App ID</strong> (identificador único público da sua aplicação).
            </CardContent>
          </Card>

          <Card className="border-[#202024]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white bg-neutral-800 px-2 py-0.5 rounded">PASSO 2</span>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <CardTitle className="text-sm pt-2">Gerar uma License Key</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-neutral-400 leading-relaxed">
              Na aba <strong>Licenses</strong> da sua aplicação, clique em <strong>Gerar Licenças</strong> e forneça a chave gerada ao seu usuário.
            </CardContent>
          </Card>

          <Card className="border-[#202024]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white bg-neutral-800 px-2 py-0.5 rounded">PASSO 3</span>
                <Smartphone className="h-4 w-4 text-neutral-300" />
              </div>
              <CardTitle className="text-sm pt-2">Autenticar no Programa</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-neutral-400 leading-relaxed">
              Faça a chamada <code>POST /api/v1/auth/license</code> enviando o <code>app_id</code>, a <code>license</code> e o <code>hwid</code> da máquina.
            </CardContent>
          </Card>
        </div>

        {/* URL do Servidor */}
        <Card className="border-[#202024] bg-[#0A0A0C]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Terminal className="h-4 w-4 text-white" />
              Endpoint de Autenticação em Produção (Square Cloud)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 rounded-md bg-[#121216] border border-[#202024] font-mono text-xs text-neutral-200">
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-white text-black font-bold">POST</Badge>
                <span className="text-emerald-400">https://gouauth.squareweb.app/api/v1/auth/license</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyCode("endpoint", "https://gouauth.squareweb.app/api/v1/auth/license")}
              >
                {copiedId === "endpoint" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Seletor de Linguagens & Snippets */}
        <Card className="border-[#202024]">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Código de Integração Pronto</CardTitle>
                <CardDescription>Escolha a linguagem do seu software para copiar o exemplo completo com HWID:</CardDescription>
              </div>

              {/* Botão Copiar */}
              <Button
                size="sm"
                onClick={() => copyCode(selectedLang, codeSnippets[selectedLang])}
                className="shrink-0"
              >
                {copiedId === selectedLang ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copiar Código
                  </>
                )}
              </Button>
            </div>

            {/* Tabs de Linguagens */}
            <div className="flex items-center space-x-1.5 pt-4 border-b border-[#1C1C1F] overflow-x-auto pb-1">
              {[
                { id: "typescript", label: "TypeScript / Node" },
                { id: "python", label: "Python" },
                { id: "csharp", label: "C# / .NET" },
                { id: "cpp", label: "C++ (Windows)" },
                { id: "curl", label: "cURL / HTTP" },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLang(lang.id as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                    selectedLang === lang.id
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-[#141418]"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <div className="relative rounded-md bg-[#070708] border border-[#1A1A1E] p-4 overflow-x-auto max-h-[500px]">
              <pre className="text-xs font-mono text-neutral-300 leading-relaxed">
                {codeSnippets[selectedLang]}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Códigos de Erro & Respostas */}
        <Card className="border-[#202024]">
          <CardHeader>
            <CardTitle className="text-sm">Possíveis Respostas da API</CardTitle>
            <CardDescription>O que o GouAuth responde caso a licença seja válida ou ocorra algum erro:</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#1C1C1F] text-neutral-500 font-mono uppercase text-[10px] bg-[#0A0A0C]">
                  <tr>
                    <th className="p-3">Código de Erro</th>
                    <th className="p-3">Significado</th>
                    <th className="p-3">O que fazer no seu programa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141416]">
                  <tr>
                    <td className="p-3 font-mono text-emerald-400">authorized: true</td>
                    <td className="p-3 text-neutral-300">Licença válida e ativa</td>
                    <td className="p-3 text-neutral-400">Liberar o uso das funcionalidades para o usuário.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-rose-400">INVALID_LICENSE</td>
                    <td className="p-3 text-neutral-300">Chave inexistente ou digitada errada</td>
                    <td className="p-3 text-neutral-400">Pedir ao usuário para conferir os caracteres da licença.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-rose-400">DEVICE_LIMIT_REACHED</td>
                    <td className="p-3 text-neutral-300">Limite de computadores atingido</td>
                    <td className="p-3 text-neutral-400">Avisar que a licença já está em uso em outro computador (ou resetar no painel).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-amber-400">LICENSE_EXPIRED</td>
                    <td className="p-3 text-neutral-300">O tempo da licença acabou</td>
                    <td className="p-3 text-neutral-400">Bloquear acesso e solicitar renovação de assinatura.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-rose-400">LICENSE_BANNED</td>
                    <td className="p-3 text-neutral-300">A chave foi banida por violação</td>
                    <td className="p-3 text-neutral-400">Bloquear imediatamente o programa.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-amber-400">APPLICATION_MAINTENANCE</td>
                    <td className="p-3 text-neutral-300">Modo de manutenção ativo no painel</td>
                    <td className="p-3 text-neutral-400">Exibir mensagem de aviso de manutenção temporária ao usuário.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
