/**
 * Converte texto do extrato Sicoob (exportado do PDF) em lançamentos para o sistema.
 */

import type { Prisma } from "@prisma/client";
import { classifyOutflowCategory } from "./classifyExpenseCategory";

const SKIP = /SALDO|RESUMO|^\(\+|^\(-|^=|^000 EXTRATOS|^SAC:|^OUVIDORIA|^ENCARGOS|^VENCIMENTO|^TAXA |^CUSTO |^SALDO BLOQ|^OUTRAS INFORMAÇÕES|^JUROS |^TARIFAS /i;

/** Rótulo da conta no extrato (linha CONTA:). */
export function extractSicoobAccountLabel(raw: string): string {
  const m = raw.match(/CONTA:\s*([^\n\r]+)/i);
  if (m) return `Sicoob — ${m[1].trim()}`;
  return "Sicoob";
}

/** Ano do extrato a partir do cabeçalho Sicoob (ex.: PERÍODO: 01/02/2026 - 28/02/2026). */
export function inferYearFromSicoobExtrato(raw: string): number {
  const period = raw.match(/PER[IÍ]ODO:\s*\d{2}\/\d{2}\/(\d{4})/i);
  if (period) return parseInt(period[1], 10);
  const any = raw.match(/\d{2}\/\d{2}\/(\d{4})/);
  if (any) return parseInt(any[1], 10);
  return new Date().getFullYear();
}

function parseBrAmount(s: string): number {
  return parseFloat(s.replace(/\./g, "").replace(",", "."));
}

function categoryForInflow(historico: string): string {
  const h = historico.toUpperCase();
  if (h.includes("PIX RECEB") || h.includes("CRED.TR") || h.includes("CRÉ D") || h.includes("DEVOLUÇÃO PIX")) {
    return "Mensalidade";
  }
  return "Outras receitas";
}

function enrichDescription(historico: string, lines: string[]): string {
  const parts = [historico.trim()];
  for (const n of lines) {
    if (parts.length >= 3) break;
    if (/^Pagamento Pix$/i.test(n) || /^Recebimento Pix$/i.test(n)) continue;
    if (/^DOC\.:/i.test(n)) continue;
    if (/^\*\*\*/.test(n)) continue;
    if (/^\d{2}\.\d{3}\.\d{3}/.test(n)) continue;
    if (/^[0-9.*\s-]+$/.test(n) && n.length < 28) continue;
    if (/^-- \d+ of \d+ --$/.test(n)) continue;
    if (!/[a-zA-ZÀ-ÿ]/.test(n)) continue;
    parts.push(n.trim());
  }
  return parts.join(" — ");
}

export function parseSicoobExtratoText(raw: string): Prisma.TransactionCreateManyInput[] {
  const year = inferYearFromSicoobExtrato(raw);
  const accountLabel = extractSicoobAccountLabel(raw);
  const lines = raw.split(/\r?\n/).map((l) => l.trimEnd());
  const out: Prisma.TransactionCreateManyInput[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m = line.match(/^(\d{2})\/(\d{2})\s+(.+?)\s+([\d.]+,\d{2})([CD])$/);
    if (!m) continue;

    const [, dStr, moStr, historicoRaw, valStr, dir] = m;
    const historico = historicoRaw.trim();
    if (SKIP.test(historico)) continue;

    const detail: string[] = [];
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      const n = lines[j].trim();
      if (/^\d{2}\/\d{2}\s/.test(n)) break;
      if (n.startsWith("--")) break;
      if (!n) continue;
      detail.push(n);
    }

    const description = enrichDescription(historico, detail);
    const amount = parseBrAmount(valStr);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const type = dir === "C" ? "inflow" : "outflow";
    const category =
      type === "inflow" ? categoryForInflow(historico) : classifyOutflowCategory(description);
    const day = parseInt(dStr, 10);
    const month = parseInt(moStr, 10) - 1;
    const date = new Date(year, month, day, 12, 0, 0, 0);

    out.push({
      date,
      description,
      category,
      amount,
      type,
      status: "paid",
      account: accountLabel,
      group: null,
      priority: type === "outflow" ? "medium" : null,
      studentId: null,
      turmas: null,
      needsReconcile: false,
      fixedBillId: null,
    });
  }

  return out;
}
