"use client";

import React, { useState } from "react";
import {
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Loader2,
  Trash2,
  ArrowLeft,
  Wallet,
  ExternalLink,
  GraduationCap,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InflowEntryModal } from "@/components/InflowEntryModal";
import { TURMAS } from "@/lib/orgConstants";
import { canonicalTurmaName } from "@/lib/turmaCanonical";
import { invalidateFinancialQueries } from "@/lib/invalidateFinancialQueries";

type TurmaItem = {
  id: string;
  name: string;
  students: number;
  balance: number;
  performance: number;
  status: "profitable" | "loss" | "neutral";
};

type DetailPayload = {
  group: { id: string; name: string };
  students: {
    id: string;
    name: string;
    turma1: string | null;
    turma2: string | null;
    email: string | null;
    phone: string | null;
    scholarship: boolean;
    paysOutside: boolean;
  }[];
  studentSummary?: {
    total: number;
    withScholarship: number;
    paysOutsideCount: number;
    otherCount: number;
  };
  stats: {
    paidTotal: number;
    pendingTotal: number;
    paidCount: number;
    pendingCount: number;
    listedCount: number;
  };
  transactions: {
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    status: string;
    studentName: string | null;
  }[];
};

export function Turmas() {
  const [openModal, setOpenModal] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [inflowTurma, setInflowTurma] = useState<{ name: string } | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error();
      return res.json() as Promise<{ items: TurmaItem[]; chart: { name: string; A: number; B: number }[] }>;
    },
  });

  const turmas = data?.items ?? [];
  const performanceData = data?.chart ?? [];

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  const best = turmas.length
    ? turmas.reduce((acc, t) => (t.performance > acc.performance ? t : acc), turmas[0])
    : { name: "—", performance: 0 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh] gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="font-medium">Carregando turmas...</span>
      </div>
    );
  }

  if (isError) {
    return <p className="text-center text-rose-600 py-20 font-medium">Erro ao carregar turmas.</p>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase mb-1">Gestão de Grupos</h2>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-none">Turmas & Performance</h1>
          <p className="text-sm text-slate-500 mt-2">Clique em uma turma para ver alunos, entradas e lançar receita vinculada.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-primary/20 text-sm"
        >
          <Plus className="w-5 h-5" />
          Nova Turma
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Comparativo de receita</h3>
              <p className="text-sm text-slate-400 font-medium">Duas turmas com maior saldo (Jan–Jun)</p>
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} dy={10} />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="A" fill="#FF69B4" radius={[6, 6, 0, 0]} barSize={32} name="Turma 1" />
                <Bar dataKey="B" fill="#E2E8F0" radius={[6, 6, 0, 0]} barSize={32} name="Turma 2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-primary p-8 rounded-3xl text-white shadow-xl shadow-primary/20 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1 tracking-tight">Insight de crescimento</h3>
            <p className="text-sm text-pink-200 font-medium mb-8">Comparativo mês atual vs anterior</p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-pink-100 uppercase tracking-widest">Melhor performance</p>
                  <p className="text-lg font-black">
                    {best?.name?.slice(0, 32) ?? "—"} ({best && best.performance > 0 ? "+" : ""}
                    {best?.performance?.toFixed(1) ?? 0}%)
                  </p>
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p className="text-xs text-pink-50 leading-relaxed font-medium">
                  Entradas aparecem aqui quando o lançamento usa esta turma (tags ou vínculo no grupo).
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("fin:navigate-tab", { detail: { tab: "reports" } }))
            }
            className="w-full mt-8 py-3 bg-white text-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            Relatórios detalhados
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {turmas.map((turma, i) => (
          <motion.div
            key={turma.id}
            role="button"
            tabIndex={0}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setDetailId(turma.id)}
            onKeyDown={(e) => e.key === "Enter" && setDetailId(turma.id)}
            className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all group flex flex-col justify-between min-h-[14rem] cursor-pointer text-left"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <Users className="w-6 h-6" />
                </div>
                <button
                  type="button"
                  title="Excluir turma"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Excluir esta turma? Lançamentos antigos mantêm o nome gravado.")) deleteMut.mutate(turma.id);
                  }}
                  className="p-2 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-slate-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <h4 className="font-extrabold text-slate-900 mb-1 group-hover:text-primary transition-colors line-clamp-2">{turma.name}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{turma.students} alunos matriculados</p>
            </div>

            <div className="flex justify-between items-end mt-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Saldo (entradas pagas)</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(turma.balance)}</p>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-tighter",
                  turma.status === "profitable"
                    ? "bg-emerald-100 text-emerald-700"
                    : turma.status === "loss"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-600",
                )}
              >
                {turma.performance > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(turma.performance).toFixed(1)}%
              </div>
            </div>
            <p className="text-[10px] font-bold text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Abrir detalhes →
            </p>
          </motion.div>
        ))}
      </div>

      {openModal && (
        <TurmaModal
          onClose={() => setOpenModal(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["groups"] });
            setOpenModal(false);
          }}
        />
      )}

      {detailId && (
        <TurmaDetailSheet
          groupId={detailId}
          onClose={() => setDetailId(null)}
          onNovaEntrada={(name) => {
            setDetailId(null);
            setInflowTurma({ name });
          }}
          onVerEntradas={(name) => {
            setDetailId(null);
            window.dispatchEvent(
              new CustomEvent("fin:navigate-tab", { detail: { tab: "inflows", inflowGroup: name } }),
            );
          }}
        />
      )}

      {inflowTurma && (
        <InflowEntryModal
          title={`Nova entrada — ${inflowTurma.name}`}
          defaultGroup={canonicalTurmaName(inflowTurma.name) ?? inflowTurma.name}
          defaultTurmas={
            (() => {
              const n = canonicalTurmaName(inflowTurma.name) ?? inflowTurma.name;
              return (TURMAS as readonly string[]).includes(n) ? [n] : [];
            })()
          }
          onClose={() => setInflowTurma(null)}
          onSaved={() => {
            invalidateFinancialQueries(queryClient);
            setInflowTurma(null);
          }}
        />
      )}
    </div>
  );
}

function TurmaDetailSheet({
  groupId,
  onClose,
  onNovaEntrada,
  onVerEntradas,
}: {
  groupId: string;
  onClose: () => void;
  onNovaEntrada: (name: string) => void;
  onVerEntradas: (name: string) => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["group-detail", groupId],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupId}/detail`);
      if (!res.ok) throw new Error();
      return (await res.json()) as DetailPayload;
    },
  });

  return (
    <div className="fixed inset-0 z-[95] flex items-stretch justify-end bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28 }}
        className="w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="flex items-center justify-center h-64 gap-2 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        {isError && <p className="p-8 text-rose-600 font-medium">Não foi possível carregar a turma.</p>}
        {data && (
          <div className="p-6 md:p-8 space-y-8">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="Fechar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Turma</p>
                <h2 className="text-2xl font-black text-slate-900 leading-tight break-words">{data.group.name}</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Recebido (pago)</p>
                <p className="text-lg font-black text-emerald-800">{formatCurrency(data.stats.paidTotal)}</p>
                <p className="text-[10px] text-emerald-600 mt-1">{data.stats.paidCount} lanç.</p>
              </div>
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                <p className="text-[10px] font-bold text-amber-800 uppercase">Pendente</p>
                <p className="text-lg font-black text-amber-900">{formatCurrency(data.stats.pendingTotal)}</p>
                <p className="text-[10px] text-amber-700 mt-1">{data.stats.pendingCount} lanç.</p>
              </div>
            </div>

            {data.studentSummary && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Alunos matriculados nesta turma</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl bg-white border border-slate-100 p-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total</p>
                    <p className="text-xl font-black text-slate-900">{data.studentSummary.total}</p>
                  </div>
                  <div className="rounded-xl bg-violet-50 border border-violet-100 p-3">
                    <p className="text-[9px] font-bold text-violet-700 uppercase">Bolsa</p>
                    <p className="text-xl font-black text-violet-900">{data.studentSummary.withScholarship}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50/80 border border-amber-100 p-3">
                    <p className="text-[9px] font-bold text-amber-800 uppercase">Paga fora</p>
                    <p className="text-xl font-black text-amber-950">{data.studentSummary.paysOutsideCount}</p>
                  </div>
                  <div className="rounded-xl bg-slate-100 border border-slate-200 p-3">
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Regular</p>
                    <p className="text-xl font-black text-slate-800">{data.studentSummary.otherCount}</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <strong className="text-slate-700">Regular</strong> = sem bolsa e sem pagamento por fora. Ajuste em{" "}
                  <strong>Alunos</strong> (marca Bolsa ou Pagamento por fora).
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => onNovaEntrada(data.group.name)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-slate-900 transition-colors"
              >
                <Wallet className="w-5 h-5" />
                Nova entrada nesta turma
              </button>
              <button
                type="button"
                onClick={() => onVerEntradas(data.group.name)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-slate-200 font-bold text-sm text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="w-4 h-4" />
                Ver em Entradas
              </button>
            </div>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-slate-400" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Alunos nesta turma</h3>
              </div>
              {data.students.length === 0 ? (
                <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4">Nenhum aluno com turma1/turma2 igual a este nome.</p>
              ) : (
                <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {data.students.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-slate-50 rounded-xl px-4 py-3 border border-slate-100/80"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block truncate">{s.name}</span>
                        <span className="text-[10px] text-slate-500">
                          Turmas: {[s.turma1, s.turma2].filter(Boolean).join(" · ") || "—"}
                        </span>
                        {(s.email || s.phone) && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {[s.email, s.phone].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 shrink-0 justify-end">
                        {s.scholarship && (
                          <span className="text-[9px] font-black uppercase text-violet-800 bg-violet-100 px-2 py-1 rounded-md">Bolsa</span>
                        )}
                        {s.paysOutside && (
                          <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-1 rounded-md">Por fora</span>
                        )}
                        {!s.scholarship && !s.paysOutside && (
                          <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">Regular</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-3">Últimas entradas vinculadas</h3>
              <p className="text-xs text-slate-500 mb-3">Até 60 lançamentos com esta turma no grupo ou nas tags.</p>
              {data.transactions.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma entrada ainda. Use &quot;Nova entrada nesta turma&quot;.</p>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto">
                  {data.transactions.map((t) => (
                    <li key={t.id} className="text-sm border border-slate-100 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                      <div className="flex justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400">{t.date.slice(0, 10)}</span>
                        <span className="font-black text-emerald-700">{formatCurrency(t.amount)}</span>
                      </div>
                      <p className="font-semibold text-slate-800 line-clamp-2">{t.description}</p>
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <span className="text-slate-500">{t.category}</span>
                        {t.studentName && <span className="text-primary font-bold">Aluno: {t.studentName}</span>}
                        <span
                          className={cn(
                            "font-bold uppercase",
                            t.status === "paid" ? "text-emerald-600" : "text-amber-600",
                          )}
                        >
                          {t.status === "paid" ? "Pago" : "Pendente"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function TurmaModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const students = parseInt(String(fd.get("students") ?? "0"), 10);
    if (!name) {
      setError("Informe o nome da turma.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, studentCount: Number.isFinite(students) ? students : 0 }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Erro ao criar");
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
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100" onClick={(ev) => ev.stopPropagation()}>
        <h3 className="text-xl font-black text-slate-900 mb-6">Nova turma</h3>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
            <input name="name" required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Alunos (inicial)</label>
            <input name="students" type="number" min={0} defaultValue={0} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm flex justify-center items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
