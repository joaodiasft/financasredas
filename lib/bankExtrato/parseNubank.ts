import { classifyOutflowCategory } from "../classifyExpenseCategory";
import { detectSeparator, normalizeHeader, parseDelimitedLine } from "./csvLine";
import type { ParsedExtratoRow } from "./types";

const PT_MONTH_PREFIX: Record<string, number> = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11,
};

function normMonthToken(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .slice(0, 3);
}

function monthIndexFromPortuguese(token: string): number | null {
  const k = normMonthToken(token);
  for (const [pref, idx] of Object.entries(PT_MONTH_PREFIX)) {
    if (pref.startsWith(k) || k.startsWith(pref)) return idx;
  }
  return null;
}

function parseBrMoney(s: string): { value: number; negative: boolean } {
  const t = s.replace(/\s/g, "").replace(/^R\$/i, "");
  const neg = /^-/.test(t) || /^\(.*\)$/.test(t);
  const inner = t.replace(/^\(|\)$/g, "").replace(/^-/g, "");
  const n = parseFloat(inner.replace(/\./g, "").replace(",", "."));
  return { value: Math.abs(n), negative: neg };
}

function categoryInflow(desc: string): string {
  const u = desc.toUpperCase();
  if (/PIX|TED|DOC|TRANSFER|RECEB|DEPOSIT/i.test(u)) return "Mensalidade";
  return "Outras receitas";
}

function ymdFromParts(day: number, monthIdx: number, year: number): string {
  const d = new Date(year, monthIdx, day, 12, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

const SKIP_NU_LINE =
  /^(extrato|resumo|pagina|página|continua|saldo|total|subtotal|nu\s*pagamentos|nubank|agência|agencia|conta\s+nu)/i;

/**
 * CSV exportado pelo Nubank (várias variações de cabeçalho).
 */
export function parseNubankCsv(text: string): ParsedExtratoRow[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const sep = detectSeparator(lines[0]);
  if (!sep) return [];

  const headerCells = parseDelimitedLine(lines[0], sep).map(normalizeHeader);
  const idx = (pred: (h: string) => boolean) => headerCells.findIndex(pred);

  const dateIdx = idx((h) => h === "data" || h.includes("date") || h.includes("data_movimentacao") || h.includes("created_at"));
  const amountIdx = idx((h) => h.includes("valor") || h === "amount" || h === "value");
  const titleIdx = idx((h) => h.includes("titulo") || h.includes("title") || h.includes("descricao") || h.includes("description"));
  const catIdx = idx((h) => h.includes("categoria") || h === "category");

  if (dateIdx < 0 || amountIdx < 0 || titleIdx < 0) return [];

  const out: ParsedExtratoRow[] = [];

  for (let r = 1; r < lines.length; r++) {
    const cells = parseDelimitedLine(lines[r], sep);
    if (cells.length < Math.max(dateIdx, amountIdx, titleIdx) + 1) continue;

    const rawDate = (cells[dateIdx] ?? "").trim();
    const rawAmount = (cells[amountIdx] ?? "").trim();
    const title = (cells[titleIdx] ?? "").trim();
    const rawCat = catIdx >= 0 ? (cells[catIdx] ?? "").trim() : "";

    if (!title) continue;

    let date: string | null = null;
    const iso = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) date = `${iso[1]}-${iso[2]}-${iso[3]}`;
    const br = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (!date && br) date = `${br[3]}-${br[2]}-${br[1]}`;

    const { value, negative } = parseBrMoney(rawAmount);
    if (!date || !Number.isFinite(value) || value <= 0) continue;

    const type: "inflow" | "outflow" = negative ? "outflow" : "inflow";
    const description = rawCat ? `${title} (${rawCat})` : title;
    const category =
      type === "inflow"
        ? categoryInflow(description)
        : rawCat && rawCat.length < 40
          ? classifyOutflowCategory(description)
          : classifyOutflowCategory(description);

    out.push({
      date,
      description,
      category,
      amount: value,
      type,
      status: "paid",
      account: "Nubank",
      needsReconcile: type === "inflow",
    });
  }

  return out;
}

/**
 * Texto extraído do PDF do extrato Nubank (conta).
 */
export function parseNubankPdfText(raw: string): ParsedExtratoRow[] {
  const text = raw.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const out: ParsedExtratoRow[] = [];

  const singleLine = /^(\d{1,2})\s+([a-zA-ZÀ-ÿ.]+)\s+(\d{4})\s+(.+?)\s+(-?\s*R\$\s*[\d.,]+)\s*$/i;
  const singleLineSlash = /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?\s*R\$\s*[\d.,]+)\s*$/;

  for (const line of lines) {
    if (SKIP_NU_LINE.test(line) || /^\d+\s+de\s+\d+$/i.test(line)) continue;

    let m = line.match(singleLine);
    if (m) {
      const day = parseInt(m[1], 10);
      const monthIdx = monthIndexFromPortuguese(m[2]);
      const year = parseInt(m[3], 10);
      const desc = m[4].trim();
      const { value, negative } = parseBrMoney(m[5]);
      if (monthIdx === null || !Number.isFinite(value) || value <= 0 || !desc) continue;
      const type: "inflow" | "outflow" = negative ? "outflow" : "inflow";
      out.push({
        date: ymdFromParts(day, monthIdx, year),
        description: desc,
        category: type === "inflow" ? categoryInflow(desc) : classifyOutflowCategory(desc),
        amount: value,
        type,
        status: "paid",
        account: "Nubank",
        needsReconcile: type === "inflow",
      });
      continue;
    }

    m = line.match(singleLineSlash);
    if (m) {
      const [, d, rest, amt] = m;
      const p = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!p) continue;
      const date = `${p[3]}-${p[2]}-${p[1]}`;
      const desc = rest.trim();
      const { value, negative } = parseBrMoney(amt);
      if (!Number.isFinite(value) || value <= 0 || !desc) continue;
      const type: "inflow" | "outflow" = negative ? "outflow" : "inflow";
      out.push({
        date,
        description: desc,
        category: type === "inflow" ? categoryInflow(desc) : classifyOutflowCategory(desc),
        amount: value,
        type,
        status: "paid",
        account: "Nubank",
        needsReconcile: type === "inflow",
      });
    }
  }

  if (out.length > 0) return dedupeRows(out);

  return parseNubankPdfTextMultiline(lines);
}

function parseNubankPdfTextMultiline(lines: string[]): ParsedExtratoRow[] {
  const out: ParsedExtratoRow[] = [];
  const dateOnly = /^(\d{1,2})\s+([a-zA-ZÀ-ÿ.]+)\s+(\d{4})$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (SKIP_NU_LINE.test(line)) continue;

    let dm = line.match(/^(\d{1,2})\s+([a-zA-ZÀ-ÿ.]+)\s+(\d{4})\s+(.+)$/i);
    let day: number;
    let monthTok: string;
    let year: number;
    let descStart: string;

    if (dm) {
      day = parseInt(dm[1], 10);
      monthTok = dm[2];
      year = parseInt(dm[3], 10);
      descStart = dm[4].trim();
    } else {
      const only = line.match(dateOnly);
      if (!only) continue;
      day = parseInt(only[1], 10);
      monthTok = only[2];
      year = parseInt(only[3], 10);
      descStart = "";
    }

    const monthIdx = monthIndexFromPortuguese(monthTok);
    if (monthIdx === null) continue;

    const parts: string[] = [];
    if (descStart) parts.push(descStart);

    let j = i + 1;
    let amountStr = "";
    for (; j < Math.min(i + 20, lines.length); j++) {
      const L = lines[j];
      if (SKIP_NU_LINE.test(L)) continue;
      if (dateOnly.test(L) || /^(\d{1,2})\s+([a-zA-ZÀ-ÿ.]+)\s+(\d{4})\s+/i.test(L)) break;

      const am = L.match(/^(-?\s*R\$\s*[\d.,]+)\s*$/);
      if (am) {
        amountStr = am[1];
        break;
      }
      if (L.length > 1 && !/^\d+\s+de\s+\d+$/i.test(L)) parts.push(L);
    }

    if (!amountStr) continue;
    const desc = parts.join(" ").replace(/\s+/g, " ").trim();
    if (desc.length < 2) continue;

    const { value, negative } = parseBrMoney(amountStr);
    if (!Number.isFinite(value) || value <= 0) continue;

    const type: "inflow" | "outflow" = negative ? "outflow" : "inflow";
    out.push({
      date: ymdFromParts(day, monthIdx, year),
      description: desc,
      category: type === "inflow" ? categoryInflow(desc) : classifyOutflowCategory(desc),
      amount: value,
      type,
      status: "paid",
      account: "Nubank",
      needsReconcile: type === "inflow",
    });
    i = j;
  }

  return dedupeRows(out);
}

function dedupeRows(rows: ParsedExtratoRow[]): ParsedExtratoRow[] {
  const seen = new Set<string>();
  const out: ParsedExtratoRow[] = [];
  for (const r of rows) {
    const k = `${r.date}|${r.description}|${r.amount}|${r.type}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}
