(()=>{var e={};e.id=5580,e.ids=[5580],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},6038:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>i.a,__next_app__:()=>u,originalPathname:()=>x,pages:()=>d,routeModule:()=>m,tree:()=>c}),s(4398),s(4742),s(5866);var a=s(3191),r=s(8716),n=s(7922),i=s.n(n),o=s(5231),l={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>o[e]);s.d(t,l);let c=["",{children:["connect",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,4398)),"D:\\GouAuth\\src\\app\\connect\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,4742)),"D:\\GouAuth\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,5866,23)),"next/dist/client/components/not-found-error"]}],d=["D:\\GouAuth\\src\\app\\connect\\page.tsx"],x="/connect/page",u={require:s,loadChunk:()=>Promise.resolve()},m=new a.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/connect/page",pathname:"/connect",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},4518:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,2994,23)),Promise.resolve().then(s.t.bind(s,6114,23)),Promise.resolve().then(s.t.bind(s,9727,23)),Promise.resolve().then(s.t.bind(s,9671,23)),Promise.resolve().then(s.t.bind(s,1868,23)),Promise.resolve().then(s.t.bind(s,4759,23))},1855:(e,t,s)=>{Promise.resolve().then(s.bind(s,5999)),Promise.resolve().then(s.bind(s,7564))},672:(e,t,s)=>{Promise.resolve().then(s.bind(s,3353))},2933:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});let a=(0,s(2881).Z)("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]])},3810:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});let a=(0,s(2881).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},3495:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});let a=(0,s(2881).Z)("Smartphone",[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]])},2130:(e,t,s)=>{"use strict";s.d(t,{Z:()=>a});let a=(0,s(2881).Z)("Terminal",[["polyline",{points:"4 17 10 11 4 5",key:"akl6gq"}],["line",{x1:"12",x2:"20",y1:"19",y2:"19",key:"q2wloq"}]])},3353:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>f});var a=s(326),r=s(7577),n=s(434),i=s(9752),o=s(1664),l=s(8443),c=s(2881);let d=(0,c.Z)("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]),x=(0,c.Z)("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);var u=s(2216);let m=(0,c.Z)("ShieldCheck",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);var h=s(3495),p=s(2130),g=s(2933),b=s(3810),j=s(5999);function f(){let[e,t]=r.useState(null),[s,c]=r.useState("typescript"),f=(e,s)=>{navigator.clipboard.writeText(s),t(e),j.A.success("C\xf3digo copiado para a \xe1rea de transfer\xeancia!"),setTimeout(()=>t(null),2e3)},N={typescript:`// 1. Instale ou importe o SDK GouAuth
import { GouAuth } from "./sdk/gouauth";

// 2. Inicialize o cliente com seu App ID
const auth = new GouAuth({
  appId: "sua-aplicacao-slug", // Encontrado no painel GouAuth
  baseUrl: "https://gouauth.squareweb.app" // ou http://localhost:3000 em dev
});

async function main() {
  try {
    // 3. Autentique enviando a licen\xe7a (o HWID \xe9 capturado automaticamente pelo SDK)
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
    console.error("✗ Falha na autentica\xe7\xe3o:", error.message);
  }
}

main();`,python:`import requests
import hashlib
import platform
import uuid

# 1. Fun\xe7\xe3o para gerar o HWID do dispositivo
def get_hwid():
    raw = f"{platform.node()}:{platform.system()}:{platform.machine()}:{uuid.getnode()}"
    return hashlib.sha256(raw.encode()).hexdigest()

# 2. Configura\xe7\xf5es da sua aplica\xe7\xe3o
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
        print(f"✗ Erro de conex\xe3o com o GouAuth: {e}")
        return False

# Exemplo de uso
authenticate_license("GOU-XXXX-XXXX-XXXX")`,csharp:`using System;
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

    // Gera um HWID b\xe1sico baseado no nome da m\xe1quina e usu\xe1rio
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
                Console.WriteLine($"✗ Falha na autentica\xe7\xe3o: {msg}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"✗ Erro de rede: {ex.Message}");
        }
    }
}`,cpp:`#include <iostream>
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

    std::string jsonBody = "{"app_id":"" + appId + "","license":"" + license + "","hwid":"" + hwid + ""}";
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
}`,curl:`curl -X POST "https://gouauth.squareweb.app/api/v1/auth/license" \\
  -H "Content-Type: application/json" \\
  -d '{
    "app_id": "sua-aplicacao-slug",
    "license": "GOU-XXXX-XXXX-XXXX",
    "hwid": "HWID_DO_DISPOSITIVO"
  }'`};return a.jsx("div",{className:"min-h-screen bg-black text-[#EDEDED] p-4 sm:p-8 select-none",children:(0,a.jsxs)("div",{className:"max-w-6xl mx-auto space-y-8",children:[(0,a.jsxs)("div",{className:"flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1C1C1F] pb-6",children:[(0,a.jsxs)("div",{className:"flex items-center space-x-3",children:[a.jsx(n.default,{href:"/dashboard",className:"p-2 rounded-md bg-[#101012] border border-[#27272A] text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors",title:"Voltar ao Painel",children:a.jsx(d,{className:"h-4 w-4"})}),(0,a.jsxs)("div",{children:[(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[a.jsx("span",{className:"h-6 px-2 rounded bg-white text-black text-xs font-bold flex items-center",children:"GouAuth"}),a.jsx("h1",{className:"text-xl font-bold tracking-tight text-white",children:"Guia Oficial de Conex\xe3o"})]}),a.jsx("p",{className:"text-xs text-neutral-400 mt-1",children:"Tudo o que seu software precisa para validar licen\xe7as e registrar dispositivos"})]})]}),(0,a.jsxs)("div",{className:"flex items-center space-x-2",children:[a.jsx(n.default,{href:"/docs",children:(0,a.jsxs)(o.z,{size:"sm",variant:"outline",children:[a.jsx(x,{className:"h-3.5 w-3.5 mr-1.5"}),"API Reference"]})}),a.jsx(n.default,{href:"/dashboard",children:a.jsx(o.z,{size:"sm",children:"Ir ao Painel Admin"})})]})]}),(0,a.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[(0,a.jsxs)(i.Zb,{className:"border-[#202024]",children:[(0,a.jsxs)(i.Ol,{className:"pb-2",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between",children:[a.jsx("span",{className:"text-xs font-mono font-bold text-white bg-neutral-800 px-2 py-0.5 rounded",children:"PASSO 1"}),a.jsx(u.Z,{className:"h-4 w-4 text-neutral-400"})]}),a.jsx(i.ll,{className:"text-sm pt-2",children:"Obter seu App ID"})]}),(0,a.jsxs)(i.aY,{className:"text-xs text-neutral-400 leading-relaxed",children:["No painel do GouAuth, acesse ",a.jsx("strong",{children:"Aplica\xe7\xf5es"})," e copie o ",a.jsx("strong",{children:"App ID"})," (identificador \xfanico p\xfablico da sua aplica\xe7\xe3o)."]})]}),(0,a.jsxs)(i.Zb,{className:"border-[#202024]",children:[(0,a.jsxs)(i.Ol,{className:"pb-2",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between",children:[a.jsx("span",{className:"text-xs font-mono font-bold text-white bg-neutral-800 px-2 py-0.5 rounded",children:"PASSO 2"}),a.jsx(m,{className:"h-4 w-4 text-emerald-400"})]}),a.jsx(i.ll,{className:"text-sm pt-2",children:"Gerar uma License Key"})]}),(0,a.jsxs)(i.aY,{className:"text-xs text-neutral-400 leading-relaxed",children:["Na aba ",a.jsx("strong",{children:"Licenses"})," da sua aplica\xe7\xe3o, clique em ",a.jsx("strong",{children:"Gerar Licen\xe7as"})," e forne\xe7a a chave gerada ao seu usu\xe1rio."]})]}),(0,a.jsxs)(i.Zb,{className:"border-[#202024]",children:[(0,a.jsxs)(i.Ol,{className:"pb-2",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between",children:[a.jsx("span",{className:"text-xs font-mono font-bold text-white bg-neutral-800 px-2 py-0.5 rounded",children:"PASSO 3"}),a.jsx(h.Z,{className:"h-4 w-4 text-neutral-300"})]}),a.jsx(i.ll,{className:"text-sm pt-2",children:"Autenticar no Programa"})]}),(0,a.jsxs)(i.aY,{className:"text-xs text-neutral-400 leading-relaxed",children:["Fa\xe7a a chamada ",a.jsx("code",{children:"POST /api/v1/auth/license"})," enviando o ",a.jsx("code",{children:"app_id"}),", a ",a.jsx("code",{children:"license"})," e o ",a.jsx("code",{children:"hwid"})," da m\xe1quina."]})]})]}),(0,a.jsxs)(i.Zb,{className:"border-[#202024] bg-[#0A0A0C]",children:[a.jsx(i.Ol,{className:"pb-3",children:(0,a.jsxs)(i.ll,{className:"text-sm flex items-center gap-2",children:[a.jsx(p.Z,{className:"h-4 w-4 text-white"}),"Endpoint de Autentica\xe7\xe3o em Produ\xe7\xe3o (Square Cloud)"]})}),a.jsx(i.aY,{children:(0,a.jsxs)("div",{className:"flex items-center justify-between p-3 rounded-md bg-[#121216] border border-[#202024] font-mono text-xs text-neutral-200",children:[(0,a.jsxs)("div",{className:"flex items-center space-x-2",children:[a.jsx(l.C,{variant:"default",className:"bg-white text-black font-bold",children:"POST"}),a.jsx("span",{className:"text-emerald-400",children:"https://gouauth.squareweb.app/api/v1/auth/license"})]}),a.jsx(o.z,{size:"sm",variant:"outline",onClick:()=>f("endpoint","https://gouauth.squareweb.app/api/v1/auth/license"),children:"endpoint"===e?a.jsx(g.Z,{className:"h-3.5 w-3.5 text-emerald-400"}):a.jsx(b.Z,{className:"h-3.5 w-3.5"})})]})})]}),(0,a.jsxs)(i.Zb,{className:"border-[#202024]",children:[(0,a.jsxs)(i.Ol,{children:[(0,a.jsxs)("div",{className:"flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",children:[(0,a.jsxs)("div",{children:[a.jsx(i.ll,{className:"text-base",children:"C\xf3digo de Integra\xe7\xe3o Pronto"}),a.jsx(i.SZ,{children:"Escolha a linguagem do seu software para copiar o exemplo completo com HWID:"})]}),a.jsx(o.z,{size:"sm",onClick:()=>f(s,N[s]),className:"shrink-0",children:e===s?(0,a.jsxs)(a.Fragment,{children:[a.jsx(g.Z,{className:"h-3.5 w-3.5 mr-1.5 text-emerald-400"}),"Copiado!"]}):(0,a.jsxs)(a.Fragment,{children:[a.jsx(b.Z,{className:"h-3.5 w-3.5 mr-1.5"}),"Copiar C\xf3digo"]})})]}),a.jsx("div",{className:"flex items-center space-x-1.5 pt-4 border-b border-[#1C1C1F] overflow-x-auto pb-1",children:[{id:"typescript",label:"TypeScript / Node"},{id:"python",label:"Python"},{id:"csharp",label:"C# / .NET"},{id:"cpp",label:"C++ (Windows)"},{id:"curl",label:"cURL / HTTP"}].map(e=>a.jsx("button",{onClick:()=>c(e.id),className:`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${s===e.id?"bg-white text-black font-semibold shadow-sm":"text-neutral-400 hover:text-white hover:bg-[#141418]"}`,children:e.label},e.id))})]}),a.jsx(i.aY,{children:a.jsx("div",{className:"relative rounded-md bg-[#070708] border border-[#1A1A1E] p-4 overflow-x-auto max-h-[500px]",children:a.jsx("pre",{className:"text-xs font-mono text-neutral-300 leading-relaxed",children:N[s]})})})]}),(0,a.jsxs)(i.Zb,{className:"border-[#202024]",children:[(0,a.jsxs)(i.Ol,{children:[a.jsx(i.ll,{className:"text-sm",children:"Poss\xedveis Respostas da API"}),a.jsx(i.SZ,{children:"O que o GouAuth responde caso a licen\xe7a seja v\xe1lida ou ocorra algum erro:"})]}),a.jsx(i.aY,{className:"p-0",children:a.jsx("div",{className:"overflow-x-auto",children:(0,a.jsxs)("table",{className:"w-full text-left text-xs",children:[a.jsx("thead",{className:"border-b border-[#1C1C1F] text-neutral-500 font-mono uppercase text-[10px] bg-[#0A0A0C]",children:(0,a.jsxs)("tr",{children:[a.jsx("th",{className:"p-3",children:"C\xf3digo de Erro"}),a.jsx("th",{className:"p-3",children:"Significado"}),a.jsx("th",{className:"p-3",children:"O que fazer no seu programa"})]})}),(0,a.jsxs)("tbody",{className:"divide-y divide-[#141416]",children:[(0,a.jsxs)("tr",{children:[a.jsx("td",{className:"p-3 font-mono text-emerald-400",children:"authorized: true"}),a.jsx("td",{className:"p-3 text-neutral-300",children:"Licen\xe7a v\xe1lida e ativa"}),a.jsx("td",{className:"p-3 text-neutral-400",children:"Liberar o uso das funcionalidades para o usu\xe1rio."})]}),(0,a.jsxs)("tr",{children:[a.jsx("td",{className:"p-3 font-mono text-rose-400",children:"INVALID_LICENSE"}),a.jsx("td",{className:"p-3 text-neutral-300",children:"Chave inexistente ou digitada errada"}),a.jsx("td",{className:"p-3 text-neutral-400",children:"Pedir ao usu\xe1rio para conferir os caracteres da licen\xe7a."})]}),(0,a.jsxs)("tr",{children:[a.jsx("td",{className:"p-3 font-mono text-rose-400",children:"DEVICE_LIMIT_REACHED"}),a.jsx("td",{className:"p-3 text-neutral-300",children:"Limite de computadores atingido"}),a.jsx("td",{className:"p-3 text-neutral-400",children:"Avisar que a licen\xe7a j\xe1 est\xe1 em uso em outro computador (ou resetar no painel)."})]}),(0,a.jsxs)("tr",{children:[a.jsx("td",{className:"p-3 font-mono text-amber-400",children:"LICENSE_EXPIRED"}),a.jsx("td",{className:"p-3 text-neutral-300",children:"O tempo da licen\xe7a acabou"}),a.jsx("td",{className:"p-3 text-neutral-400",children:"Bloquear acesso e solicitar renova\xe7\xe3o de assinatura."})]}),(0,a.jsxs)("tr",{children:[a.jsx("td",{className:"p-3 font-mono text-rose-400",children:"LICENSE_BANNED"}),a.jsx("td",{className:"p-3 text-neutral-300",children:"A chave foi banida por viola\xe7\xe3o"}),a.jsx("td",{className:"p-3 text-neutral-400",children:"Bloquear imediatamente o programa."})]}),(0,a.jsxs)("tr",{children:[a.jsx("td",{className:"p-3 font-mono text-amber-400",children:"APPLICATION_MAINTENANCE"}),a.jsx("td",{className:"p-3 text-neutral-300",children:"Modo de manuten\xe7\xe3o ativo no painel"}),a.jsx("td",{className:"p-3 text-neutral-400",children:"Exibir mensagem de aviso de manuten\xe7\xe3o tempor\xe1ria ao usu\xe1rio."})]})]})]})})})]})]})})}},7564:(e,t,s)=>{"use strict";s.d(t,{CommandMenu:()=>m});var a=s(326),r=s(7577),n=s(5047),i=s(4917),o=s(8307),l=s(4319),c=s(9163),d=s(9942),x=s(6343),u=s(8378);function m(){let[e,t]=r.useState(!1),s=(0,n.useRouter)();r.useEffect(()=>{let e=e=>{"k"===e.key&&(e.metaKey||e.ctrlKey)&&(e.preventDefault(),t(e=>!e))};return document.addEventListener("keydown",e),()=>document.removeEventListener("keydown",e)},[]);let m=e=>{t(!1),e()};return e?(0,a.jsxs)("div",{className:"fixed inset-0 z-50 flex items-start justify-center pt-24 p-4",children:[a.jsx("div",{className:"fixed inset-0 bg-black/80 backdrop-blur-sm",onClick:()=>t(!1)}),a.jsx("div",{className:"relative z-50 w-full max-w-lg rounded-lg border border-[#27272A] bg-[#0C0C0E] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100",children:(0,a.jsxs)(i.mY,{className:"w-full",children:[(0,a.jsxs)("div",{className:"flex items-center px-3 border-b border-[#1C1C1F]",children:[a.jsx(o.Z,{className:"h-4 w-4 text-neutral-500 mr-2 shrink-0"}),a.jsx(i.mY.Input,{placeholder:"Digite um comando ou pesquise (Ctrl + K)...",className:"w-full h-11 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"})]}),(0,a.jsxs)(i.mY.List,{className:"max-h-72 overflow-y-auto p-2",children:[a.jsx(i.mY.Empty,{className:"py-6 text-center text-xs text-neutral-500",children:"Nenhum resultado encontrado."}),(0,a.jsxs)(i.mY.Group,{heading:"Navega\xe7\xe3o",className:"text-[10px] font-mono uppercase text-neutral-500 px-2 py-1.5",children:[(0,a.jsxs)(i.mY.Item,{onSelect:()=>m(()=>s.push("/dashboard")),className:"flex items-center space-x-2 px-2 py-1.5 text-xs text-neutral-200 rounded-md cursor-pointer hover:bg-[#18181B] hover:text-white transition-colors",children:[a.jsx(l.Z,{className:"h-3.5 w-3.5 mr-1 text-neutral-400"}),a.jsx("span",{children:"Dashboard"})]}),(0,a.jsxs)(i.mY.Item,{onSelect:()=>m(()=>s.push("/applications")),className:"flex items-center space-x-2 px-2 py-1.5 text-xs text-neutral-200 rounded-md cursor-pointer hover:bg-[#18181B] hover:text-white transition-colors",children:[a.jsx(c.Z,{className:"h-3.5 w-3.5 mr-1 text-neutral-400"}),a.jsx("span",{children:"Aplica\xe7\xf5es"})]}),(0,a.jsxs)(i.mY.Item,{onSelect:()=>m(()=>s.push("/logs")),className:"flex items-center space-x-2 px-2 py-1.5 text-xs text-neutral-200 rounded-md cursor-pointer hover:bg-[#18181B] hover:text-white transition-colors",children:[a.jsx(d.Z,{className:"h-3.5 w-3.5 mr-1 text-neutral-400"}),a.jsx("span",{children:"Logs Globais"})]}),(0,a.jsxs)(i.mY.Item,{onSelect:()=>m(()=>s.push("/docs")),className:"flex items-center space-x-2 px-2 py-1.5 text-xs text-neutral-200 rounded-md cursor-pointer hover:bg-[#18181B] hover:text-white transition-colors",children:[a.jsx(x.Z,{className:"h-3.5 w-3.5 mr-1 text-neutral-400"}),a.jsx("span",{children:"Documenta\xe7\xe3o da API"})]}),(0,a.jsxs)(i.mY.Item,{onSelect:()=>m(()=>s.push("/settings")),className:"flex items-center space-x-2 px-2 py-1.5 text-xs text-neutral-200 rounded-md cursor-pointer hover:bg-[#18181B] hover:text-white transition-colors",children:[a.jsx(u.Z,{className:"h-3.5 w-3.5 mr-1 text-neutral-400"}),a.jsx("span",{children:"Configura\xe7\xf5es & Seguran\xe7a"})]})]})]})]})})]}):null}},8443:(e,t,s)=>{"use strict";s.d(t,{C:()=>i,O:()=>o});var a=s(326);s(7577);var r=s(1135),n=s(1009);function i({className:e,variant:t="default",...s}){return a.jsx("div",{className:(0,n.m6)((0,r.W)("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono uppercase tracking-wider transition-colors",{default:"border-[#27272A] bg-[#18181B] text-neutral-300",success:"border-emerald-800/40 bg-emerald-950/40 text-emerald-400 font-medium",danger:"border-rose-900/40 bg-rose-950/40 text-rose-400 font-medium",warning:"border-amber-800/40 bg-amber-950/40 text-amber-400 font-medium",outline:"border-[#27272A] text-neutral-400"}[t],e)),...s})}function o({status:e}){let t=e.toUpperCase();return"ACTIVE"===t||"SUCCESS"===t?a.jsx(i,{variant:"success",children:e}):"BANNED"===t||"REVOKED"===t||"FAILED"===t||"BLOCKED"===t?a.jsx(i,{variant:"danger",children:e}):"EXPIRED"===t||"PAUSED"===t||"MAINTENANCE"===t?a.jsx(i,{variant:"warning",children:e}):a.jsx(i,{variant:"default",children:e})}},1664:(e,t,s)=>{"use strict";s.d(t,{z:()=>o});var a=s(326),r=s(7577),n=s(1135),i=s(1009);let o=r.forwardRef(({className:e,variant:t="primary",size:s="md",isLoading:r,children:o,disabled:l,...c},d)=>(0,a.jsxs)("button",{ref:d,disabled:l||r,className:(0,i.m6)((0,n.W)("inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-50 select-none",{primary:"bg-white text-black hover:bg-neutral-200 active:bg-neutral-300 font-semibold shadow-sm",secondary:"bg-[#18181B] text-neutral-200 hover:bg-[#27272A] border border-[#27272A]",outline:"border border-[#27272A] text-neutral-300 hover:bg-[#18181B] hover:text-white",danger:"bg-[#7F1D1D] text-white hover:bg-[#991B1B] border border-red-800/40",ghost:"text-neutral-400 hover:text-white hover:bg-[#18181B]"}[t],{sm:"h-8 px-3 text-xs rounded-md",md:"h-9 px-4 text-sm rounded-md",lg:"h-11 px-6 text-base rounded-md",icon:"h-9 w-9 rounded-md"}[s],e)),...c,children:[r&&(0,a.jsxs)("svg",{className:"animate-spin -ml-1 mr-2 h-4 w-4 text-current",fill:"none",viewBox:"0 0 24 24",children:[a.jsx("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),a.jsx("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),o]}));o.displayName="Button"},9752:(e,t,s)=>{"use strict";s.d(t,{Ol:()=>o,SZ:()=>c,Zb:()=>i,aY:()=>d,eW:()=>x,ll:()=>l});var a=s(326);s(7577);var r=s(1135),n=s(1009);function i({className:e,...t}){return a.jsx("div",{className:(0,n.m6)((0,r.W)("rounded-lg border border-[#1C1C1F] bg-[#0A0A0C] text-[#EDEDED] shadow-sm transition-colors",e)),...t})}function o({className:e,...t}){return a.jsx("div",{className:(0,n.m6)((0,r.W)("flex flex-col space-y-1.5 p-6",e)),...t})}function l({className:e,...t}){return a.jsx("h3",{className:(0,n.m6)((0,r.W)("text-base font-semibold leading-none tracking-tight text-white",e)),...t})}function c({className:e,...t}){return a.jsx("p",{className:(0,n.m6)((0,r.W)("text-xs text-neutral-400 leading-relaxed",e)),...t})}function d({className:e,...t}){return a.jsx("div",{className:(0,n.m6)((0,r.W)("p-6 pt-0",e)),...t})}function x({className:e,...t}){return a.jsx("div",{className:(0,n.m6)((0,r.W)("flex items-center p-6 pt-0",e)),...t})}},4398:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>a});let a=(0,s(8570).createProxy)(String.raw`D:\GouAuth\src\app\connect\page.tsx#default`)},4742:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>o,metadata:()=>i});var a=s(9510);s(5023);var r=s(1032);let n=(0,s(8570).createProxy)(String.raw`D:\GouAuth\src\components\layout\command-menu.tsx#CommandMenu`),i={title:"GouAuth — Sistema Privado de Autentica\xe7\xe3o e Licenciamento",description:"Painel de administra\xe7\xe3o e valida\xe7\xe3o de licen\xe7as hospedado na Square Cloud"};function o({children:e}){return a.jsx("html",{lang:"pt-BR",className:"dark",children:(0,a.jsxs)("body",{className:"bg-black text-[#EDEDED] antialiased selection:bg-neutral-800 selection:text-white min-h-screen",children:[a.jsx(r.x7,{theme:"dark",position:"top-right",toastOptions:{style:{background:"#0C0C0E",border:"1px solid #27272A",color:"#EDEDED"}}}),a.jsx(n,{}),e]})})}},5023:()=>{}};var t=require("../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),a=t.X(0,[9276,4346,325,9823],()=>s(6038));module.exports=a})();