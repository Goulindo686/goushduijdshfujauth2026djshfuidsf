"use client";

import { Search, Database, Shield } from "lucide-react";

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="h-16 border-b border-[#1C1C1F] bg-[#070708]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h1 className="text-sm font-semibold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-[11px] text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-3">
        {/* Status da infraestrutura Square Cloud */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#0F0F12] border border-[#202024] text-[11px] text-neutral-300 font-mono">
          <Database className="h-3 w-3 text-emerald-400" />
          <span>Square Cloud DB</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        {/* Command Menu trigger */}
        <button
          onClick={() => {
            const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
            document.dispatchEvent(event);
          }}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-[#101012] border border-[#27272A] text-xs text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Pesquisar...</span>
          <kbd className="text-[10px] font-mono bg-[#1E1E22] px-1.5 py-0.5 rounded text-neutral-400">
            Ctrl+K
          </kbd>
        </button>
      </div>
    </header>
  );
}
