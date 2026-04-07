import type { BankId } from "./types";

/**
 * Identifica o banco pelo nome do arquivo e trecho inicial do conteúdo.
 */
export function detectBankId(fileName: string, text: string): BankId {
  const n = fileName.toLowerCase();
  const head = text.slice(0, 12000).toLowerCase();
  const headU = text.slice(0, 12000);

  if (/sicoob|sisbr|brmil|cooperativa/i.test(n) || /sicoob|sisbr|plataforma.*sicoob/i.test(headU)) {
    return "sicoob";
  }
  if (/nubank|nu[_-]?pagamentos|extrato.*nu/i.test(n) || /nu\s*pagamentos|extrato\s+da\s+conta|www\.nubank\.com\.br/i.test(head)) {
    return "nubank";
  }
  if (
    /mercado\s*pago|mercadopago|mercado_livre|mercadolibre/i.test(n) ||
    /mercado\s*pago|mercadolibre|mercado\s+livre|money\s+in\s+account|dinheiro\s+em\s+conta/i.test(head)
  ) {
    return "mercadopago";
  }

  if (/sicoob|sisbr/i.test(headU)) return "sicoob";
  if (/nu\s*pagamentos|nubank/i.test(head)) return "nubank";
  if (/mercado\s*pago|mercadolibre/i.test(head)) return "mercadopago";

  return "generic";
}

export function looksLikeMercadoPagoReportHeader(line: string): boolean {
  const u = line.toUpperCase();
  const hasType = u.includes("TRANSACTION_TYPE") || u.includes("TIPO_DE_TRANSACCION") || u.includes("RECORD_TYPE");
  const hasMoney =
    u.includes("SETTLEMENT") || u.includes("LIQUIDACION") || u.includes("NET_AMOUNT") || u.includes("MONTO") || u.includes("VALOR");
  const hasMpMarker = u.includes("MERCADO") && u.includes("PAGO");
  return (hasType && hasMoney) || hasMpMarker || (u.includes("SETTLEMENT_NET_AMOUNT") && u.includes("DATE"));
}

export function looksLikeNubankCsvHeader(line: string): boolean {
  const cells = parseDelimitedLineForDetect(line);
  const norm = cells.map((c) => normalizeHeaderLite(c));
  const joined = norm.join("|");
  return (
    (joined.includes("data") || joined.includes("date")) &&
    (joined.includes("valor") || joined.includes("amount") || joined.includes("value")) &&
    (joined.includes("titulo") || joined.includes("title") || joined.includes("descricao") || joined.includes("description"))
  );
}

function normalizeHeaderLite(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseDelimitedLineForDetect(line: string): string[] {
  const semi = line.split(";").length;
  const comma = line.split(",").length;
  const sep = semi >= comma ? ";" : ",";
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (!inQ && c === sep) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}
