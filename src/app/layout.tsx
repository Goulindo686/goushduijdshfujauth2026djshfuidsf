import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { CommandMenu } from "@/components/layout/command-menu";

export const metadata: Metadata = {
  title: "GouAuth — Sistema Privado de Autenticação e Licenciamento",
  description: "Painel de administração e validação de licenças hospedado na Square Cloud",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-black text-[#EDEDED] antialiased selection:bg-neutral-800 selection:text-white min-h-screen">
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#0C0C0E",
              border: "1px solid #27272A",
              color: "#EDEDED",
            },
          }}
        />
        <CommandMenu />
        {children}
      </body>
    </html>
  );
}
