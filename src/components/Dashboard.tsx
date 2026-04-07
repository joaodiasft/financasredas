import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
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
  Cell,
} from "recharts";
import { formatCurrency, cn } from "../lib/utils";
import { DashboardData } from "../types";
import { motion } from "motion/react";

const COLORS = ["#0F172A", "#334155", "#10B981", "#F59E0B", "#F43F5E"];

function DashboardSkeleton() {
  return (
    <div className="page-content" aria-busy="true" aria-label="Carregando dados…">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-10 w-64" />
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 h-36 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="skeleton h-9 w-9 rounded-xl" />
              <div className="skeleton h-6 w-14 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="skeleton h-2.5 w-20" />
              <div className="skeleton h-8 w-32" />
            </div>
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8">
          <div className="skeleton h-[300px] w-full rounded-xl" />
        </div>
        <div className="glass-card p-8">
          <div className="skeleton h-[300px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return <DashboardSkeleton />;

  return (
    <div className="page-content">
      <header>
        <h2 className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mb-1">Visão Geral</h2>
        <h1 className="editorial-heading">Performance Financeira</h1>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: "Receita Total",   value: data.summary.totalRevenue,  icon: DollarSign,  color: "text-emerald-600", bg: "bg-emerald-50", trend: "+12.5%" },
          { label: "Despesas Totais", value: data.summary.totalExpenses, icon: TrendingDown, color: "text-rose-600",    bg: "bg-rose-50",    trend: "+4.2%"  },
          { label: "Lucro Líquido",   value: data.summary.netProfit,     icon: TrendingUp,  color: "text-brand-primary", bg: "bg-slate-100", trend: "+8.1%" },
          { label: "Crescimento",     value: data.summary.growth,        isPercent: true,   icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50", trend: "+2.3%" },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.25, ease: "easeOut" }}
            className="glass-card p-5 sm:p-6 flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex justify-between items-start">
              <div className={cn("p-2 rounded-xl", kpi.bg)}>
                <kpi.icon className={cn("w-5 h-5", kpi.color)} aria-hidden="true" />
              </div>
              <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", kpi.color, kpi.bg)}>
                {kpi.trend}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="kpi-value">
                {kpi.isPercent ? `${kpi.value}%` : formatCurrency(kpi.value)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Cash Flow Bar Chart */}
        <div className="lg:col-span-2 glass-card p-5 sm:p-8">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6 sm:mb-8">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Fluxo de Caixa</h3>
              <p className="text-sm text-slate-400 font-medium">Entradas vs Saídas mensais</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-brand-primary rounded-full" aria-hidden="true" />
                <span className="text-xs font-bold text-slate-500">Entradas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-300 rounded-full" aria-hidden="true" />
                <span className="text-xs font-bold text-slate-500">Saídas</span>
              </div>
            </div>
          </div>
          <div className="h-64 sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(v) => `R$${v / 1000}k`}
                  width={56}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="inflow"  fill="#0F172A" radius={[4, 4, 0, 0]} barSize={18} name="Entradas" />
                <Bar dataKey="outflow" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={18} name="Saídas"   />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-5 sm:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Gastos por Categoria</h3>
          <p className="text-sm text-slate-400 font-medium mb-6">Distribuição de despesas</p>
          <div className="h-48 sm:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.expensesByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2.5 mt-2">
            {data.expensesByCategory.map((cat, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{cat.name}</span>
                </div>
                <span className="text-xs font-extrabold text-slate-900 tabular-nums">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
