"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Search,
  Loader2,
  CheckCircle,
  Trash2,
  Pin,
  Zap,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BANK_ACCOUNTS } from "@/lib/orgConstants";
import type { ExpenseTag } from "@/lib/transactionDisplay";

type PayableRow = {
  id: string;
  description: string;
  displayDescription: string;
  expenseTag: ExpenseTag;
  expenseTagLabel: string;
  category: string;
  dueDate: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  priority: "low" | "medium" | "high" | "critical";
  fixedBillId?: string | null;
};

type FixedBill = {
  id: string;
  description: string;
  category: string;
  amount: number;
  account: string | null;
  dueDay: number;
  priority: string;
  active: boolean;
  slug?: string | null;
};

const summaryDefault = {
  overdueTotal: 0,
  next7Total: 0,
  paidMonthTotal: 0,
  criticalOverdue: 0,
  overdueCount: 0,
  next7Count: 0,
  paidMonthCount: 0,
};

const EXPENSE_TAG_FILTERS: { id: "all" | ExpenseTag; label: string }[] = [
  { id: "all", label: "Todas despesas" },
  { id: "aluguel", label: "Aluguel" },
  { id: "agua", label: "Água" },
  { id: "internet", label: "Internet" },
  { id: "alarme", label: "Alarme" },
];

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"] as const;

export function Payables() {
  const [tab, setTab] = useState<"all" | "pending" | "overdue" | "paid" | "variable">("all");
  const [expenseTag, setExpenseTag] = useState<"all" | ExpenseTag>("all");
  const [q, setQ] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [openFixedModal, setOpenFixedModal] = useState(false);
  const [genMonth, setGenMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const queryClient = useQueryClient();
  const calendarYear = new Date().getFullYear();

  const { data: payData, isLoading: loadPay, isError: errPay } = useQuery({
    queryKey: ["payables"],
    queryFn: async () => {
      const res = await fetch("/api/payables");
      if (!res.ok) throw new Error();
      return res.json() as Promise<{ summary: typeof summaryDefault; items: PayableRow[] }>;
    },
  });

  const { data: fixedData, isLoading: loadFixed } = useQuery({
    queryKey: ["fixed-bills"],
    queryFn: async () => {
      const res = await fetch("/api/fixed-bills");
      if (!res.ok) throw new Error();
      const j = await res.json();
      return j.items as FixedBill[];
    },
  });

  const { data: yearGridData } = useQuery({
    queryKey: ["fixed-bills-year-grid", calendarYear],
    queryFn: async () => {
      const res = await fetch(`/api/fixed-bills/year-grid?year=${calendarYear}`);
      if (!res.ok) throw new Error();
      return res.json() as Promise<{ year: number; grid: Record<string, boolean[]> }>;
    },
  });

  const summary = payData?.summary ?? summaryDefault;
  const items = useMemo(() => payData?.items ?? [], [payData?.items]);
  const fixedBills = (fixedData ?? []).filter((f) => f.active);
  const yearGrid = yearGridData?.grid ?? {};

  const filtered = useMemo(() => {
    let list = items;
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter(
        (i) =>
          i.displayDescription.toLowerCase().includes(qq) ||
          i.description.toLowerCase().includes(qq) ||
          i.category.toLowerCase().includes(qq),
      );
    }
    if (expenseTag !== "all") list = list.filter((i) => i.expenseTag === expenseTag);
    if (tab === "variable") list = list.filter((i) => !i.fixedBillId);
    if (tab === "pending") list = list.filter((i) => i.status === "pending");
    if (tab === "overdue") list = list.filter((i) => i.status === "overdue");
    if (tab === "paid") list = list.filter((i) => i.status === "paid");
    return list;
  }, [items, tab, q, expenseTag]);

  const genMut = useMutation({
    mutationFn: async ({ id, month }: { id: string; month: string }) => {
      const res = await fetch(`/api/fixed-bills/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Erro");
      return j;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["fixed-bills-year-grid"] });
    },
  });

  const patchMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payables"] }),
  });

  if (loadPay || loadFixed) {
    return (
      <div className="flex items-center justify-center h-[50vh] gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="font-medium">Carregando...</span>
      </div>
    );
  }

  if (errPay) {
    return <p className="text-center text-rose-600 py-20 font-medium">Erro ao carregar contas a pagar.</p>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase mb-1">Gestão de débitos</h2>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-none">Contas a pagar</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            <strong className="text-slate-700">Contas fixas</strong> são modelos mensais (aluguel, internet…). Gere o lançamento do mês com um clique. As
            demais aparecem na tabela como variáveis.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setOpenFixedModal(true)}
            className="w-full sm:w-auto border-2 border-primary/30 text-primary bg-primary/5 px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/10 text-sm"
          >
            <Pin className="w-5 h-5" />
            Nova conta fixa
          </button>
          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-primary/20 text-sm"
          >
            <Plus className="w-5 h-5" />
            Nova despesa
          </button>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Pin className="w-4 h-4 text-primary" />
            Contas fixas (modelos)
          </h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {fixedBills.length === 0 && (
            <p className="text-sm text-slate-400 py-6">Nenhuma conta fixa. Cadastre aluguel, internet, licenças…</p>
          )}
          {fixedBills.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="snap-start shrink-0 w-[260px] bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-xs font-black text-primary uppercase tracking-tighter mb-1">Dia {f.dueDay}</p>
              <p className="font-bold text-slate-900 leading-snug mb-2">{f.description}</p>
              <p className="text-lg font-black text-slate-900">{formatCurrency(f.amount)}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">{f.account ?? "—"}</p>
              {f.slug === "aluguel" && yearGrid[f.id] && (
                <div className="mt-3 flex flex-wrap gap-1 justify-center" title={`Pagamentos em ${calendarYear}`}>
                  {MONTHS_PT.map((m, idx) => (
                    <span
                      key={m}
                      className={cn(
                        "text-[8px] font-bold px-1 py-0.5 rounded",
                        yearGrid[f.id][idx] ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400",
                      )}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
              <label className="mt-3 block text-[9px] font-bold text-slate-500 uppercase">Gerar lançamento</label>
              <input
                type="month"
                value={genMonth}
                onChange={(e) => setGenMonth(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => genMut.mutate({ id: f.id, month: genMonth })}
                disabled={genMut.isPending}
                className="mt-2 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary transition-colors disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                Gerar mês
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm border-l-4 border-l-rose-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-rose-50 rounded-xl shadow-sm">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">Atrasadas / vencidas</h3>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(summary.overdueTotal)}</p>
          <p className="text-[10px] font-bold text-rose-600 mt-2 uppercase tracking-tighter shrink-0">
            {summary.overdueCount} conta(s) • {summary.criticalOverdue} crítica(s)
          </p>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-50 rounded-xl shadow-sm">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">Próximos 7 dias</h3>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(summary.next7Total)}</p>
          <p className="text-[10px] font-bold text-amber-600 mt-2 uppercase tracking-tighter shrink-0">{summary.next7Count} conta(s)</p>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">Pagos no mês</h3>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(summary.paidMonthTotal)}</p>
          <p className="text-[10px] font-bold text-emerald-600 mt-2 uppercase tracking-tighter shrink-0">{summary.paidMonthCount} liquidação(ões)</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full sm:w-48 placeholder:text-slate-400 focus:ring-0"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              {EXPENSE_TAG_FILTERS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setExpenseTag(t.id)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight border transition-colors",
                    expenseTag === t.id ? "border-primary bg-primary/10 text-primary" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex overflow-x-auto gap-1 bg-slate-100 p-1 rounded-xl scrollbar-hide">
            {(
              [
                { id: "all" as const, label: "Todas" },
                { id: "variable" as const, label: "Só variáveis" },
                { id: "pending" as const, label: "Pendentes" },
                { id: "overdue" as const, label: "Vencidos" },
                { id: "paid" as const, label: "Pagos" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest whitespace-nowrap",
                  tab === t.id ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/20">
                <th className="px-6 md:px-8 py-5">Descrição</th>
                <th className="px-6 md:px-8 py-5">Tipo / tag</th>
                <th className="px-6 md:px-8 py-5">Categoria</th>
                <th className="px-6 md:px-8 py-5">Vencimento</th>
                <th className="px-6 md:px-8 py-5">Prioridade</th>
                <th className="px-6 md:px-8 py-5">Valor</th>
                <th className="px-6 md:px-8 py-5">Status</th>
                <th className="px-6 md:px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="hover:bg-slate-50/50 transition-colors group cursor-default"
                >
                  <td className="px-6 md:px-8 py-5">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{item.displayDescription}</p>
                    {item.displayDescription !== item.description && (
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter mt-1">REF: {item.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-6 md:px-8 py-5">
                    <div className="flex flex-col gap-1">
                      {item.fixedBillId ? (
                        <span className="text-[9px] font-black uppercase bg-violet-100 text-violet-800 px-2 py-1 rounded-lg w-fit">Fixo</span>
                      ) : (
                        <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded-lg w-fit">Variável</span>
                      )}
                      {item.expenseTag !== "other" && (
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded w-fit">{item.expenseTagLabel}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 md:px-8 py-5 text-xs text-slate-500">
                    <span className="font-bold bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-tighter">{item.category}</span>
                  </td>
                  <td className="px-6 md:px-8 py-5">
                    <p className="text-sm font-bold text-slate-700">{item.dueDate}</p>
                  </td>
                  <td className="px-6 md:px-8 py-5">
                    <span
                      className={cn(
                        "text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg tracking-tighter whitespace-nowrap",
                        item.priority === "critical"
                          ? "bg-rose-100 text-rose-700"
                          : item.priority === "high"
                            ? "bg-amber-100 text-amber-700"
                            : item.priority === "medium"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {item.priority === "critical"
                        ? "Crítica"
                        : item.priority === "high"
                          ? "Alta"
                          : item.priority === "medium"
                            ? "Média"
                            : "Baixa"}
                    </span>
                  </td>
                  <td className="px-6 md:px-8 py-5">
                    <p className="text-sm font-black text-slate-900 tracking-tight">{formatCurrency(item.amount)}</p>
                  </td>
                  <td className="px-6 md:px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full ring-4 ring-opacity-20",
                          item.status === "paid"
                            ? "bg-emerald-500 ring-emerald-500"
                            : item.status === "overdue"
                              ? "bg-rose-500 ring-rose-500"
                              : "bg-amber-500 ring-amber-500",
                        )}
                      />
                      <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600">
                        {item.status === "paid" ? "Pago" : item.status === "overdue" ? "Vencido" : "Pendente"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 md:px-8 py-5 text-right">
                    <div className="flex justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.status !== "paid" && (
                        <button
                          type="button"
                          onClick={() => patchMut.mutate({ id: item.id, status: "paid" })}
                          className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100"
                          title="Marcar pago"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Excluir esta conta?")) deleteMut.mutate(item.id);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openModal && (
        <PayableModal
          onClose={() => setOpenModal(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["payables"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            setOpenModal(false);
          }}
        />
      )}

      {openFixedModal && (
        <FixedBillModal
          onClose={() => setOpenFixedModal(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["fixed-bills"] });
            queryClient.invalidateQueries({ queryKey: ["fixed-bills-year-grid"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            setOpenFixedModal(false);
          }}
        />
      )}
    </div>
  );
}

function PayableModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/categories?kind=outflow")
      .then((r) => r.json())
      .then((j) => setCategories(j.items ?? []))
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const date = String(fd.get("date") ?? "");
    const description = String(fd.get("description") ?? "");
    const category = String(fd.get("category") ?? "");
    const amount = parseFloat(String(fd.get("amount") ?? "0"));
    const account = String(fd.get("account") ?? "");
    const priority = String(fd.get("priority") ?? "medium");
    const status = String(fd.get("status") ?? "pending");

    if (!date || !description || !category || amount <= 0 || !account) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description,
          category,
          amount,
          type: "outflow",
          status,
          account,
          priority,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Erro ao salvar");
        return;
      }
      onSaved();
    } catch {
      setError("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-slate-100" onClick={(ev) => ev.stopPropagation()}>
        <h3 className="text-xl font-black text-slate-900 mb-2">Nova despesa variável</h3>
        <p className="text-xs text-slate-500 mb-6">Não é conta fixa recorrente — use para gastos pontuais.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Vencimento</label>
            <input name="date" type="date" required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
            <input name="description" required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
            <select name="category" required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
              <option value="">Selecione</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Valor (R$)</label>
            <input name="amount" type="number" step="0.01" min="0.01" required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Conta</label>
            <select name="account" required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
              <option value="">Selecione</option>
              {BANK_ACCOUNTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Prioridade</label>
            <select name="priority" className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
            <select name="status" className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm flex justify-center items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FixedBillModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/categories?kind=outflow")
      .then((r) => r.json())
      .then((j) => setCategories(j.items ?? []))
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const description = String(fd.get("description") ?? "");
    const category = String(fd.get("category") ?? "");
    const amount = parseFloat(String(fd.get("amount") ?? "0"));
    const account = String(fd.get("account") ?? "");
    const dueDay = parseInt(String(fd.get("dueDay") ?? "10"), 10);
    const priority = String(fd.get("priority") ?? "medium");

    if (!description || !category || amount <= 0 || !account || dueDay < 1 || dueDay > 31) {
      setError("Preencha todos os campos. Dia entre 1 e 31.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/fixed-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, category, amount, account, dueDay, priority }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Erro");
        return;
      }
      onSaved();
    } catch {
      setError("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-slate-100" onClick={(ev) => ev.stopPropagation()}>
        <h3 className="text-xl font-black text-slate-900 mb-2">Nova conta fixa</h3>
        <p className="text-xs text-slate-500 mb-6">Modelo mensal. No card, escolha o mês e use &quot;Gerar mês&quot;.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
            <input name="description" required placeholder="Ex: Aluguel" className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
            <select name="category" required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
              <option value="">Selecione</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Valor (R$)</label>
              <input name="amount" type="number" step="0.01" min="0.01" required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Dia vencimento</label>
              <input name="dueDay" type="number" min={1} max={31} defaultValue={10} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Conta</label>
            <select name="account" required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
              <option value="">Selecione</option>
              {BANK_ACCOUNTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Prioridade</label>
            <select name="priority" className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm flex justify-center items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar modelo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
