import React, { useState } from "react";
import { Bell, Search, Menu, X } from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-16 sm:h-20 bg-white/60 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40">

      {/* Left: hamburger (mobile) + search (desktop) */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="lg:hidden p-2 -ml-1 rounded-xl text-slate-500 hover:text-brand-primary hover:bg-slate-100 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar — hidden on small screens unless toggled */}
        <div
          className={`
            ${searchOpen ? "flex absolute inset-x-0 top-0 h-16 sm:h-20 bg-white px-4 sm:px-6 items-center z-10" : "hidden sm:flex"}
            items-center gap-3 bg-slate-100 px-4 py-2 rounded-2xl sm:w-80 lg:w-96
          `}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="search"
            placeholder="Pesquisar transações, turmas..."
            aria-label="Pesquisar"
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
          />
          {searchOpen && (
            <button
              onClick={() => setSearchOpen(false)}
              aria-label="Fechar pesquisa"
              className="sm:hidden p-1 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search icon — mobile only, opens expanded input */}
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Pesquisar"
          className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-brand-primary hover:bg-slate-100 transition-all"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-3 sm:gap-5 ml-3">
        <button
          aria-label="Notificações"
          className="relative p-2 text-slate-400 hover:text-brand-primary hover:bg-slate-100 rounded-xl transition-all"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" aria-hidden="true" />
        </button>

        <div className="hidden sm:block h-7 w-px bg-slate-200" aria-hidden="true" />

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-slate-900 leading-tight">Elena Rodrigues</p>
            <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">Administradora</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
            ER
          </div>
        </div>
      </div>
    </header>
  );
}
