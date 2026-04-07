import React from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  Search,
  Download,
  MoreVertical,
} from "lucide-react";
import { formatCurrency, cn } from "../lib/utils";
import { motion } from "motion/react";

interface TransactionsProps {
  type: "inflow" | "outflow";
}

const transactions = [
  { id: "1", description: "Mensalidade - Martha Dias",    amount: 450,  date: "03/04/2026", category: "Mensalidade",    status: "paid",    account: "Nubank"         },
  { id: "2", description: "Material Didático - Turma A",  amount: 1200, date: "02/04/2026", category: "Venda Material",  status: "paid",    account: "Banco do Brasil" },
  { id: "3", description: "Mensalidade - João Silva",     amount: 450,  date: "01/04/2026", category: "Mensalidade",    status: "pending", account: "Pix"             },
  { id: "4", description: "Serviços de Limpeza",          amount: 800,  date: "30/03/2026", category: "Manutenção",     status: "paid",    account: "Itaú"            },
  { id: "5", description: "Mensalidade - Ana Costa",      amount: 450,  date: "29/03/2026", category: "Mensalidade",    status: "paid",    account: "Nubank"          },
];

const statusLabels: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Vencido",
};

const statusStyles: Record<string, string> = {
  paid:    "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  overdue: "bg-rose-100 text-rose-700",
};

export function Transactions({ type }: TransactionsProps) {
  const isInflow = type === "inflow";

  return (
    <div className="page-content">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mb-1">
            {isInflow ? "Gestão de Recebimentos" : "Gestão de Pagamentos"}
          </h2>
          <h1 className="editorial-heading">{isInflow ? "Entradas" : "Saídas"}</h1>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all text-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            className={cn(
              "text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg text-sm",
              isInflow
                ? "bg-emerald-600 shadow-emerald-900/10 hover:bg-emerald-700"
                : "bg-rose-600 shadow-rose-900/10 hover:bg-rose-700"
            )}
          >
            {isInflow ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
            <span>Nova {isInflow ? "Entrada" : "Saída"}</span>
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {[
          {
            label: `Total ${isInflow ? "Recebido" : "Pago"}`,
            value: isInflow ? 125430 : 84200,
            icon: isInflow ? ArrowUpCircle : ArrowDownCircle,
            color: isInflow ? "text-emerald-600" : "text-rose-600",
            bg: isInflow ? "bg-emerald-50" : "bg-rose-50",
          },
          { label: "Média Diária",     value: isInflow ? 4180 : 2800, icon: Filter, color: "text-brand-primary", bg: "bg-slate-100" },
          { label: "Maior Categoria",  value: isInflow ? "Mensalidades" : "Salários", isText: true, icon: Search, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 sm:p-6">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} aria-hidden="true" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {stat.isText ? stat.value : formatCurrency(stat.value as number)}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 flex-1 min-w-[160px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="search"
              placeholder="Pesquisar…"
              aria-label="Pesquisar transações"
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Responsive table */}
        <div className="table-wrapper">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-5 sm:px-8 py-4">Data</th>
                <th className="px-5 sm:px-8 py-4">Descrição</th>
                <th className="px-5 sm:px-8 py-4">Categoria</th>
                <th className="px-5 sm:px-8 py-4">Conta</th>
                <th className="px-5 sm:px-8 py-4 text-right">Valor</th>
                <th className="px-5 sm:px-8 py-4">Status</th>
                <th className="px-5 sm:px-8 py-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  <td className="px-5 sm:px-8 py-4">
                    <p className="text-sm font-bold text-slate-700 whitespace-nowrap">{item.date}</p>
                  </td>
                  <td className="px-5 sm:px-8 py-4">
                    <p className="text-sm font-bold text-slate-900">{item.description}</p>
                  </td>
                  <td className="px-5 sm:px-8 py-4">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg whitespace-nowrap">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-5 sm:px-8 py-4">
                    <p className="text-sm font-semibold text-slate-600 whitespace-nowrap">{item.account}</p>
                  </td>
                  <td className="px-5 sm:px-8 py-4 text-right">
                    <p className={cn("text-sm font-extrabold tabular-nums", isInflow ? "text-emerald-600" : "text-rose-600")}>
                      {isInflow ? "+" : "−"}{formatCurrency(item.amount)}
                    </p>
                  </td>
                  <td className="px-5 sm:px-8 py-4">
                    <span className={cn("text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg whitespace-nowrap", statusStyles[item.status])}>
                      {statusLabels[item.status] ?? item.status}
                    </span>
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
