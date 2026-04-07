import React from "react";
import { Bell, BarChart3, Search, Settings } from "lucide-react";

export function Topbar() {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 w-full transition-all">
      <div className="flex items-center gap-4 flex-1 max-w-md bg-slate-100 px-4 py-2 rounded-2xl ml-12 md:ml-0">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Pesquisar..." 
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 focus:ring-0"
        />
      </div>

      <div className="flex items-center gap-2 md:gap-6 ml-4">
        <button
          type="button"
          title="Relatórios"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("fin:navigate-tab", { detail: { tab: "reports" } }))
          }
          className="p-2 text-slate-400 hover:text-primary transition-colors rounded-xl hover:bg-slate-100"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
        <button
          type="button"
          title="Configurações"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("fin:navigate-tab", { detail: { tab: "settings" } }))
          }
          className="p-2 text-slate-400 hover:text-primary transition-colors hidden sm:block rounded-xl hover:bg-slate-100"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button className="relative p-2 text-slate-400 hover:text-primary transition-colors hidden sm:block">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
        </button>
        
        <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />
        
        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-right hidden xs:block">
            <p className="text-sm font-bold text-slate-900 leading-none">Administrador</p>
            <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-1">Elysian Ledger</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold shadow-sm border border-primary/20">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
