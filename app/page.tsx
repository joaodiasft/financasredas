"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { invalidateFinancialQueries } from "@/lib/invalidateFinancialQueries";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Dashboard } from "@/components/Dashboard";
import { Payables } from "@/components/Payables";
import { Turmas } from "@/components/Turmas";
import { Transactions } from "@/components/Transactions";
import { StudentFormModal } from "@/components/Students";
import { Import } from "@/components/Import";
import { Reports } from "@/components/Reports";
import { Students } from "@/components/Students";
import { Settings } from "@/components/Settings";
import { motion, AnimatePresence } from "motion/react";
import { Plus, UserPlus, ArrowUpCircle, X, LayoutDashboard, GraduationCap, Users } from "lucide-react";

function NavigateTabBridge({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  useEffect(() => {
    const fn = (e: Event) => {
      const d = (e as CustomEvent<{ tab?: string; inflowGroup?: string }>).detail;
      if (d?.tab) setActiveTab(d.tab);
      if (d?.inflowGroup) sessionStorage.setItem("fin:inflowGroupFilter", d.inflowGroup);
    };
    window.addEventListener("fin:navigate-tab", fn);
    return () => window.removeEventListener("fin:navigate-tab", fn);
  }, [setActiveTab]);
  return null;
}

function DataRefreshBridge() {
  const qc = useQueryClient();
  useEffect(() => {
    const fn = () => invalidateFinancialQueries(qc);
    window.addEventListener("fin:refresh", fn);
    return () => window.removeEventListener("fin:refresh", fn);
  }, [qc]);
  return null;
}

function PostLoginWelcome({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const entered = searchParams.get("entered") === "1";
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!entered) return;
    invalidateFinancialQueries(qc);
  }, [entered, qc]);

  if (!entered || gone) return null;

  const close = () => {
    setGone(true);
    router.replace("/", { scroll: false });
  };

  const go = (tab: string) => {
    setActiveTab(tab);
    close();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/95 via-white to-white px-4 py-4 md:px-6 shadow-sm"
    >
      <button
        type="button"
        onClick={close}
        className="absolute top-3 right-3 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        aria-label="Fechar aviso"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="pr-10 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Bem-vindo ao painel</p>
        <p className="text-sm md:text-base text-slate-800 font-medium leading-snug">
          Esta conta vê os <strong>dados já cadastrados</strong> da Redação no mesmo banco: receitas, despesas, alunos,
          turmas e histórico de importação. Nada fica “preso” a outro login — todos os usuários autorizados
          compartilham esta visão.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => go("dashboard")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-primary/40"
        >
          <LayoutDashboard className="w-4 h-4 text-primary" />
          Painel geral
        </button>
        <button
          type="button"
          onClick={() => go("students")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-primary/40"
        >
          <GraduationCap className="w-4 h-4 text-primary" />
          Alunos
        </button>
        <button
          type="button"
          onClick={() => go("inflows")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-primary/40"
        >
          <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
          Entradas
        </button>
        <button
          type="button"
          onClick={() => go("turmas")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-primary/40"
        >
          <Users className="w-4 h-4 text-primary" />
          Turmas
        </button>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "inflows":
        return <Transactions type="inflow" />;
      case "outflows":
        return <Transactions type="outflow" />;
      case "payables":
        return <Payables />;
      case "turmas":
        return <Turmas />;
      case "reports":
        return <Reports />;
      case "import":
        return <Import />;
      case "students":
        return <Students />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DataRefreshBridge />
      <NavigateTabBridge setActiveTab={setActiveTab} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Topbar />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Suspense fallback={null}>
            <PostLoginWelcome setActiveTab={setActiveTab} />
          </Suspense>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>

          <div className="fixed bottom-8 right-8 z-50 md:bottom-12 md:right-12 flex flex-col items-end gap-3">
            <AnimatePresence>
              {fabOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="flex flex-col gap-2 items-end"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setFabOpen(false);
                      setActiveTab("inflows");
                      window.dispatchEvent(new CustomEvent("fin:open-inflow"));
                    }}
                    className="flex items-center gap-3 pl-4 pr-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-xl text-sm font-bold text-slate-800 hover:border-primary/40"
                  >
                    <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                    Nova entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFabOpen(false);
                      setStudentFormOpen(true);
                    }}
                    className="flex items-center gap-3 pl-4 pr-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-xl text-sm font-bold text-slate-800 hover:border-primary/40"
                  >
                    <UserPlus className="w-5 h-5 text-primary" />
                    Cadastrar aluno
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => setFabOpen((o) => !o)}
              className="w-16 h-16 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all group relative"
              aria-label="Ações rápidas"
            >
              {fabOpen ? (
                <X className="w-8 h-8" />
              ) : (
                <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
              )}
            </button>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {studentFormOpen && (
          <StudentFormModal
            initial={null}
            onClose={() => setStudentFormOpen(false)}
            onSaved={() => {
              setStudentFormOpen(false);
              window.dispatchEvent(new CustomEvent("fin:refresh"));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
