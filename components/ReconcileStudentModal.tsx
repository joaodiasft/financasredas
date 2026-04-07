"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { cn, formatCurrency } from "@/lib/utils";
import { TURMAS } from "@/lib/orgConstants";

type StudentRow = { id: string; name: string; active: boolean; turma1: string | null; turma2: string | null };

type SuggestionRow = { id: string; name: string; turma1: string | null; turma2: string | null; score: number };

export function ReconcileStudentModal({
  transactionId,
  amount,
  description,
  initialStudentId,
  onClose,
  onDone,
}: {
  transactionId: string;
  amount: number;
  description: string;
  /** Se já houver aluno vinculado, pré-seleciona no formulário */
  initialStudentId?: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [studentId, setStudentId] = useState(initialStudentId ?? "");
  const [studentSearch, setStudentSearch] = useState("");
  const [turmas, setTurmas] = useState<string[]>([]);
  const [amtByTurma, setAmtByTurma] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  useEffect(() => {
    setStudentId(initialStudentId ?? "");
    setTurmas([]);
    setAmtByTurma({});
  }, [transactionId, initialStudentId]);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((j) => setStudents((j.items ?? []).filter((s: StudentRow) => s.active)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/transactions/${transactionId}/suggest-students`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setSuggestions((j.items ?? []) as SuggestionRow[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [transactionId]);

  const turmaA = turmas[0];
  const turmaB = turmas[1];
  useEffect(() => {
    if (turmas.length === 2 && turmaA && turmaB) {
      const half = (amount / 2).toFixed(2);
      const rest = (amount - parseFloat(half)).toFixed(2);
      setAmtByTurma({ [turmaA]: half, [turmaB]: rest });
    } else {
      setAmtByTurma({});
    }
  }, [turmas.length, turmaA, turmaB, amount]);

  function pickSuggestion(s: SuggestionRow) {
    setStudentId(s.id);
  }

  function toggleTurma(t: string) {
    setTurmas((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 2) return [prev[0], t];
      return [...prev, t];
    });
  }

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q));
  }, [students, studentSearch]);

  const splitSum = useMemo(() => {
    if (turmas.length !== 2) return amount;
    let s = 0;
    for (const t of turmas) {
      const v = parseFloat(String(amtByTurma[t] ?? "").replace(",", "."));
      if (!Number.isFinite(v)) return NaN;
      s += v;
    }
    return s;
  }, [turmas, amtByTurma, amount]);

  const splitOk = turmas.length !== 2 || Math.abs(splitSum - amount) <= 0.02;

  async function save() {
    if (!studentId) return;
    setSaveErr("");
    if (turmas.length === 2 && !splitOk) {
      setSaveErr(`A soma das turmas deve ser ${formatCurrency(amount)}.`);
      return;
    }
    setLoading(true);
    try {
      let turmaAmounts: Record<string, number> | null | undefined;
      if (turmas.length === 2) {
        turmaAmounts = {};
        for (const t of turmas) {
          const v = parseFloat(String(amtByTurma[t] ?? "").replace(",", "."));
          if (!Number.isFinite(v) || v <= 0) {
            setSaveErr("Preencha o valor de cada turma.");
            setLoading(false);
            return;
          }
          turmaAmounts[t] = v;
        }
      }
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          turmas: turmas.length ? turmas : undefined,
          ...(turmaAmounts ? { turmaAmounts } : {}),
          needsReconcile: false,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setSaveErr((j as { error?: string }).error ?? "Não foi possível salvar.");
        return;
      }
      onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900">Conciliar com aluno</h3>
            <p className="text-xs text-slate-500 mt-1">
              Escolha o aluno e as turmas manualmente. As sugestões abaixo são só referência — não aplicamos vínculo automático.
            </p>
          </div>
          <button type="button" title="Fechar" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Lançamento</p>
          <p className="text-sm font-bold text-slate-800 leading-snug">{description}</p>
          <p className="text-lg font-black text-emerald-700">{formatCurrency(amount)}</p>
        </div>

        <div className="space-y-4">
          {suggestions.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Sugestões (referência — clique para escolher)</label>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pickSuggestion(s)}
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors",
                      studentId === s.id ? "border-primary bg-primary/15 text-primary" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Buscar aluno</label>
            <input
              type="search"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Digite para filtrar…"
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
            />
            <select
              title="Aluno"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
            >
              <option value="">Selecione o aluno</option>
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Turmas (máx. 2)</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-50 border border-slate-100">
              {TURMAS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTurma(t)}
                  className={cn(
                    "text-[9px] font-bold px-2 py-1 rounded-md border",
                    turmas.includes(t) ? "border-primary bg-primary/10 text-primary" : "border-slate-200 bg-white text-slate-600",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {turmas.length === 2 && (
            <div className="rounded-xl border border-slate-200 p-3 space-y-2 bg-white">
              <p className="text-[10px] font-black text-slate-500 uppercase">Valor por turma</p>
              {turmas.map((t) => (
                <div key={t}>
                  <label className="text-[10px] font-bold text-slate-400">{t}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amtByTurma[t] ?? ""}
                    onChange={(e) => setAmtByTurma((prev) => ({ ...prev, [t]: e.target.value }))}
                    className="mt-0.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <p className={cn("text-[10px] font-bold", splitOk ? "text-slate-400" : "text-rose-600")}>
                Soma: {Number.isFinite(splitSum) ? formatCurrency(splitSum) : "—"} {splitOk ? "" : `(deve ser ${formatCurrency(amount)})`}
              </p>
            </div>
          )}

          {saveErr && <p className="text-sm text-rose-600">{saveErr}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600">
              Cancelar
            </button>
            <button
              type="button"
              disabled={loading || !studentId || (turmas.length === 2 && !splitOk)}
              onClick={save}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
