import React from "react";
import {
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { formatCurrency, cn } from "../lib/utils";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const turmas = [
  { id: "1", name: "Redação Nota Mil - Turma A",   students: 45, balance: 12500, performance:  12.5, status: "profitable" },
  { id: "2", name: "Matemática Avançada - Turma B", students: 32, balance: 8200,  performance:  -2.4, status: "loss"       },
  { id: "3", name: "Física Teórica - Turma C",      students: 28, balance: 7100,  performance:   5.8, status: "profitable" },
  { id: "4", name: "Química Orgânica - Turma D",    students: 38, balance: 9400,  performance:   0.5, status: "neutral"    },
];

const performanceData = [
  { name: "Jan", A: 4000, B: 2400 },
  { name: "Fev", A: 3000, B: 1398 },
  { name: "Mar", A: 2000, B: 9800 },
  { name: "Abr", A: 2780, B: 3908 },
  { name: "Mai", A: 1890, B: 4800 },
  { name: "Jun", A: 2390, B: 3800 },
];

export function Turmas() {
  return (
    <div className="page-content">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mb-1">Gestão de Grupos</h2>
          <h1 className="editorial-heading">Turmas & Performance</h1>
        </div>
        <button className="bg-brand-primary text-white px-5 py-2.5 sm:py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/10 text-sm">
          <Plus className="w-4 h-4" />
          Nova Turma
        </button>
      </header>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 glass-card p-5 sm:p-8">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-6 sm:mb-8">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Comparativo de Receita</h3>
              <p className="text-sm text-slate-400 font-medium">Desempenho entre turmas principais</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-brand-primary rounded-full" aria-hidden="true" />
                <span className="text-xs font-bold text-slate-500">Turma A</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-300 rounded-full" aria-hidden="true" />
                <span className="text-xs font-bold text-slate-500">Turma B</span>
              </div>
            </div>
          </div>
          <div className="h-56 sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={40} />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="A" fill="#0F172A" radius={[4, 4, 0, 0]} barSize={16} name="Turma A" />
                <Bar dataKey="B" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={16} name="Turma B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5 sm:p-8 bg-brand-primary text-white">
          <h3 className="text-lg sm:text-xl font-bold mb-1">Insight de Crescimento</h3>
          <p className="text-sm text-slate-400 font-medium mb-6">Baseado no último trimestre</p>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-emerald-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Melhor Performance</p>
                <p className="text-base sm:text-lg font-bold">Turma A (+15%)</p>
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                A Turma A apresentou crescimento de retenção de 15% após a implementação do novo módulo de redação.
              </p>
            </div>
            <button className="w-full py-3 bg-white text-brand-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-95 transition-all">
              Ver Relatório Completo
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Turma cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {turmas.map((turma, i) => (
          <motion.div
            key={turma.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.22 }}
            className="glass-card p-5 sm:p-6 group cursor-pointer hover:border-brand-primary/20 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-brand-primary group-hover:text-white transition-all">
                <Users className="w-5 h-5" aria-hidden="true" />
              </div>
              <button aria-label="Opções da turma" className="p-1.5 text-slate-300 hover:text-slate-600 rounded-lg transition-all">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <h4 className="font-bold text-slate-900 mb-1 text-sm leading-snug">{turma.name}</h4>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">{turma.students} Alunos</p>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Saldo Consolidado</p>
                <p className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">{formatCurrency(turma.balance)}</p>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg",
                  turma.status === "profitable" ? "bg-emerald-50 text-emerald-600" :
                  turma.status === "loss"       ? "bg-rose-50 text-rose-600"       : "bg-slate-50 text-slate-600"
                )}
              >
                {turma.performance > 0
                  ? <TrendingUp  className="w-3 h-3" aria-hidden="true" />
                  : <TrendingDown className="w-3 h-3" aria-hidden="true" />}
                {Math.abs(turma.performance)}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
