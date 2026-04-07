"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  Search,
  Download,
  Plus,
  Loader2,
  Trash2,
  CheckCircle,
  LayoutGrid,
  UserCheck,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InflowEntryModal } from "@/components/InflowEntryModal";
import { BANK_ACCOUNTS } from "@/lib/orgConstants";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { ReconcileStudentModal } from "@/components/ReconcileStudentModal";

interface TransactionsProps {
  type: "inflow" | "outflow";
}

type TxRow = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  status: string;
  account: string | null;
  studentId?: string | null;
  studentName: string | null;
  turmas: string[];
  turmaAmounts?: Record<string, number> | null;
  needsReconcile?: boolean;
  fixedBillId?: string | null;
};

export function Transactions({ type }: TransactionsProps) {
  const isInflow = type === "inflow";
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);
  const [categoryFilter, setCategoryFilter] = useState("");
  /** Filtro por nome da turma (entradas vinculadas à turma). */
  const [inflowGroupFilter, setInflowGroupFilter] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [reconcileCtx, setReconcileCtx] = useState<{
    id: string;
    amount: number;
    description: string;
    studentId: string | null;
  } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isInflow) return;
    const g = sessionStorage.getItem("fin:inflowGroupFilter");
    if (g) {
      setInflowGroupFilter(g);
      sessionStorage.removeItem("fin:inflowGroupFilter");
    }
  }, [isInflow]);

  useEffect(() => {
    const fn = () => {
      if (type === "inflow") setOpenModal(true);
    };
    window.addEventListener("fin:open-inflow", fn);
    return () => window.removeEventListener("fin:open-inflow", fn);
  }, [type]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["transactions", type, debouncedQ, isInflow ? "" : categoryFilter, isInflow ? inflowGroupFilter : ""],
    queryFn: async () => {
      const params = new URLSearchParams({ type });
      if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
      if (!isInflow && categoryFilter) params.set("category", categoryFilter);
      if (isInflow && inflowGroupFilter) params.set("group", inflowGroupFilter);
      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar");
      const json = await res.json();
      return json.items as TxRow[];
    },
    placeholderData: (prev) => prev,
  });

  const { data: outflowOverview } = useQuery({
    queryKey: ["outflow-summary"],
    queryFn: async () => {
      const res = await fetch("/api/transactions/outflow-summary");
      if (!res.ok) throw new Error();
      return (await res.json()) as {
        items: { category: string; total: number; count: number }[];
        grandTotal: number;
      };
    },
    enabled: !isInflow,
  });

  const rows = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const totalPaid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
    const days = new Set(rows.map((r) => r.date.slice(0, 10))).size || 1;
    const avg = totalPaid / days;
    const catCount = new Map<string, number>();
    for (const r of rows) {
      catCount.set(r.category, (catCount.get(r.category) ?? 0) + r.amount);
    }
    let topCat = "—";
    let topVal = 0;
    Array.from(catCount.entries()).forEach(([c, v]) => {
      if (v > topVal) {
        topVal = v;
        topCat = c;
      }
    });
    return { total: totalPaid, avg, topCat };
  }, [rows]);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["outflow-summary"] });
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
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["outflow-summary"] });
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const exportCsv = () => {
    const header = "data,descricao,categoria,valor,tipo,status,conta,aluno,turmas\n";
    const body = rows
      .map((r) =>
        [
          r.date.slice(0, 10),
          `"${r.description.replace(/"/g, '""')}"`,
          r.category,
          r.amount.toFixed(2),
          isInflow ? "entrada" : "saida",
          r.status,
          r.account ?? "",
          r.studentName ?? "",
          `"${(r.turmas ?? []).join(";")}"`,
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${isInflow ? "entradas" : "saidas"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["outflow-summary"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["payables"] });
    queryClient.invalidateQueries({ queryKey: ["groups"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });
    queryClient.invalidateQueries({ queryKey: ["students"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh] gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="font-medium">Carregando lançamentos...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-rose-600 font-medium py-20">
        Não foi possível carregar os dados. Verifique o banco e rode o seed.
      </p>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase mb-1">
            {isInflow ? "Gestão de Recebimentos" : "Gestão de Pagamentos"}
          </h2>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
            {isInflow ? "Entradas" : "Saídas"}
          </h1>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <button
            type="button"
            onClick={exportCsv}
            className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-600 px-4 md:px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-sm"
          >
            <Download className="w-5 h-5 text-slate-400" />
            Exportar
          </button>
          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className={cn(
              "flex-1 md:flex-none text-white px-4 md:px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-sm",
              isInflow ? "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700" : "bg-rose-600 shadow-rose-200 hover:bg-rose-700",
            )}
          >
            <Plus className="w-5 h-5" />
            Nova {isInflow ? "Entrada" : "Saída"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[
          {
            label: `Total ${isInflow ? "Recebido" : "Registrado"}`,
            value: stats.total,
            icon: isInflow ? ArrowUpCircle : ArrowDownCircle,
            color: isInflow ? "text-emerald-600" : "text-rose-600",
            bg: isInflow ? "bg-emerald-50" : "bg-rose-50",
            isText: false,
          },
          {
            label: "Média por dia (com lanç.)",
            value: stats.avg,
            icon: Filter,
            color: "text-primary",
            bg: "bg-primary/10",
            isText: false,
          },
          {
            label: "Maior categoria (volume)",
            value: stats.topCat,
            icon: Search,
            color: "text-slate-600",
            bg: "bg-slate-100",
            isText: true,
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {stat.isText ? stat.value : formatCurrency(stat.value as number)}
            </p>
          </div>
        ))}
      </div>

      {isInflow && inflowGroupFilter && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm text-slate-700">
            Mostrando apenas entradas da turma: <strong className="text-slate-900">{inflowGroupFilter}</strong>
          </p>
          <button
            type="button"
            onClick={() => setInflowGroupFilter("")}
            className="text-sm font-bold text-primary underline underline-offset-2"
          >
            Ver todas as entradas
          </button>
        </div>
      )}

      {!isInflow && outflowOverview && outflowOverview.items.length > 0 && (
        <section className="space-y-4" aria-label="Resumo por categoria">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Saídas por categoria</h3>
              <p className="text-sm text-slate-500">
                Total registrado: <span className="font-bold text-slate-800">{formatCurrency(outflowOverview.grandTotal)}</span>
                {" · "}clique em um bloco para filtrar a tabela
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {outflowOverview.items.map((it) => {
              const active = categoryFilter === it.category;
              const pct =
                outflowOverview.grandTotal > 0
                  ? Math.round((it.total / outflowOverview.grandTotal) * 1000) / 10
                  : 0;
              return (
                <button
                  key={it.category}
                  type="button"
                  onClick={() => setCategoryFilter(active ? "" : it.category)}
                  className={cn(
                    "text-left rounded-2xl border p-4 transition-all shadow-sm",
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:shadow",
                  )}
                >
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-snug min-h-[2rem] line-clamp-2">
                    {it.category}
                  </p>
                  <p className="text-base font-black text-rose-700 mt-2 tabular-nums">{formatCurrency(it.total)}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {it.count} lanç. · {pct}%
                  </p>
                </button>
              );
            })}
          </div>
          {categoryFilter ? (
            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
              <span>
                Tabela: <strong className="text-slate-900">{categoryFilter}</strong>
              </span>
              <button
                type="button"
                className="text-primary font-bold underline underline-offset-2"
                onClick={() => setCategoryFilter("")}
              >
                Mostrar todas as categorias
              </button>
            </p>
          ) : null}
        </section>
      )}

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm grow">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Filtrar descrição ou categoria..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full min-w-0 placeholder:text-slate-400"
              />
            </div>
            {!isInflow && (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0">
                <span className="sr-only">Categoria</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 min-w-[200px]"
                >
                  <option value="">Todas (lista)</option>
                  {(outflowOverview?.items ?? []).map((it) => (
                    <option key={it.category} value={it.category}>
                      {it.category} ({it.count})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[1040px]">
            <thead>
              <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/20">
                <th className="px-6 md:px-8 py-5">Data</th>
                <th className="px-6 md:px-8 py-5">Descrição</th>
                {isInflow && <th className="px-6 md:px-8 py-5">Aluno</th>}
                {isInflow && <th className="px-6 md:px-8 py-5">Turmas</th>}
                {isInflow && (
                  <th className="px-4 md:px-5 py-5 whitespace-nowrap text-center" title="Vincular PIX ao cadastro">
                    Conciliar
                  </th>
                )}
                <th className="px-6 md:px-8 py-5">Categoria</th>
                <th className="px-6 md:px-8 py-5">Conta</th>
                <th className="px-6 md:px-8 py-5">Valor</th>
                <th className="px-6 md:px-8 py-5">Status</th>
                <th className="px-6 md:px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="hover:bg-slate-50/50 transition-colors group cursor-default"
                >
                  <td className="px-6 md:px-8 py-5">
                    <p className="text-xs font-bold text-slate-500">{item.date.slice(0, 10)}</p>
                  </td>
                  <td className="px-6 md:px-8 py-5">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{item.description}</p>
                    {item.needsReconcile && (
                      <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded mt-1 inline-block">
                        Conciliar
                      </span>
                    )}
                    {item.fixedBillId && (
                      <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block ml-1">
                        Fixo
                      </span>
                    )}
                  </td>
                  {isInflow && (
                    <td className="px-6 md:px-8 py-5 text-xs font-semibold text-slate-600">{item.studentName ?? "—"}</td>
                  )}
                  {isInflow && (
                    <td className="px-6 md:px-8 py-5">
                      <span className="text-[10px] text-slate-500">{(item.turmas ?? []).join(", ") || "—"}</span>
                      {item.turmaAmounts && Object.keys(item.turmaAmounts).length > 0 && (
                        <span className="block text-[9px] text-slate-400 mt-1">
                          {Object.entries(item.turmaAmounts)
                            .map(([k, v]) => `${k}: ${formatCurrency(v)}`)
                            .join(" · ")}
                        </span>
                      )}
                    </td>
                  )}
                  {isInflow && (
                    <td className="px-4 md:px-5 py-5 text-center">
                      <button
                        type="button"
                        title="Conciliar com aluno"
                        onClick={() =>
                          setReconcileCtx({
                            id: item.id,
                            amount: item.amount,
                            description: item.description,
                            studentId: item.studentId ?? null,
                          })
                        }
                        className={cn(
                          "inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-[10px] font-black uppercase tracking-tight transition-colors",
                          item.needsReconcile || !item.studentId
                            ? "bg-primary text-white hover:bg-slate-900 shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-primary/15 hover:text-primary border border-slate-200",
                        )}
                      >
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">Aluno</span>
                      </button>
                    </td>
                  )}
                  <td className="px-6 md:px-8 py-5">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-tight">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 md:px-8 py-5">
                    <p className="text-xs font-semibold text-slate-500">{item.account ?? "—"}</p>
                  </td>
                  <td className="px-6 md:px-8 py-5">
                    <p className={cn("text-sm font-black tracking-tight", isInflow ? "text-emerald-600" : "text-rose-600")}>
                      {isInflow ? "+" : "-"}
                      {formatCurrency(item.amount)}
                    </p>
                  </td>
                  <td className="px-6 md:px-8 py-5">
                    <span
                      className={cn(
                        "text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg tracking-tighter",
                        item.status === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "overdue"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {item.status === "paid" ? "Pago" : item.status === "overdue" ? "Vencido" : "Pendente"}
                    </span>
                  </td>
                  <td className="px-6 md:px-8 py-5 text-right">
                    <div className="flex justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.status !== "paid" && (
                        <button
                          type="button"
                          title="Marcar pago"
                          onClick={() => patchMut.mutate({ id: item.id, status: "paid" })}
                          className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Excluir"
                        onClick={() => {
                          if (confirm("Excluir este lançamento?")) deleteMut.mutate(item.id);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
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

      {openModal &&
        (isInflow ? (
          <InflowEntryModal
            onClose={() => setOpenModal(false)}
            onSaved={() => {
              invalidateAll();
              setOpenModal(false);
            }}
          />
        ) : (
          <OutflowEntryModal
            onClose={() => setOpenModal(false)}
            onSaved={() => {
              invalidateAll();
              setOpenModal(false);
            }}
          />
        ))}

      <AnimatePresence>
        {reconcileCtx && (
          <ReconcileStudentModal
            key={reconcileCtx.id}
            transactionId={reconcileCtx.id}
            amount={reconcileCtx.amount}
            description={reconcileCtx.description}
            initialStudentId={reconcileCtx.studentId}
            onClose={() => setReconcileCtx(null)}
            onDone={() => {
              setReconcileCtx(null);
              invalidateAll();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OutflowEntryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
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
    const status = String(fd.get("status") ?? "pending");
    const account = String(fd.get("account") ?? "");
    const priority = String(fd.get("priority") ?? "medium");

    if (!date || !description || !category || amount <= 0 || !account) {
      setError("Preencha todos os campos obrigatórios.");
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
        <h3 className="text-xl font-black text-slate-900 mb-6">Nova saída</h3>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
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
            <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
            <select name="status" className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencido</option>
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
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm flex justify-center items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
