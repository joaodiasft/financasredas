import { detectBankId, looksLikeMercadoPagoReportHeader, looksLikeNubankCsvHeader } from "./detectBank";
import { parseMercadoPagoCsv } from "./parseMercadoPago";
import { looksLikeMercadoPagoExtratoPdf, parseMercadoPagoExtratoPdfText } from "./parseMercadoPagoPdf";
import { parseNubankCsv, parseNubankPdfText } from "./parseNubank";
import { looksLikeNubankPjExtrato, parseNubankPjExtratoText } from "./parseNubankPjExtrato";
import { parseGenericImportCsv } from "./parseGenericCsv";
import { parseSicoobExtratoText } from "../parseSicoobExtrato";
import type { BankId, BankParseResult, ParsedExtratoRow } from "./types";

function mapSicoobToRows(prismaLike: ReturnType<typeof parseSicoobExtratoText>): ParsedExtratoRow[] {
  return prismaLike.map((r) => ({
    date: (r.date as Date).toISOString().slice(0, 10),
    description: String(r.description),
    category: String(r.category),
    amount: Number(r.amount),
    type: r.type as "inflow" | "outflow",
    status: ((r.status as "paid" | "pending") || "paid") as "paid" | "pending",
    account: r.account ? String(r.account) : "Sicoob",
    needsReconcile: r.type === "inflow",
  }));
}

/**
 * Orquestra parsers por banco (PDF texto ou CSV).
 */
export function parseBankStatement(text: string, fileName: string, _isPdf: boolean): BankParseResult {
  const hint = detectBankId(fileName, text);
  const firstLine = text.split(/\r?\n/)[0]?.trim() ?? "";

  const tryMp = (): ParsedExtratoRow[] => {
    try {
      return parseMercadoPagoCsv(text);
    } catch {
      return [];
    }
  };

  const tryNuCsv = (): ParsedExtratoRow[] => {
    try {
      return parseNubankCsv(text);
    } catch {
      return [];
    }
  };

  // --- CSV tabular (prioridade quando cabeçalho bate) ---
  if (looksLikeMercadoPagoReportHeader(firstLine)) {
    const mp = tryMp();
    if (mp.length) return { bank: "mercadopago", rows: mp };
  }

  if (looksLikeNubankCsvHeader(firstLine) || hint === "nubank") {
    const nu = tryNuCsv();
    if (nu.length) return { bank: "nubank", rows: nu };
  }

  if (hint === "mercadopago") {
    const mp = tryMp();
    if (mp.length) return { bank: "mercadopago", rows: mp };
  }

  // --- PDF Mercado Pago (extrato de conta, não o CSV de API) ---
  if (looksLikeMercadoPagoExtratoPdf(text)) {
    const mpPdf = parseMercadoPagoExtratoPdfText(text);
    if (mpPdf.length) return { bank: "mercadopago", rows: mpPdf };
  }

  // --- PDF Nubank PJ (conta empresa, layout narrativo) ---
  if (looksLikeNubankPjExtrato(text, fileName)) {
    const nuPj = parseNubankPjExtratoText(text);
    if (nuPj.length) return { bank: "nubank", rows: nuPj };
  }

  // --- Texto livre / PDF: Sicoob tem assinatura forte ---
  const sicoobRows = parseSicoobExtratoText(text);
  if (sicoobRows.length > 0) {
    return { bank: "sicoob", rows: mapSicoobToRows(sicoobRows) };
  }

  // --- Nubank PDF (ou texto colado) ---
  if (hint === "nubank" || /nu\s*pagamentos|www\.nubank\.com/i.test(text.slice(0, 8000))) {
    const nu = parseNubankPdfText(text);
    if (nu.length) return { bank: "nubank", rows: nu };
  }

  const nuFallback = parseNubankPdfText(text);
  if (nuFallback.length) return { bank: "nubank", rows: nuFallback };

  // --- Mercado Pago CSV sem cabeçalho “óbvio” no 1º teste ---
  const mpFallback = tryMp();
  if (mpFallback.length) return { bank: "mercadopago", rows: mpFallback };

  const nuCsvFallback = tryNuCsv();
  if (nuCsvFallback.length) return { bank: "nubank", rows: nuCsvFallback };

  // --- Planilha manual ---
  const generic = parseGenericImportCsv(text);
  return { bank: "generic", rows: generic };
}

export function bankDisplayName(bank: BankId): string {
  switch (bank) {
    case "sicoob":
      return "Sicoob";
    case "nubank":
      return "Nubank";
    case "mercadopago":
      return "Mercado Pago";
    default:
      return "CSV genérico";
  }
}
