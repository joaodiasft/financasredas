"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TURMAS, BANK_ACCOUNTS } from "@/lib/orgConstants";
import { cn } from "@/lib/utils";

type StudentOpt = { id: string; name: string };
type CatOpt = { id: string; name: string };

export function InflowEntryModal({
  onClose,
  onSaved,
  defaultTurmas,
  defaultGroup,
  title,
}: {
  onClose: () => void;
  onSaved: () => void;
  /** Pré-seleciona até 2 turmas (nomes oficiais em TURMAS). */
  defaultTurmas?: string[];
  /** Vincula o lançamento ao grupo/turma (nome no cadastro de turmas). */
  defaultGroup?: string;
  title?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [categories, setCategories] = useState<CatOpt[]>([]);
  const [mode, setMode] = useState<"aluno" | "normal">("normal");
  const [pickedTurmas, setPickedTurmas] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/students").then((r) => r.json()),
      fetch("/api/categories?kind=inflow").then((r) => r.json()),
    ])
      .then(([s, c]) => {
        setStudents((s.items ?? []).filter((x: { active: boolean }) => x.active !== false));
        setCategories(c.items ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (defaultTurmas?.length) {
      const valid = (TURMAS as readonly string[]).filter((t) => defaultTurmas.includes(t));
      setPickedTurmas(valid.slice(0, 2));
    }
  }, [defaultTurmas]);

  function toggleTurma(t: string) {
    setPickedTurmas((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 2) return [prev[0], t];
      return [...prev, t];
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const date = String(fd.get("date") ?? "");
    let description = String(fd.get("description") ?? "").trim();
    const category = String(fd.get("category") ?? "");
    const amount = parseFloat(String(fd.get("amount") ?? "0"));
    const status = String(fd.get("status") ?? "pending");
    const account = String(fd.get("account") ?? "");
    const studentId = mode === "aluno" ? String(fd.get("studentId") ?? "") || null : null;

    let desc = description;
    if (mode === "aluno" && studentId && !desc) {
      const st = students.find((x) => x.id === studentId);
      if (st) desc = `Mensalidade — ${st.name}`;
    }

    if (!date || !desc || !category || amount <= 0 || !account) {
      setError("Preencha data, descrição (ou escolha o aluno), categoria, valor e conta.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description: desc,
          category,
          amount,
          type: "inflow",
          status,
          account,
          studentId: studentId || undefined,
          turmas: pickedTurmas.length ? pickedTurmas : undefined,
          group: defaultGroup ?? undefined,
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 border border-slate-100 my-8"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3 className="text-xl font-black text-slate-900 mb-2">{title ?? "Nova entrada"}</h3>
        <p className="text-xs text-slate-500 mb-6">
          {defaultTurmas?.length
            ? `Turma(s) já selecionada(s): ${defaultTurmas.slice(0, 2).join(" · ")}. Você pode ajustar abaixo.`
            : "Vincule a um aluno ou registre entrada normal. Até duas turmas."}
        </p>

        <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode("normal")}
            className={cn("flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all", mode === "normal" ? "bg-white shadow text-primary" : "text-slate-500")}
          >
            Entrada normal
          </button>
          <button
            type="button"
            onClick={() => setMode("aluno")}
            className={cn("flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all", mode === "aluno" ? "bg-white shadow text-primary" : "text-slate-500")}
          >
            Aluno matriculado
          </button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
            <input name="date" type="date" required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>

          {mode === "aluno" && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Aluno</label>
              <select name="studentId" className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium">
                <option value="">Selecione o aluno</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Cadastre alunos em &quot;Alunos&quot; no menu.</p>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
            <input
              name="description"
              placeholder={mode === "aluno" ? "Opcional se escolher aluno (usa nome automaticamente)" : "Ex: Venda de material"}
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
            <select name="category" required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium">
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
            <select name="account" required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium">
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
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Turmas (máx. 2)</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 rounded-xl border border-slate-100 bg-slate-50">
              {TURMAS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTurma(t)}
                  className={cn(
                    "text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all",
                    pickedTurmas.includes(t) ? "border-primary bg-primary/10 text-primary" : "border-slate-200 bg-white text-slate-600",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm flex justify-center items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar entrada"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
