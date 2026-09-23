"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { LayoutDashboard, Layers, ScrollText, Settings, BookOpen, Search } from "lucide-react";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-lg rounded-lg border border-[#27272A] bg-[#0C0C0E] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <Command className="w-full">
          <div className="flex items-center px-3 border-b border-[#1C1C1F]">
            <Search className="h-4 w-4 text-neutral-500 mr-2 shrink-0" />
            <Command.Input
              placeholder="Digite um comando ou pesquise (Ctrl + K)..."
              className="w-full h-11 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
            />
          </div>

          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-xs text-neutral-500">
              Nenhum resultado encontrado.
            </Command.Empty>

            <Command.Group heading="Navegação" className="text-[10px] font-mono uppercase text-neutral-500 px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard"))}
                className="flex items-center space-x-2 px-2 py-1.5 text-xs text-neutral-200 rounded-md cursor-pointer hover:bg-[#18181B] hover:text-white transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5 mr-1 text-neutral-400" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/applications"))}
                className="flex items-center space-x-2 px-2 py-1.5 text-xs text-neutral-200 rounded-md cursor-pointer hover:bg-[#18181B] hover:text-white transition-colors"
              >
                <Layers className="h-3.5 w-3.5 mr-1 text-neutral-400" />
                <span>Aplicações</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/logs"))}
                className="flex items-center space-x-2 px-2 py-1.5 text-xs text-neutral-200 rounded-md cursor-pointer hover:bg-[#18181B] hover:text-white transition-colors"
              >
                <ScrollText className="h-3.5 w-3.5 mr-1 text-neutral-400" />
                <span>Logs Globais</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/docs"))}
                className="flex items-center space-x-2 px-2 py-1.5 text-xs text-neutral-200 rounded-md cursor-pointer hover:bg-[#18181B] hover:text-white transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5 mr-1 text-neutral-400" />
                <span>Documentação da API</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/settings"))}
                className="flex items-center space-x-2 px-2 py-1.5 text-xs text-neutral-200 rounded-md cursor-pointer hover:bg-[#18181B] hover:text-white transition-colors"
              >
                <Settings className="h-3.5 w-3.5 mr-1 text-neutral-400" />
                <span>Configurações & Segurança</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
