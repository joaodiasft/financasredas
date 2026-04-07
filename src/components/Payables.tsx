import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Search,
  MoreVertical,
} from "lucide-react";
import { formatCurrency, cn } from "../lib/utils";
import { motion } from "motion/react";

const payables = [
  { id: "1", description: "Aluguel Escritório",    amount: 12000, dueDate: "05/04/2026", status: "pending", priority: "high",     category: "Infraestrutura" },
  { id: "2", description: "AWS Cloud Services",    amount: 2500,  dueDate: "10/04/2026", status: "pending", priority: "medium",   category: "Software"       },
  { id: "3", description: "Salários Equipe",       amount: 45000, dueDate: "05/04/2026", status: "overdue", priority: "critical", category: "RH"             },
  { id: "4", description: "Marketing Google Ads",  amount: 8000,  dueDate: "15/04/2026", status: "paid",    priority: "medium",   category: "Marketing"      },
  { id: "5", description: "Internet Fibra",        amount: 350,   dueDate: "02/04/2026", status: "overdue", priority: "low",      category: "Infraestrutura" },
];

const statusLabels: Record<string, string> = {
  paid:    "Pago",
  pending: "Pendente",
  overdue: "Vencido",
};

const priorityLabels: Record<string, string> = {
  critical: "Crítico",
  high:     "Alto",
  medium:   "Médio",
  low:      "Baixo",
};

const priorityStyles: Record<string, string> = {
  critical: "bg-rose-100 text-rose-700",
  high:     "bg-amber-100 text-amber-700",
  medium:   "bg-sky-100 text-sky-700",
  low:      "bg-slate-100 text-slate-700",
};

export function Payables() {
  return (
    <div className="page-content">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mb-1">Gestão de Débitos</h2>
          <h1 className="editorial-heading">Contas a Pagar</h1>
        </div>
        <button className="bg-brand-primary text-white px-5 py-2.5 sm:py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/10 text-sm">
          <Plus className="w-4 h-4" />
          Nova Conta
        </button>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="glass-card p-5 sm:p-6 border-l-4 border-rose-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-50 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-600" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Vencidos Hoje</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">{formatCurrency(45350)}</p>
          <p className="text-xs font-bold text-rose-600 mt-1.5">2 contas críticas</p>
        </div>

        <div className="glass-card p-5 sm:p-6 border-l-4 border-amber-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 rounded-xl shrink-0">
              <Clock className="w-5 h-5 text-amber-600" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Próximos 7 Dias</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">{formatCurrency(14500)}</p>
          <p className="text-xs font-bold text-amber-600 mt-1.5">5 contas pendentes</p>
        </div>

        <div className="glass-card p-5 sm:p-6 border-l-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 rounded-xl shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Pagos no Mês</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">{formatCurrency(28900)}</p>
          <p className="text-xs font-bold text-emerald-600 mt-1.5">12 contas liquidadas</p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 min-w-[160px] max-w-xs flex-1">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="search"
                placeholder="Filtrar por nome…"
                aria-label="Filtrar contas"
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["Todos", "Pendentes", "Vencidos", "Pagos"].map((tab) => (
              <button
                key={tab}
                className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-white transition-all text-slate-500 hover:text-brand-primary"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive table */}
        <div className="table-wrapper">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-5 sm:px-8 py-4">Descrição</th>
                <th className="px-5 sm:px-8 py-4">Categoria</th>
                <th className="px-5 sm:px-8 py-4">Vencimento</th>
                <th className="px-5 sm:px-8 py-4">Prioridade</th>
                <th className="px-5 sm:px-8 py-4 text-right">Valor</th>
                <th className="px-5 sm:px-8 py-4">Status</th>
                <th className="px-5 sm:px-8 py-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payables.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  <td className="px-5 sm:px-8 py-4">
                    <p className="text-sm font-bold text-slate-900">{item.description}</p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">ID: {item.id}</p>
                  </td>
                  <td className="px-5 sm:px-8 py-4">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg whitespace-nowrap">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-5 sm:px-8 py-4">
                    <p className="text-sm font-bold text-slate-700 whitespace-nowrap">{item.dueDate}</p>
                  </td>
                  <td className="px-5 sm:px-8 py-4">
                    <span className={cn("text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg whitespace-nowrap", priorityStyles[item.priority])}>
                      {priorityLabels[item.priority] ?? item.priority}
                    </span>
                  </td>
                  <td className="px-5 sm:px-8 py-4 text-right">
                    <p className="text-sm font-extrabold text-slate-900 tabular-nums">{formatCurrency(item.amount)}</p>
                  </td>
                  <td className="px-5 sm:px-8 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          item.status === "paid"    ? "bg-emerald-500" :
                          item.status === "overdue" ? "bg-rose-500"    : "bg-amber-500"
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                        {statusLabels[item.status] ?? item.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 sm:px-8 py-4">
                    <button
                      aria-label="Opções"
                      className="p-2 text-slate-400 hover:text-brand-primary opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
