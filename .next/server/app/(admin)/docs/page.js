(()=>{var e={};e.id=5079,e.ids=[5079],e.modules={2406:e=>{"use strict";e.exports=require("@node-rs/argon2")},2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},4770:e=>{"use strict";e.exports=require("crypto")},2048:e=>{"use strict";e.exports=require("fs")},9801:e=>{"use strict";e.exports=require("os")},5315:e=>{"use strict";e.exports=require("path")},8678:e=>{"use strict";e.exports=import("pg")},739:(e,s,t)=>{"use strict";t.a(e,async(e,a)=>{try{t.r(s),t.d(s,{GlobalError:()=>d.a,__next_app__:()=>x,originalPathname:()=>h,pages:()=>m,routeModule:()=>v,tree:()=>p}),t(4633);var r=t(9080);t(5866),t(4742);var o=t(3191),i=t(8716),n=t(7922),d=t.n(n),l=t(5231),c={};for(let e in l)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>l[e]);t.d(s,c);var u=e([r]);r=(u.then?(await u)():u)[0];let p=["",{children:["(admin)",{children:["docs",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(t.bind(t,4633)),"D:\\GouAuth\\src\\app\\(admin)\\docs\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(t.bind(t,9080)),"D:\\GouAuth\\src\\app\\(admin)\\layout.tsx"],"not-found":[()=>Promise.resolve().then(t.t.bind(t,5866,23)),"next/dist/client/components/not-found-error"]}]},{layout:[()=>Promise.resolve().then(t.bind(t,4742)),"D:\\GouAuth\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(t.t.bind(t,5866,23)),"next/dist/client/components/not-found-error"]}],m=["D:\\GouAuth\\src\\app\\(admin)\\docs\\page.tsx"],h="/(admin)/docs/page",x={require:t,loadChunk:()=>Promise.resolve()},v=new o.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/(admin)/docs/page",pathname:"/docs",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:p}});a()}catch(e){a(e)}})},5916:(e,s,t)=>{Promise.resolve().then(t.bind(t,8282))},2933:(e,s,t)=>{"use strict";t.d(s,{Z:()=>a});let a=(0,t(2881).Z)("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]])},3810:(e,s,t)=>{"use strict";t.d(s,{Z:()=>a});let a=(0,t(2881).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},2130:(e,s,t)=>{"use strict";t.d(s,{Z:()=>a});let a=(0,t(2881).Z)("Terminal",[["polyline",{points:"4 17 10 11 4 5",key:"akl6gq"}],["line",{x1:"12",x2:"20",y1:"19",y2:"19",key:"q2wloq"}]])},8282:(e,s,t)=>{"use strict";t.r(s),t.d(s,{default:()=>p});var a=t(326),r=t(7577),o=t(7662),i=t(9752),n=t(8443),d=t(2130),l=t(2933),c=t(3810),u=t(5999);function p(){let[e,s]=r.useState(null),t=(e,t)=>{navigator.clipboard.writeText(t),s(e),u.A.success("C\xf3digo copiado!"),setTimeout(()=>s(null),2e3)},p=[{method:"POST",path:"/api/v1/auth/license",title:"Autentica\xe7\xe3o por Licen\xe7a",description:"Valida a chave de licen\xe7a, vincula o identificador do aparelho (HWID) e retorna status, expira\xe7\xe3o e permiss\xf5es.",body:`{
  "app_id": "meu-launcher-vip",
  "license": "GOU-XXXX-XXXX-XXXX",
  "hwid": "hwid_hash_do_dispositivo"
}`,response:`{
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
}`},{method:"POST",path:"/api/v1/auth/login",title:"Login de Usu\xe1rio",description:"Autentica usu\xe1rio da aplica\xe7\xe3o cadastrado previamente atrav\xe9s de credenciais e valida\xe7\xe3o de HWID.",body:`{
  "app_id": "meu-launcher-vip",
  "username": "usuario123",
  "password": "suaSenhaForte",
  "hwid": "hwid_hash_do_dispositivo"
}`,response:`{
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
}`},{method:"POST",path:"/api/v1/auth/register",title:"Registro de Usu\xe1rio com Licen\xe7a",description:"Cria uma conta de usu\xe1rio consumindo uma chave de licen\xe7a v\xe1lida e vinculando o dispositivo.",body:`{
  "app_id": "meu-launcher-vip",
  "username": "novo_usuario",
  "password": "senhaDoUsuario",
  "license": "GOU-XXXX-XXXX-XXXX",
  "hwid": "hwid_hash_do_dispositivo"
}`,response:`{
  "success": true,
  "data": {
    "message": "Usu\xe1rio registrado com sucesso.",
    "username": "novo_usuario",
    "expiresAt": "2026-10-23T00:00:00.000Z",
    "plan": { "name": "VIP", "level": 1 }
  },
  "error": null
}`},{method:"GET",path:"/api/v1/app/status?app_id=meu-launcher-vip",title:"Status da Aplica\xe7\xe3o & Manuten\xe7\xe3o",description:"Verifica se a aplica\xe7\xe3o est\xe1 operacional ou em modo de manuten\xe7\xe3o antes de carregar o cliente.",body:null,response:`{
  "success": true,
  "data": {
    "appId": "meu-launcher-vip",
    "name": "Meu Launcher VIP",
    "status": "ACTIVE",
    "maintenanceMessage": "Estamos realizando uma manuten\xe7\xe3o.",
    "currentVersion": "1.0.0"
  },
  "error": null
}`},{method:"GET",path:"/api/v1/app/version?app_id=meu-launcher-vip&current_version=1.0.0",title:"Checagem de Vers\xe3o & Atualiza\xe7\xf5es",description:"Consulta a vers\xe3o mais recente e se uma atualiza\xe7\xe3o obrigat\xf3ria \xe9 exigida para prosseguir.",body:null,response:`{
  "success": true,
  "data": {
    "latest_version": "1.1.0",
    "download_url": "https://meudominio.com/download/update.zip",
    "update_available": true,
    "update_required": true,
    "changelog": "- Corre\xe7\xf5es de bugs\\n- Novo layout",
    "checksum": "sha256_hash_do_arquivo"
  },
  "error": null
}`},{method:"GET",path:"/api/v1/app/variables?app_id=meu-launcher-vip",title:"Vari\xe1veis Remotas & Feature Flags",description:"L\xea vari\xe1veis p\xfablicas configuradas no painel administrativo.",body:null,response:`{
  "success": true,
  "data": {
    "variables": {
      "discord_link": "https://discord.gg/exemplo",
      "feature_vip_enabled": true,
      "server_port": 8080
    }
  },
  "error": null
}`}];return(0,a.jsxs)(a.Fragment,{children:[a.jsx(o.h,{title:"Documenta\xe7\xe3o da API REST",subtitle:"Refer\xeancia completa de endpoints p\xfablicos e integra\xe7\xe3o com SDK"}),(0,a.jsxs)("main",{className:"p-8 space-y-8 max-w-5xl w-full",children:[(0,a.jsxs)(i.Zb,{className:"border-[#202024]",children:[(0,a.jsxs)(i.Ol,{children:[a.jsx(i.ll,{className:"text-base",children:"Guia de Integra\xe7\xe3o GouAuth"}),a.jsx(i.SZ,{children:"Todos os endpoints p\xfablicos da API utilizam JSON no padr\xe3o de resposta padronizado:"})]}),(0,a.jsxs)(i.aY,{className:"space-y-4",children:[(0,a.jsxs)("div",{className:"p-3 bg-[#101014] border border-[#1E1E22] rounded-md font-mono text-xs text-neutral-300",children:[a.jsx("span",{className:"text-neutral-500",children:"// URL Base de Produ\xe7\xe3o (Square Cloud):"}),a.jsx("br",{}),a.jsx("span",{className:"text-white font-semibold",children:"https://gouauth.squareweb.app/api/v1"})]}),(0,a.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono",children:[(0,a.jsxs)("div",{className:"p-3 rounded bg-[#0A0A0C] border border-[#1C1C1F]",children:[a.jsx("p",{className:"text-emerald-400 font-semibold mb-1",children:"Padr\xe3o de Sucesso:"}),a.jsx("pre",{children:`{
  "success": true,
  "data": { ... },
  "error": null
}`})]}),(0,a.jsxs)("div",{className:"p-3 rounded bg-[#0A0A0C] border border-[#1C1C1F]",children:[a.jsx("p",{className:"text-rose-400 font-semibold mb-1",children:"Padr\xe3o de Erro:"}),a.jsx("pre",{children:`{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_LICENSE",
    "message": "Mensagem detalhada..."
  }
}`})]})]})]})]}),(0,a.jsxs)(i.Zb,{children:[(0,a.jsxs)(i.Ol,{children:[(0,a.jsxs)(i.ll,{className:"text-base flex items-center gap-2",children:[a.jsx(d.Z,{className:"h-4 w-4 text-white"}),"SDK TypeScript Oficial"]}),(0,a.jsxs)(i.SZ,{children:["Utilize a classe ",a.jsx("code",{children:"GouAuth"})," disponibilizada em ",a.jsx("code",{children:"src/sdk/gouauth.ts"})," no seu cliente Node/Electron:"]})]}),a.jsx(i.aY,{children:(0,a.jsxs)("div",{className:"relative",children:[a.jsx("pre",{className:"p-4 rounded-md bg-[#101014] border border-[#1E1E22] text-xs font-mono text-neutral-200 overflow-x-auto",children:`import { GouAuth } from "./sdk/gouauth";

const auth = new GouAuth({
  appId: "meu-launcher-vip",
  baseUrl: "https://gouauth.squareweb.app" // ou http://localhost:3000 em dev
});

// Autentica\xe7\xe3o com Licen\xe7a
try {
  const result = await auth.loginWithLicense({
    license: "GOU-ABCD-1234-EFGH"
  });

  if (result.authorized) {
    console.log("Sucesso! Plano:", result.plan?.name);
    console.log("Expira em:", result.expiresAt);
  }
} catch (error) {
  console.error("Falha na autentica\xe7\xe3o:", error.message);
}`}),a.jsx("button",{onClick:()=>t("sdk",`import { GouAuth } from "./sdk/gouauth";
...`),className:"absolute top-3 right-3 p-1.5 rounded bg-[#1C1C20] text-neutral-400 hover:text-white",children:"sdk"===e?a.jsx(l.Z,{className:"h-3.5 w-3.5 text-emerald-400"}):a.jsx(c.Z,{className:"h-3.5 w-3.5"})})]})})]}),(0,a.jsxs)("div",{className:"space-y-6",children:[a.jsx("h3",{className:"text-sm font-semibold text-white tracking-tight",children:"Endpoints da API P\xfablica"}),p.map((e,s)=>(0,a.jsxs)(i.Zb,{className:"border-[#202024]",children:[(0,a.jsxs)(i.Ol,{className:"pb-3",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between",children:[(0,a.jsxs)("div",{className:"flex items-center space-x-2",children:[a.jsx("span",{className:`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${"POST"===e.method?"bg-white text-black":"bg-neutral-800 text-neutral-200"}`,children:e.method}),a.jsx("span",{className:"font-mono text-xs font-semibold text-white",children:e.path})]}),a.jsx(n.C,{variant:"outline",children:e.title})]}),a.jsx(i.SZ,{className:"pt-1",children:e.description})]}),(0,a.jsxs)(i.aY,{className:"space-y-3 pt-0",children:[e.body&&(0,a.jsxs)("div",{children:[a.jsx("p",{className:"text-[11px] font-mono text-neutral-400 mb-1",children:"Request Body (JSON):"}),a.jsx("pre",{className:"p-2.5 rounded bg-[#101014] border border-[#1E1E22] text-xs font-mono text-neutral-300 overflow-x-auto",children:e.body})]}),(0,a.jsxs)("div",{children:[a.jsx("p",{className:"text-[11px] font-mono text-neutral-400 mb-1",children:"Response (JSON):"}),a.jsx("pre",{className:"p-2.5 rounded bg-[#101014] border border-[#1E1E22] text-xs font-mono text-neutral-300 overflow-x-auto",children:e.response})]})]})]},s))]})]})]})}},4633:(e,s,t)=>{"use strict";t.r(s),t.d(s,{default:()=>a});let a=(0,t(8570).createProxy)(String.raw`D:\GouAuth\src\app\(admin)\docs\page.tsx#default`)}};var s=require("../../../webpack-runtime.js");s.C(e);var t=e=>s(s.s=e),a=s.X(0,[9276,3405,4346,325,9823,4054,5124,5024],()=>t(739));module.exports=a})();