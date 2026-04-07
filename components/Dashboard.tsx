"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  RefreshCw,
  PiggyBank,
  Percent,
  Wallet,
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { formatCurrency, cn } from "@/lib/utils";
import type { DashboardData } from "@/types";
import { motion } from "motion/react";

const COLORS = ['#FF69B4', '#0F172A', '#334155', '#E91E63', '#F43F5E'];

export function Dashboard() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) {
        window.location.href = "/login";
        throw new Error("unauthorized");
      }
      if (!res.ok) throw new Error("fetch");
      return res.json() as Promise<DashboardData>;
    },
  });

  if (isError) {
    return (
      <p className="text-center text-rose-600 font-medium py-20">
        Não foi possível carregar o painel. Confira o banco e execute <code className="text-xs bg-slate-100 px-2 py-1 rounded">npm run prisma:push</code> e{" "}
        <code className="text-xs bg-slate-100 px-2 py-1 rounded">npm run db:seed</code>. (Só use{" "}
        <code className="text-xs bg-slate-100 px-2 py-1 rounded">npm run db:seed:reset</code> se quiser apagar importações e voltar ao extrato de exemplo.)
      </p>
    );
  }

  if (isLoading || data === undefined) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Carregando performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h2 className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase mb-1">Visão Geral • 2026</h2>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Performance Financeira</h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Receita total (12m)", value: data.summary.totalRevenue, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Despesas totais (12m)", value: data.summary.totalExpenses, icon: TrendingDown, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Lucro líquido", value: data.summary.netProfit, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
          { label: "Crescimento m/m", value: data.summary.growth, isPercent: true, icon: Percent, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-slate-100 p-4 md:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[120px]"
          >
            <div className={cn("p-2 rounded-lg w-fit", kpi.bg)}>
              <kpi.icon className={cn("w-5 h-5", kpi.color)} />
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 leading-tight">{kpi.label}</p>
              <p className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                {kpi.isPercent ? `${kpi.value}%` : formatCurrency(kpi.value as number)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {[
          { label: "Receita no mês", value: data.summary.revenueThisMonth ?? 0, icon: PiggyBank, color: "text-emerald-700", bg: "bg-emerald-50/80" },
          { label: "Despesas no mês", value: data.summary.expensesThisMonth ?? 0, icon: Wallet, color: "text-rose-700", bg: "bg-rose-50/80" },
          { label: "Margem no mês", value: data.summary.marginMonth ?? 0, isPercent: true, icon: Percent, color: "text-indigo-700", bg: "bg-indigo-50" },
          { label: "Alunos ativos", value: data.summary.activeStudents ?? 0, isInt: true, icon: Users, color: "text-sky-700", bg: "bg-sky-50" },
          { label: "Entradas pendentes", value: data.summary.pendingInflowSum ?? 0, sub: `${data.summary.pendingInflowCount ?? 0} lanç.`, icon: Clock, color: "text-amber-700", bg: "bg-amber-50" },
          { label: "Saídas pendentes", value: data.summary.outPendingSum ?? 0, sub: `${data.summary.outPendingCount ?? 0} lanç.`, icon: AlertTriangle, color: "text-orange-700", bg: "bg-orange-50" },
        ].map((kpi, i) => (
          <motion.div
            key={`m-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.04 }}
            className="bg-white border border-slate-100 p-3 md:p-4 rounded-xl shadow-sm"
          >
            <kpi.icon className={cn("w-4 h-4 mb-2", kpi.color)} />
            <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-tight mb-1">{kpi.label}</p>
            <p className="text-sm md:text-base font-black text-slate-900">
              {kpi.isPercent ? `${kpi.value}%` : kpi.isInt ? kpi.value : formatCurrency(kpi.value as number)}
            </p>
            {kpi.sub && <p className="text-[9px] text-slate-500 mt-0.5 font-semibold">{kpi.sub}</p>}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            label: "Importações a conciliar",
            value: String(data.summary.reconcilePending ?? 0),
            icon: RefreshCw,
            color: "text-violet-700",
            bg: "bg-violet-50",
            hint: "Vá em Importar para vincular alunos",
          },
          {
            label: "Contas fixas ativas",
            value: String(data.summary.fixedBillsActive ?? 0),
            icon: DollarSign,
            color: "text-slate-700",
            bg: "bg-slate-100",
            hint: "Contas a pagar → seção fixas",
          },
          {
            label: "Fixas com venc. em 7 dias",
            value: String(data.summary.fixedDueSoon ?? 0),
            icon: Clock,
            color: "text-pink-700",
            bg: "bg-pink-50",
            hint: "Dia do mês configurado",
          },
          {
            label: "Ticket médio (12m)",
            value:
              (data.summary.totalRevenue ?? 0) > 0 && (data.summary.activeStudents ?? 0) > 0
                ? formatCurrency((data.summary.totalRevenue ?? 0) / (data.summary.activeStudents ?? 1))
                : "—",
            icon: Users,
            color: "text-teal-700",
            bg: "bg-teal-50",
            hint: "Receita / alunos ativos (aprox.)",
          },
        ].map((kpi, i) => (
          <motion.div
            key={`x-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 + i * 0.05 }}
            className="bg-gradient-to-br from-white to-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm"
          >
            <div className={cn("p-2 rounded-lg w-fit mb-2", kpi.bg)}>
              <kpi.icon className={cn("w-4 h-4", kpi.color)} />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
            <p className="text-lg font-black text-slate-900 mt-1">{kpi.value}</p>
            <p className="text-[9px] text-slate-500 mt-1 leading-snug">{kpi.hint}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Receitas por categoria</h3>
          <p className="text-xs text-slate-400 mb-4">Entradas pagas no período</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data.revenueByCategory ?? []).slice(0, 6)} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" fill="#FF69B4" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Receita por turma</h3>
          <p className="text-xs text-slate-400 mb-4">Tags nas entradas (turmas vinculadas)</p>
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {(data.revenueByTurma ?? []).length === 0 && <p className="text-sm text-slate-400">Sem dados por turma ainda.</p>}
            {(data.revenueByTurma ?? []).map((t, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-50 rounded-xl px-4 py-2.5">
                <span className="text-xs font-bold text-slate-700">{t.name}</span>
                <span className="text-xs font-black text-primary">{formatCurrency(t.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Movimento por conta</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(data.byAccount ?? []).map((a, i) => (
            <div key={i} className="border border-slate-100 rounded-xl p-4 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 truncate pr-2">{a.name}</span>
              <span className="text-xs font-black text-slate-900 shrink-0">{formatCurrency(a.value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Fluxo de Caixa</h3>
              <p className="text-sm text-slate-400 font-medium">Últimos 6 meses (meses sem movimento em zero)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_8px_rgba(255,105,180,0.5)]" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Entradas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-200 rounded-full" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Saídas</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(value) => `R$ ${value/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="inflow" fill="#FF69B4" radius={[6, 6, 0, 0]} barSize={32} />
                <Bar dataKey="outflow" fill="#E2E8F0" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 mb-1">Distribuição</h3>
          <p className="text-sm text-slate-400 font-medium mb-8">Gastos por Categoria</p>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {data.expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 mt-8">
              {data.expensesByCategory.map((cat, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{cat.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


