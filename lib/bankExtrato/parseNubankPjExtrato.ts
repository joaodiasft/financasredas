import { classifyOutflowCategory } from "../classifyExpenseCategory";
import type { ParsedExtratoRow } from "./types";

const NU_MONTHS: Record<string, number> = {
  JAN: 0,
  FEV: 1,
  MAR: 2,
  ABR: 3,
  MAI: 4,
  JUN: 5,
  JUL: 6,
  AGO: 7,
  SET: 8,
  OUT: 9,
  NOV: 10,
  DEZ: 11,
  FEB: 1,
  APR: 3,
  MAY: 4,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  DEC: 11,
};

const RE_DAY = /^(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ|FEB|APR|MAY|SEP|OCT|DEC|AUG)\s+(\d{4})\b/i;

function ymd(day: number, mon: string, year: number): string | null {
  const mi = NU_MONTHS[mon.toUpperCase()];
  if (mi === undefined) return null;
  const d = new Date(year, mi, day, 12, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function parseAmountBr(s: string): number {
  return parseFloat(s.replace(/\./g, "").replace(",", "."));
}

function isAmountOnly(line: string): boolean {
  return /^(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}$/.test(line.trim());
}

function extractTrailingAmount(body: string): { rest: string; amount: number } | null {
  const m = body.match(/^(.+?)\s+([\d]{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})\s*$/);
  if (!m) return null;
  const amount = parseAmountBr(m[2]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { rest: m[1].trim(), amount };
}

function nuCategory(desc: string, type: "inflow" | "outflow"): string {
  const u = desc.toUpperCase();
  if (type === "inflow") {
    if (/IFOOD/i.test(desc)) return "Mensalidade";
    if (/RESGATE\s+RDB/i.test(desc)) return "Outras receitas";
    if (/TRANSFER(Ê|E)NCIA\s+RECEBIDA|TRANSFERÊNCIA\s+RECEBIDA/i.test(u)) return "Mensalidade";
    return "Outras receitas";
  }
  if (/BOLETO/i.test(u)) {
    if (/DELTA|TELECOM|ORSEGUPS|MONITORAMENTO|NOTA\s+CONTROL/i.test(u)) return "Infraestrutura";
    return classifyOutflowCategory(desc);
  }
  if (/APLICA(CÇÃO|CAO)\s+RDB|\bRDB\b/i.test(u)) return "Outras despesas";
  if (/TRANSFER(Ê|E)NCIA\s+ENVIADA.*(SICOOB|REDAC|JOAO\s+CLAUDIO)/i.test(desc)) return "PIX / transferências";
  return classifyOutflowCategory(desc);
}

function skipNoise(line: string): boolean {
  if (/^REDACAO NOTA MIL|^CNPJ Agência|^47175672|^51\.241\.242/i.test(line)) return true;
  if (/^a\s+01 DE JANEIRO/i.test(line)) return true;
  if (/^VALORES EM R\$/i.test(line)) return true;
  if (/^Saldo (final|inicial)|^Rendimento líquido|^Total de entradas|^Total de saídas|^Movimentações$/i.test(line)) return true;
  if (/^R\$\s*[\d.,-]+$/i.test(line)) return true;
  if (/^9,09$|^0,00$/i.test(line)) return false;
  if (/^Tem alguma dúvida|^Caso a solução|^Extrato gerado|^disponíveis em nubank|^Nu Financeira|^Nu Pagamentos S\.A/i.test(line))
    return true;
  if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line)) return true;
  if (/^\d+\s+de\s+\d+$/i.test(line)) return true;
  if (/^Agência:\s*\d+\s+Conta:/i.test(line)) return true;
  if (/^\d{2}\s+\d{4}-\d$/i.test(line)) return true;
  if (/^PAGAMENTOS\s+-\s+IP/i.test(line)) return true;
  return false;
}

/**
 * Extrato PDF Nubank PJ (conta empresa) — layout narrativo com blocos por dia.
 */
export function parseNubankPjExtratoText(raw: string): ParsedExtratoRow[] {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const out: ParsedExtratoRow[] = [];
  let currentYmd: string | null = null;

  const push = (date: string, description: string, amount: number, type: "inflow" | "outflow") => {
    const desc = description.replace(/\s+/g, " ").trim();
    if (desc.length < 3 || amount <= 0) return;
    out.push({
      date,
      description: desc,
      category: nuCategory(desc, type),
      amount,
      type,
      status: "paid",
      account: "Nubank PJ",
      needsReconcile: type === "inflow",
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (skipNoise(L)) continue;

    const dm = L.match(RE_DAY);
    if (dm) {
      const y = ymd(parseInt(dm[1], 10), dm[2], parseInt(dm[3], 10));
      if (y) currentYmd = y;
      continue;
    }

    if (!currentYmd) continue;

    if (/^Saldo do dia/i.test(L)) continue;
    if (/^Total de (entradas|saídas|saidas)/i.test(L)) continue;

    if (/^Pagamento de boleto efetuado/i.test(L)) {
      const body = L.replace(/^Pagamento de boleto efetuado\s+/i, "").trim();
      const inline = extractTrailingAmount(body);
      if (inline) {
        push(currentYmd, `Pagamento de boleto — ${inline.rest}`, inline.amount, "outflow");
        continue;
      }
      const buf = [body];
      let j = i + 1;
      while (j < lines.length && !isAmountOnly(lines[j]) && !RE_DAY.test(lines[j]) && !skipNoise(lines[j])) {
        if (/^Saldo do dia|^Total de/i.test(lines[j])) break;
        buf.push(lines[j]);
        j++;
      }
      if (j < lines.length && isAmountOnly(lines[j])) {
        const amt = parseAmountBr(lines[j]);
        push(currentYmd, `Pagamento de boleto — ${buf.join(" ")}`, amt, "outflow");
        i = j;
      }
      continue;
    }

    if (/^(Aplicação|Resgate)\s+RDB/i.test(L)) {
      const tail = L.match(/^(Aplicação|Resgate)\s+RDB\s+([\d.]+,\d{2})\s*$/i);
      if (tail) {
        const amt = parseAmountBr(tail[2]);
        const type = /^Resgate/i.test(tail[1]) ? "inflow" : "outflow";
        push(currentYmd, `${tail[1]} RDB`, amt, type);
      }
      continue;
    }

    if (/^Estorno/i.test(L) || /^Transferência (enviada|recebida|Recebida)/i.test(L)) {
      const combined = L;
      const trail = extractTrailingAmount(combined);
      if (trail && /[\d.]+,\d{2}\s*$/.test(combined)) {
        const type: "inflow" | "outflow" = /recebida/i.test(combined) ? "inflow" : "outflow";
        push(currentYmd, trail.rest, trail.amount, type);
        continue;
      }

      const buf: string[] = [L];
      let j = i + 1;
      while (j < lines.length) {
        const N = lines[j];
        if (RE_DAY.test(N) || skipNoise(N)) break;
        if (/^Saldo do dia|^Total de/i.test(N)) break;
        if (isAmountOnly(N)) {
          const amt = parseAmountBr(N);
          push(currentYmd, buf.join(" — "), amt, /recebida/i.test(buf.join(" ")) ? "inflow" : "outflow");
          i = j;
          break;
        }
        buf.push(N);
        j++;
      }
      continue;
    }
  }

  return dedupe(out);
}

function dedupe(rows: ParsedExtratoRow[]): ParsedExtratoRow[] {
  const seen = new Set<string>();
  const r: ParsedExtratoRow[] = [];
  for (const x of rows) {
    const k = `${x.date}|${x.description}|${x.amount}|${x.type}`;
    if (seen.has(k)) continue;
    seen.add(k);
    r.push(x);
  }
  return r;
}

export function looksLikeNubankPjExtrato(text: string, fileName: string): boolean {
  const n = fileName.toUpperCase();
  if (/^NU[_-]/i.test(fileName) && /\.pdf$/i.test(fileName)) return true;
  const head = text.slice(0, 6000);
  return (
    /Movimenta(ç|c)ões/i.test(head) &&
    (/Nu Pagamentos|Nu Financeira/i.test(head) || /47175672/i.test(head)) &&
    /REDACAO NOTA MIL|CNPJ.*Agência.*Conta/i.test(head)
  );
}
