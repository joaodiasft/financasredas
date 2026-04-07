"use client";

import React, { useState } from "react";
import {
  Settings2,
  FileUp,
  BarChart3,
  GraduationCap,
  LogOut,
  Eraser,
  Info,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const APP_VERSION = "1.0.0";

function navigateTab(tab: string, inflowGroup?: string) {
  window.dispatchEvent(
    new CustomEvent("fin:navigate-tab", { detail: { tab, ...(inflowGroup ? { inflowGroup } : {}) } }),
  );
}

export function Settings() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [cleared, setCleared] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  function clearInflowTurmaFilter() {
    try {
      sessionStorage.removeItem("fin:inflowGroupFilter");
      setCleared(true);
      window.dispatchEvent(new CustomEvent("fin:refresh"));
      window.setTimeout(() => setCleared(false), 2500);
    } catch {
      /* ignore */
    }
  }

  const links = [
    {
      id: "import",
      label: "Importar extratos e dados",
      sub: "CSV, planilhas e integrações",
      icon: FileUp,
      onClick: () => navigateTab("import"),
    },
    {
      id: "reports",
      label: "Relatórios",
      sub: "Resumos e exportação",
      icon: BarChart3,
      onClick: () => navigateTab("reports"),
    },
    {
      id: "students",
      label: "Alunos",
      sub: "Cadastro e turmas do aluno",
      icon: GraduationCap,
      onClick: () => navigateTab("students"),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase">Preferências</h2>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-none">Configurações</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-3">
          Atalhos para o que você usa com frequência, limpeza de filtros locais e encerramento de sessão.
        </p>
      </header>

      <section className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-4">Navegação rápida</h3>
        <ul className="space-y-2">
          {links.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={item.onClick}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-slate-50/80 transition-all text-left group"
              >
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.sub}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-2">Dados neste navegador</h3>
        <p className="text-sm text-slate-500 mb-4">
          O filtro &quot;só entradas desta turma&quot; (quando você abre a partir de Turmas) fica salvo aqui até você limpar.
        </p>
        <button
          type="button"
          onClick={clearInflowTurmaFilter}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm border transition-all",
            cleared
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
          )}
        >
          {cleared ? (
            <>Filtro de turma removido</>
          ) : (
            <>
              <Eraser className="w-4 h-4" />
              Limpar filtro de turma nas Entradas
            </>
          )}
        </button>
      </section>

      <section className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-4">Conta</h3>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-rose-600 transition-colors disabled:opacity-60"
        >
          {loggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
          Sair da aplicação
        </button>
      </section>

      <section className="rounded-3xl p-6 md:p-8 bg-slate-100/80 border border-slate-200/80">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-1">Sobre</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-900">Redação Financeiro</span> — gestão de entradas, saídas, turmas e
              alunos. Versão {APP_VERSION}.
            </p>
            <p className="text-xs text-slate-500 mt-3">Categorias e contas padrão são definidas no cadastro e no seed do banco.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
