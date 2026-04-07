"use client";

import React from "react";
import {
  Download,
  Loader2,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Users,
  Building2,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";

const COLORS = ["#FF69B4", "#0F172A", "#10B981", "#F59E0B", "#6366F1", "#EC4899"];

type ReportPayload = {
  chart: { name: string; value: number }[];
  monthlyTable: { month: string; receita: number; despesa: number; saldo: number }[];
  revenueByCategory: { name: string; value: number }[];
  expenseByCategory: { name: string; value: number }[];
  byTurma: { name: string; value: number }[];
  byAccount: { name: string; entradas: number; saidas: number; liquido: number }[];
  pendingByStudent: { name: string; total: number; count: number }[];
  ticketMedio: number;
  ticketDelta: number;
  totalStudents: number;
  pendingInflowCount: number;
  pendingInflowSum: number;
  needsReconcileCount: number;
};

export function Reports() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error();
      return res.json() as Promise<ReportPayload>;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh] gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        Carregando relatórios...
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-center text-rose-600 py-20 font-medium">Erro ao carregar relatórios.</p>;
  }

  const exportFull = () => {
    const lines = [
      "=== Mensal ===",
      "Mês,Receita,Despesa,Saldo",
      ...data.monthlyTable.map((m) => `${m.month},${m.receita},${m.despesa},${m.saldo}`),
      "",
      "=== Receita por categoria ===",
      "Categoria,Valor",
      ...data.revenueByCategory.map((r) => `${r.name},${r.value}`),
      "",
      "=== Despesa por categoria ===",
      ...data.expenseByCategory.map((r) => `${r.name},${r.value}`),
      "",
      "=== Por turma ===",
      ...data.byTurma.map((r) => `${r.name},${r.value}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio-completo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase mb-1">Inteligência financeira</h2>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Relatórios completos</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            Visão consolidada: fluxo mensal, categorias, turmas, contas e inadimplência por aluno.
          </p>
        </div>
        <button
          type="button"
          onClick={exportFull}
          className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary transition-all shadow-lg text-sm"
        >
          <Download className="w-5 h-5" />
          Exportar tudo (CSV)
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Alunos ativos", value: String(data.totalStudents), icon: Users, c: "text-sky-600", bg: "bg-sky-50" },
          { label: "Ticket médio", value: formatCurrency(data.ticketMedio), icon: BarChart3, c: "text-emerald-600", bg: "bg-emerald-50" },
          {
            label: "Var. ticket",
            value: `${data.ticketDelta >= 0 ? "+" : ""}${data.ticketDelta}%`,
            icon: TrendingUp,
            c: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "A conciliar",
            value: String(data.needsReconcileCount),
            icon: AlertCircle,
            c: "text-violet-600",
            bg: "bg-violet-50",
          },
        ].map((k, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", k.bg)}>
              <k.icon className={cn("w-4 h-4", k.c)} />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{k.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Receita paga — tendência</h3>
          <p className="text-xs text-slate-400 mb-6">Últimos 12 meses (zerado quando não há receita paga)</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chart}>
                <defs>
                  <linearGradient id="repArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF69B4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF69B4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="value" stroke="#FF69B4" strokeWidth={3} fill="url(#repArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Comparativo mensal</h3>
          <p className="text-xs text-slate-400 mb-6">12 meses corridos — receita, despesa e saldo</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyTable}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="receita" fill="#FF69B4" radius={[4, 4, 0, 0]} name="Receita" />
                <Bar dataKey="despesa" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="Despesa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-h-[200px]">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
              <PieIcon className="w-4 h-4 text-primary" />
              Receita por categoria
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.revenueByCategory.slice(0, 6)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {data.revenueByCategory.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 max-h-[220px] overflow-y-auto">
            {data.revenueByCategory.map((r, i) => (
              <div key={i} className="flex justify-between text-xs py-2 border-b border-slate-50">
                <span className="font-bold text-slate-600">{r.name}</span>
                <span className="font-black text-emerald-600">{formatCurrency(r.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-primary" />
            Receita por turma
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byTurma.slice(0, 8)} layout="vertical" margin={{ left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={88} tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" fill="#0F172A" radius={[0, 6, 6, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Despesas por categoria</h3>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {data.expenseByCategory.length === 0 && <p className="text-sm text-slate-400">Sem despesas pagas no período.</p>}
            {data.expenseByCategory.map((r, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-50 rounded-xl px-4 py-2.5">
                <span className="text-xs font-bold text-slate-700">{r.name}</span>
                <span className="text-xs font-black text-rose-600">{formatCurrency(r.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-primary" />
            Por conta (entradas / saídas)
          </h3>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {data.byAccount.map((r, i) => (
              <div key={i} className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs font-bold text-slate-800 mb-2">{r.name}</p>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Entradas {formatCurrency(r.entradas)}</span>
                  <span>Saídas {formatCurrency(r.saidas)}</span>
                </div>
                <p className={cn("text-sm font-black mt-1", r.liquido >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  Líquido {formatCurrency(r.liquido)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Pendências por aluno
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Entradas pendentes vinculadas a cadastro. Total geral pendente:{" "}
          <strong className="text-white">{formatCurrency(data.pendingInflowSum)}</strong> ({data.pendingInflowCount} lançamentos)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.pendingByStudent.length === 0 && <p className="text-sm text-slate-400">Nenhuma pendência vinculada a aluno.</p>}
          {data.pendingByStudent.map((p, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">{p.name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{p.count} título(s)</p>
              </div>
              <span className="text-sm font-black text-amber-300">{formatCurrency(p.total)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tabela mensal detalhada</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[480px]">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                <th className="px-6 py-3">Mês</th>
                <th className="px-6 py-3 text-right">Receita</th>
                <th className="px-6 py-3 text-right">Despesa</th>
                <th className="px-6 py-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyTable.map((m, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-bold text-slate-800">{m.month}</td>
                  <td className="px-6 py-3 text-right font-semibold text-emerald-600">{formatCurrency(m.receita)}</td>
                  <td className="px-6 py-3 text-right font-semibold text-rose-600">{formatCurrency(m.despesa)}</td>
                  <td className="px-6 py-3 text-right font-black text-slate-900">{formatCurrency(m.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
