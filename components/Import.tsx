"use client";

import React, { useState, useCallback } from "react";
import {
  Upload,
  Sparkles,
  CheckCircle2,
  Loader2,
  UserCheck,
  Zap,
  ArrowRight,
  FileStack,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateFinancialQueries } from "@/lib/invalidateFinancialQueries";
import { IMPORT_PANEL_HINT } from "@/lib/bankExtrato/importHelp";
import { ReconcileStudentModal } from "@/components/ReconcileStudentModal";

type ImportedRow = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: string;
  status: string;
  needsReconcile: boolean;
};

type ImportHistoryResponse = {
  files: Array<{
    id: string;
    fileName: string;
    fileHashShort: string;
    bankLabel: string | null;
    byteSize: number;
    rowParsed: number;
    rowInserted: number;
    skippedDuplicates: number;
    totalInflow: number;
    totalOutflow: number;
    net: number;
    createdAt: string;
  }>;
  verification: {
    database: {
      totalInflow: number;
      totalOutflow: number;
      net: number;
      transactionCount: number;
      inflowLineCount: number;
      outflowLineCount: number;
    };
    sumFromRegisteredImports: {
      totalInflow: number;
      totalOutflow: number;
      net: number;
      fileCount: number;
    };
    totalsMatchImports: boolean | null;
    insertedRowsFromImportsSum: number;
    hintIfMismatch: string | null;
    note: string;
  };
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function Import() {
  const [isDragging, setIsDragging] = useState(false);
  const [lastImported, setLastImported] = useState<ImportedRow[] | null>(null);
  const [lastSource, setLastSource] = useState<string | null>(null);
  const [lastImportMeta, setLastImportMeta] = useState<{
    skippedFileAlreadyImported: boolean;
    skippedDuplicates: number;
    message?: string;
    totals?: { totalInflow: number; totalOutflow: number; net: number };
    fileName?: string;
  } | null>(null);
  const [reconcileCtx, setReconcileCtx] = useState<{ id: string; amount: number; description: string } | null>(null);
  const qc = useQueryClient();

  const historyQ = useQuery({
    queryKey: ["import-history"],
    queryFn: async () => {
      const res = await fetch("/api/import/history");
      if (!res.ok) throw new Error("Falha ao carregar histórico de extratos");
      return res.json() as Promise<ImportHistoryResponse>;
    },
  });

  const importMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Falha na importação");
      return j as {
        imported: number;
        items: ImportedRow[];
        source?: string;
        skippedFileAlreadyImported?: boolean;
        skippedDuplicates?: number;
        message?: string;
        totals?: { totalInflow: number; totalOutflow: number; net: number };
        fileName?: string;
      };
    },
    onSuccess: (data) => {
      setLastImported(data.items ?? []);
      setLastSource(data.source ?? null);
      setLastImportMeta({
        skippedFileAlreadyImported: data.skippedFileAlreadyImported === true,
        skippedDuplicates: data.skippedDuplicates ?? 0,
        message: data.message,
        totals: data.totals,
        fileName: data.fileName,
      });
      invalidateFinancialQueries(qc);
    },
    onError: (e: Error) => {
      alert(e.message);
    },
  });

  const onFile = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      importMut.mutate(f);
    },
    [importMut],
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Novo fluxo
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Importar & conciliar</h1>
          <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">{IMPORT_PANEL_HINT}</p>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            <p className="font-bold text-amber-900">Onde ficam os lançamentos?</p>
            <p className="mt-1 text-amber-900/90">
              Tudo vai para <strong>Entradas</strong> e <strong>Saídas</strong>. O comando <code className="text-xs bg-white/80 px-1 rounded">npm run db:seed</code>{" "}
              não apaga importações. Para <strong>zerar tudo</strong> e recomeçar:{" "}
              <code className="text-xs bg-white/80 px-1 rounded">npm run db:seed:reset</code> (apaga lançamentos e histórico de extratos).
            </p>
            <p className="mt-2 text-amber-900/90">
              Para vincular aluno sem voltar aqui: abra <strong>Entradas</strong> e use <strong>Conciliar aluno</strong> na linha do PIX.
            </p>
            <p className="mt-2 text-amber-900/90 text-[11px]">
              Vários PDFs na pasta Downloads: no projeto rode <code className="text-[10px] bg-white/80 px-1 rounded">npm run import:extracts</code>{" "}
              (deduplica com o que já está no banco).
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2 text-slate-900">
            <FileStack className="w-5 h-5 text-primary" />
            <span className="font-black text-sm uppercase tracking-wide">Extratos já cadastrados</span>
          </div>
          {historyQ.data?.verification.totalsMatchImports === true && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4" />
              Totais do banco = soma dos extratos
            </span>
          )}
          {historyQ.data?.verification.totalsMatchImports === false && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full">
              <AlertTriangle className="w-4 h-4" />
              Conferir totais abaixo
            </span>
          )}
        </div>

        {historyQ.isLoading && (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">Carregando histórico…</div>
        )}
        {historyQ.isError && (
          <div className="px-6 py-6 text-sm text-red-600">{(historyQ.error as Error).message}</div>
        )}

        {historyQ.data && (
          <div className="p-6 space-y-6">
            {historyQ.data.files.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum PDF ainda registrado. Importe um arquivo — o mesmo PDF não será aceito duas vezes (hash).</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                      <th className="px-4 py-3 font-bold">Arquivo</th>
                      <th className="px-4 py-3 font-bold">Banco / fonte</th>
                      <th className="px-4 py-3 font-bold">Linhas</th>
                      <th className="px-4 py-3 font-bold">Inseridas</th>
                      <th className="px-4 py-3 font-bold">Dup. ignoradas</th>
                      <th className="px-4 py-3 font-bold">Entradas</th>
                      <th className="px-4 py-3 font-bold">Saídas</th>
                      <th className="px-4 py-3 font-bold">Hash (início)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {historyQ.data.files.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-900 max-w-[220px] truncate" title={f.fileName}>
                          {f.fileName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{f.bankLabel ?? "—"}</td>
                        <td className="px-4 py-3 tabular-nums">{f.rowParsed}</td>
                        <td className="px-4 py-3 tabular-nums font-semibold">{f.rowInserted}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-600">{f.skippedDuplicates}</td>
                        <td className="px-4 py-3 tabular-nums text-emerald-700">{brl(f.totalInflow)}</td>
                        <td className="px-4 py-3 tabular-nums text-rose-700">{brl(f.totalOutflow)}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{f.fileHashShort}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Soma dos extratos (tabela acima)</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Entradas</span>
                    <span className="font-bold tabular-nums text-emerald-800">
                      {brl(historyQ.data.verification.sumFromRegisteredImports.totalInflow)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Saídas</span>
                    <span className="font-bold tabular-nums text-rose-800">
                      {brl(historyQ.data.verification.sumFromRegisteredImports.totalOutflow)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-800 font-bold">Líquido</span>
                    <span className="font-black tabular-nums text-slate-900">
                      {brl(historyQ.data.verification.sumFromRegisteredImports.net)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-2">
                    {historyQ.data.verification.sumFromRegisteredImports.fileCount} arquivo(s) · linhas inseridas (soma):{" "}
                    {historyQ.data.verification.insertedRowsFromImportsSum}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/70 mb-3">Totais reais no banco (todas as transações)</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Entradas ({historyQ.data.verification.database.inflowLineCount} linhas)</span>
                    <span className="font-bold tabular-nums text-emerald-800">
                      {brl(historyQ.data.verification.database.totalInflow)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Saídas ({historyQ.data.verification.database.outflowLineCount} linhas)</span>
                    <span className="font-bold tabular-nums text-rose-800">
                      {brl(historyQ.data.verification.database.totalOutflow)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200/80">
                    <span className="text-slate-900 font-bold">Líquido</span>
                    <span className="font-black tabular-nums text-slate-900">
                      {brl(historyQ.data.verification.database.net)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 pt-2">{historyQ.data.verification.database.transactionCount} lançamentos no total.</p>
                </div>
              </div>
            </div>

            {historyQ.data.verification.hintIfMismatch && (
              <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                {historyQ.data.verification.hintIfMismatch}
              </p>
            )}
            <p className="text-[11px] text-slate-500">{historyQ.data.verification.note}</p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <motion.div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              onFile(e.dataTransfer.files);
            }}
            className={cn(
              "relative overflow-hidden rounded-[28px] border-2 border-dashed p-10 md:p-14 transition-all duration-300",
              isDragging ? "border-primary bg-gradient-to-br from-primary/15 to-white scale-[1.01] shadow-2xl shadow-primary/20" : "border-slate-200 bg-white hover:border-primary/40",
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative flex flex-col items-center text-center">
              <div
                className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all",
                  importMut.isPending ? "bg-primary text-white" : isDragging ? "bg-primary text-white scale-110" : "bg-slate-100 text-slate-400",
                )}
              >
                {importMut.isPending ? <Loader2 className="w-10 h-10 animate-spin" /> : <Upload className="w-10 h-10" />}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Solte o CSV ou o PDF aqui</h3>
              <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">
                Um arquivo por vez. Categorias e datas são lidas do extrato; CSV manual:{" "}
                <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">data, descrição, categoria, valor</code>
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-primary transition-colors shadow-xl">
                <Upload className="w-5 h-5" />
                Escolher arquivo
                <input
                  type="file"
                  accept=".csv,text/csv,.pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files)}
                />
              </label>
            </div>
          </motion.div>

          <AnimatePresence>
            {lastImportMeta?.skippedFileAlreadyImported && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950"
              >
                <p className="font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  {lastImportMeta.message ?? "Arquivo já importado"}
                </p>
                {lastImportMeta.fileName && (
                  <p className="mt-1 text-xs text-amber-900/90">
                    Arquivo: <strong>{lastImportMeta.fileName}</strong>
                    {lastImportMeta.totals && (
                      <>
                        {" "}
                        · Totais no registro: entradas {brl(lastImportMeta.totals.totalInflow)}, saídas{" "}
                        {brl(lastImportMeta.totals.totalOutflow)}
                      </>
                    )}
                  </p>
                )}
              </motion.div>
            )}
            {lastImported && lastImported.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg"
              >
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-black text-sm uppercase tracking-wide">
                      {lastImported.length} lançamentos importados
                      {lastImportMeta && lastImportMeta.skippedDuplicates > 0
                        ? ` (${lastImportMeta.skippedDuplicates} duplicata(s) ignorada(s) no arquivo)`
                        : ""}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {lastSource ? `Fonte: ${lastSource} · ` : ""}
                    {lastImportMeta?.totals && (
                      <>
                        Totais deste arquivo: {brl(lastImportMeta.totals.totalInflow)} in ·{" "}
                        {brl(lastImportMeta.totals.totalOutflow)} out · líq. {brl(lastImportMeta.totals.net)} ·{" "}
                      </>
                    )}
                    Atualizado no painel, entradas/saídas e dashboard
                  </span>
                </div>
                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-50">
                  {lastImported.map((row) => (
                    <div key={row.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{row.description}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                          {row.date} • {row.category} • {row.type === "inflow" ? "Entrada" : "Saída"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {row.type === "inflow" && (
                          <button
                            type="button"
                            onClick={() => setReconcileCtx({ id: row.id, amount: row.amount, description: row.description })}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-slate-900 transition-colors"
                          >
                            <UserCheck className="w-4 h-4" />
                            Conciliar aluno
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/transactions/${row.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ needsReconcile: false }),
                            });
                            setLastImported((prev) => prev?.map((r) => (r.id === row.id ? { ...r, needsReconcile: false } : r)) ?? null);
                            invalidateFinancialQueries(qc);
                          }}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase px-2"
                        >
                          Ignorar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-3xl bg-slate-900 text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <Zap className="w-8 h-8 text-primary mb-4 relative" />
            <h3 className="text-lg font-bold relative mb-2">Dicas rápidas</h3>
            <ul className="text-sm text-slate-300 space-y-3 relative leading-relaxed">
              <li className="flex gap-2">
                <ArrowRight className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                CSV manual: coluna tipo <strong className="text-white">entrada</strong> ou <strong className="text-white">inflow</strong> para créditos.
              </li>
              <li className="flex gap-2">
                <ArrowRight className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                Entradas de extrato podem aparecer com <strong className="text-white">Conciliar aluno</strong>.
              </li>
              <li className="flex gap-2">
                <ArrowRight className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                O arquivo é processado no servidor e não fica salvo como anexo.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Exemplo de linha</h4>
            <pre className="text-[10px] leading-relaxed bg-slate-50 rounded-xl p-4 overflow-x-auto text-slate-600 font-mono">
              {`2026-04-03,Pix João Silva,Mensalidade,450,entrada,pendente,Nubank Martha`}
            </pre>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {reconcileCtx && (
          <ReconcileStudentModal
            transactionId={reconcileCtx.id}
            amount={reconcileCtx.amount}
            description={reconcileCtx.description}
            onClose={() => setReconcileCtx(null)}
            onDone={() => {
              const rid = reconcileCtx.id;
              setReconcileCtx(null);
              setLastImported((prev) => prev?.map((r) => (r.id === rid ? { ...r, needsReconcile: false } : r)) ?? null);
              invalidateFinancialQueries(qc);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
