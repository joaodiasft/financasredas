import { classifyOutflowCategory } from "../classifyExpenseCategory";
import { detectSeparator, normalizeHeader, parseDelimitedLine } from "./csvLine";
import type { ParsedExtratoRow } from "./types";

function parseMpAmount(raw: string): number {
  const s = raw.replace(/\s/g, "").replace(/^[+-]/, "").replace(/^R\$\s*/i, "");
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.abs(n) : NaN;
}

function parseMpSignedAmount(raw: string): { amount: number; sign: 1 | -1 } {
  const trimmed = raw.trim();
  const neg = /^-/.test(trimmed) || /^\(.*\)$/.test(trimmed);
  const inner = trimmed.replace(/^\(|\)$/g, "").replace(/^-/g, "");
  const amount = parseMpAmount(inner);
  return { amount, sign: neg ? -1 : 1 };
}

function parseMpDate(raw: string): string | null {
  const t = raw.trim();
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = t.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function categoryInflow(desc: string): string {
  const u = desc.toUpperCase();
  if (/PIX|TED|TRANSFER|RECEB|COBRAN|VENDA|PAGAMENTO\s+APROVADO|SETTLEMENT/i.test(u)) return "Mensalidade";
  return "Outras receitas";
}

/**
 * Relatório "Dinheiro em conta" / extrato CSV do Mercado Pago (PT/EN, vírgula ou ponto e vírgula).
 */
export function parseMercadoPagoCsv(text: string): ParsedExtratoRow[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const sep = detectSeparator(lines[0]);
  if (!sep) return [];

  const headerCells = parseDelimitedLine(lines[0], sep).map(normalizeHeader);
  const idx = (pred: (h: string) => boolean) => headerCells.findIndex(pred);

  const dateIdx = idx(
    (h) =>
      h.includes("settlement_date") ||
      h.includes("transaction_date") ||
      h.includes("transaction_creation_date") ||
      h.includes("date_created") ||
      h.includes("creation_date") ||
      h.includes("release_date") ||
      (h.includes("data") && !h.includes("metadata")) ||
      h === "fecha" ||
      h.includes("data_da_transacao"),
  );

  let amountIdx = idx(
    (h) =>
      h.includes("settlement_net_amount") ||
      h.includes("valor_liquido") ||
      h === "net_credit_amount" ||
      h === "net_debit_amount",
  );

  const creditIdx = idx((h) => h.includes("net_credit") && h.includes("amount") && !h.includes("debit"));
  const debitIdx = idx((h) => h.includes("net_debit") && h.includes("amount"));

  if (amountIdx < 0 && (creditIdx < 0 || debitIdx < 0)) {
    amountIdx = idx((h) => h.includes("transaction_amount") || h.includes("valor") || h.includes("amount"));
  }

  const descIdx = idx(
    (h) =>
      h.includes("external_reference") ||
      h.includes("description") ||
      h.includes("descricao") ||
      h.includes("detail") ||
      h.includes("titulo") ||
      h.includes("motivo"),
  );

  const typeIdx = idx((h) => h.includes("transaction_type") || h.includes("tipo_de_transaccion") || h.includes("record_type"));

  if (dateIdx < 0) return [];
  if (amountIdx < 0 && (creditIdx < 0 || debitIdx < 0)) return [];

  const out: ParsedExtratoRow[] = [];

  for (let r = 1; r < lines.length; r++) {
    const cells = parseDelimitedLine(lines[r], sep);
    if (cells.length < headerCells.length * 0.5) continue;

    const dateStr = cells[dateIdx]?.trim() ?? "";
    const date = parseMpDate(dateStr);
    if (!date) continue;

    let type: "inflow" | "outflow" = "outflow";
    let amount = NaN;

    if (amountIdx >= 0 && cells[amountIdx] !== undefined) {
      const { amount: a, sign } = parseMpSignedAmount(cells[amountIdx]);
      amount = a;
      type = sign >= 0 ? "inflow" : "outflow";
    } else {
      const c = creditIdx >= 0 ? parseMpAmount(cells[creditIdx] ?? "0") : 0;
      const d = debitIdx >= 0 ? parseMpAmount(cells[debitIdx] ?? "0") : 0;
      if (c > 0.001) {
        amount = c;
        type = "inflow";
      } else if (d > 0.001) {
        amount = d;
        type = "outflow";
      }
    }

    if (!Number.isFinite(amount) || amount <= 0) continue;

    const parts: string[] = [];
    if (descIdx >= 0 && cells[descIdx]) parts.push(cells[descIdx].trim());
    if (typeIdx >= 0 && cells[typeIdx]) parts.push(`[${cells[typeIdx].trim()}]`);
    let description = parts.filter(Boolean).join(" ").trim() || "Movimento Mercado Pago";
    if (description.length > 500) description = description.slice(0, 497) + "…";

    const category = type === "inflow" ? categoryInflow(description) : classifyOutflowCategory(description);

    out.push({
      date,
      description,
      category,
      amount,
      type,
      status: "paid",
      account: "Mercado Pago",
      needsReconcile: type === "inflow",
    });
  }

  return out;
}
