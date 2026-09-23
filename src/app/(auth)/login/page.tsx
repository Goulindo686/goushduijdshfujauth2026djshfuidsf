"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, KeyRound, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [totpCode, setTotpCode] = React.useState("");
  const [requires2FA, setRequires2FA] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          totpCode: requires2FA ? totpCode : undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMsg(data.error?.message || "Credenciais inválidas.");
        setIsLoading(false);
        return;
      }

      if (data.data?.requires2FA) {
        setRequires2FA(true);
        setIsLoading(false);
        toast.info("Insira o código de autenticação de dois fatores (2FA).");
        return;
      }

      toast.success("Autenticado com sucesso!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMsg("Erro de comunicação com o servidor.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-black select-none">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-lg bg-white text-black items-center justify-center font-bold text-lg shadow-lg">
            GA
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">GouAuth</h1>
          <p className="text-xs text-neutral-400">
            Painel Privado de Gestão & Autenticação
          </p>
        </div>

        <Card className="border-[#202024] bg-[#0A0A0C]">
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-sm">
                {requires2FA ? "Autenticação em Dois Fatores" : "Acesso do Administrador"}
              </CardTitle>
              <CardDescription>
                {requires2FA
                  ? "Digite o código do aplicativo autenticador ou código de recuperação."
                  : "Insira suas credenciais para gerenciar suas aplicações."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="flex items-center space-x-2 rounded-md bg-rose-950/30 border border-rose-900/50 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {!requires2FA ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">Email</label>
                    <Input
                      type="email"
                      required
                      placeholder="admin@gouauth.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">Senha</label>
                    <Input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Código 2FA (6 dígitos) ou Recovery Code</label>
                  <Input
                    type="text"
                    required
                    placeholder="000000"
                    maxLength={10}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    autoFocus
                    className="font-mono text-center tracking-widest text-base"
                  />
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-3">
              <Button type="submit" className="w-full" isLoading={isLoading}>
                {requires2FA ? "Validar e Entrar" : "Entrar no Painel"}
              </Button>

              {requires2FA && (
                <button
                  type="button"
                  onClick={() => setRequires2FA(false)}
                  className="text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Voltar ao login com senha
                </button>
              )}
            </CardFooter>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-[11px] text-neutral-600 font-mono">
            Ambiente Seguro • Square Cloud PostgreSQL
          </p>
        </div>
      </div>
    </main>
  );
}
