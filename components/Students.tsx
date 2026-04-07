"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Pencil, Loader2, Trash2, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { TURMAS } from "@/lib/orgConstants";
import { cn } from "@/lib/utils";

type Student = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  turma1: string | null;
  turma2: string | null;
  active: boolean;
  notes: string | null;
  pixMatchNames: string | null;
  paysOutside: boolean;
  outsideNote: string | null;
  scholarship: boolean;
};

export function Students() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error();
      const j = await res.json();
      return j.items as Student[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });

  const items = data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[40vh] gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        Carregando alunos...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase mb-1">Cadastro</h2>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Alunos</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl">
            Cada aluno pode estar em até <strong>duas turmas</strong> ao mesmo tempo (Turma 1 e Turma 2). Use nas entradas financeiras vinculadas.
          </p>
          <p className="text-xs text-slate-500 mt-2 max-w-xl border-l-4 border-primary/30 pl-3">
            <strong className="text-slate-700">Importações</strong> ficam no banco até você apagar manualmente. O comando{" "}
            <code className="text-[10px] bg-slate-100 px-1 rounded">npm run db:seed:reset</code> é o único que zera extratos importados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-slate-900 transition-all text-sm"
        >
          <UserPlus className="w-5 h-5" />
          Novo aluno
        </button>
      </header>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/40">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Turma 1</th>
                <th className="px-6 py-4">Turma 2</th>
                <th className="px-6 py-4">Bolsa / pagamento</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">
                    {s.email && <div>{s.email}</div>}
                    {s.phone && <div>{s.phone}</div>}
                    {!s.email && !s.phone && "—"}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-700">{s.turma1 ?? "—"}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-700">{s.turma2 ?? "—"}</td>
                  <td className="px-6 py-4 text-xs text-slate-600 max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {s.scholarship && (
                        <span className="text-[10px] font-bold uppercase text-violet-800 bg-violet-100 px-2 py-1 rounded-lg inline-block">
                          Bolsa
                        </span>
                      )}
                      {s.paysOutside === true && (
                        <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-2 py-1 rounded-lg inline-block">
                          Por fora
                        </span>
                      )}
                      {!s.scholarship && !s.paysOutside && <span className="text-slate-400">—</span>}
                    </div>
                    {s.paysOutside === true && s.outsideNote && (
                      <p className="text-[9px] text-slate-500 mt-1 line-clamp-2" title={s.outsideNote}>
                        {s.outsideNote}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase px-2 py-1 rounded-lg",
                        s.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
                      )}
                    >
                      {s.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(s);
                        setOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-primary rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Remover aluno do cadastro?")) del.mutate(s.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <StudentFormModal
          initial={editing}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["students"] });
            qc.invalidateQueries({ queryKey: ["groups"] });
            setOpen(false);
            setEditing(null);
            window.dispatchEvent(new CustomEvent("fin:refresh"));
          }}
        />
      )}
    </div>
  );
}

export function StudentFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Student | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paysOutsideDraft, setPaysOutsideDraft] = useState(initial?.paysOutside ?? false);

  useEffect(() => {
    setPaysOutsideDraft(initial?.paysOutside ?? false);
  }, [initial?.id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim() || null;
    const phone = String(fd.get("phone") ?? "").trim() || null;
    const turma1 = String(fd.get("turma1") ?? "") || null;
    const turma2 = String(fd.get("turma2") ?? "") || null;
    const notes = String(fd.get("notes") ?? "").trim() || null;
    const pixMatchNames = String(fd.get("pixMatchNames") ?? "").trim() || null;
    const paysOutside = fd.get("paysOutside") === "on";
    const scholarship = fd.get("scholarship") === "on";
    const outsideNote = String(fd.get("outsideNote") ?? "").trim() || null;
    const active = fd.get("active") === "on";

    if (!name) {
      setError("Nome é obrigatório.");
      return;
    }
    if (turma1 && turma2 && turma1 === turma2) {
      setError("Turma 1 e Turma 2 devem ser diferentes.");
      return;
    }

    setLoading(true);
    try {
      const url = initial ? `/api/students/${initial.id}` : "/api/students";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          turma1,
          turma2,
          notes,
          pixMatchNames,
          paysOutside,
          scholarship,
          outsideNote: paysOutside ? outsideNote : null,
          active: initial ? active : true,
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[95] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-slate-100 max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
        <h3 className="text-xl font-black text-slate-900 mb-6">{initial ? "Editar aluno" : "Novo aluno"}</h3>
        <form className="space-y-4" onSubmit={onSubmit} key={initial?.id ?? "new"}>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Nome completo</label>
            <input name="name" required defaultValue={initial?.name} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
              <input name="email" type="email" defaultValue={initial?.email ?? ""} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
              <input name="phone" defaultValue={initial?.phone ?? ""} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Turma 1</label>
            <select name="turma1" defaultValue={initial?.turma1 ?? ""} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
              <option value="">—</option>
              {TURMAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Turma 2 (opcional)</label>
            <select name="turma2" defaultValue={initial?.turma2 ?? ""} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
              <option value="">—</option>
              {TURMAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Nomes no PIX (opcional)</label>
            <textarea
              name="pixMatchNames"
              rows={2}
              placeholder="Ex.: Kemilly Endy, K Endy Goncalves — separados por vírgula"
              defaultValue={initial?.pixMatchNames ?? ""}
              disabled={paysOutsideDraft}
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-400"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Ajuda a achar transferências quando o extrato não traz o nome completo. O nome cadastrado já entra na busca.
            </p>
          </div>
          <label className="flex items-start gap-2 text-sm font-medium text-slate-700 cursor-pointer rounded-xl border border-slate-200 p-3 bg-slate-50/50">
            <input
              type="checkbox"
              name="paysOutside"
              value="on"
              checked={paysOutsideDraft}
              onChange={(e) => setPaysOutsideDraft(e.target.checked)}
              className="rounded border-slate-300 mt-0.5"
            />
            <span>
              <span className="font-bold text-slate-800">Pagamento por fora</span>
              <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                Ex.: mensalidade na <strong>Nubank Martha</strong>. O cadastro serve para controle de matrícula/turma; o sistema não associa PIX nem soma receita desse aluno aqui.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm font-medium text-slate-700 cursor-pointer rounded-xl border border-violet-100 p-3 bg-violet-50/40">
            <input
              type="checkbox"
              name="scholarship"
              value="on"
              defaultChecked={initial?.scholarship ?? false}
              className="rounded border-violet-300 mt-0.5"
            />
            <span>
              <span className="font-bold text-violet-900">Bolsa</span>
              <span className="block text-[10px] font-normal text-violet-800/90 mt-0.5">
                Aluno com bolsa (isento ou sem cobrança de mensalidade neste controle). Aparece destacado no resumo da turma.
              </span>
            </span>
          </label>
          {paysOutsideDraft && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Conta / matrícula / turma (registro)</label>
              <textarea
                name="outsideNote"
                rows={3}
                placeholder="Ex.: Pago na conta Martha Nubank. Matrícula: Redação R2. Observações…"
                defaultValue={initial?.outsideNote ?? ""}
                className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Observações</label>
            <textarea name="notes" rows={2} defaultValue={initial?.notes ?? ""} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          {initial && (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" name="active" defaultChecked={initial.active} className="rounded border-slate-300" />
              Aluno ativo
            </label>
          )}
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
