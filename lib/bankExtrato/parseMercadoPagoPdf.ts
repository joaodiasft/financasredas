import { classifyOutflowCategory } from "../classifyExpenseCategory";
import type { ParsedExtratoRow } from "./types";

function parseBrSigned(raw: string): { amount: number; outflow: boolean } {
  const t = raw.replace(/\s/g, "").replace(/^R\$/i, "");
  const neg = t.startsWith("-");
  const inner = t.replace(/^-/, "");
  const n = parseFloat(inner.replace(/\./g, "").replace(",", "."));
  return { amount: Math.abs(n), outflow: neg };
}

/** DD-MM-AAAA → AAAA-MM-DD */
function toIso(dmy: string): string {
  const [d, m, y] = dmy.split("-");
  return `${y}-${m}-${d}`;
}

function mpPdfCategory(description: string, outflow: boolean): string {
  const u = description.toUpperCase();
  if (!outflow) {
    if (/RENDIMENTOS/i.test(description)) return "Outras receitas";
    if (/RESGATE\s+CDB|RESGATE\s+RDB/i.test(description)) return "Outras receitas";
    if (/LIBERA(CÇÃO|\u00c7\u00c3O)\s+DE\s+DINHEIRO|DINHEIRO\s+RETIRADO\s+CASA/i.test(description)) return "Mensalidade";
    if (/TRANSFER(EÊ|Ê)NCIA\s+PIX\s+RECEBIDA|APROVA(CÇÃO|\u00c7\u00c3O)\s+DO\s+DINHEIRO/i.test(description)) return "Mensalidade";
    if (/REEMBOLSO/i.test(description)) return "Outras receitas";
    if (/DINHEIRO\s+RECEBIDO|RECARGA/i.test(description)) return "Outras receitas";
    return "Outras receitas";
  }
  if (/EMPR[EÉ]STIMO|PARCELA|D[IÍ]VIDA|PAGAMENTO\s+ANTECIPADO/i.test(u)) return "Tarifas e banco";
  if (/PIX\s+ENVIADO.*REDAC/i.test(u)) return "PIX / transferências";
  if (/INVESTIMENTO|APLICA(CÇÃO|\u00c7\u00c3O)\s+EM\s+CDB/i.test(u)) return "Outras despesas";
  return classifyOutflowCategory(description);
}

/** Linha só com ID + valores (ex.: continuação após nome em linha anterior). */
const ID_AMOUNTS = /^(\d{10,})\s+R\$\s*(-?[\d.]+,\d{2})\s+R\$\s*([\d.]+,\d{2})\s*$/;

/** Descrição + ID + valores na mesma linha (ex.: "João ... 139645768155 R$ 89,54 R$ 89,54"). */
const DESC_ID_AMOUNTS = /^(.+?)\s+(\d{10,})\s+R\$\s*(-?[\d.]+,\d{2})\s+R\$\s*([\d.]+,\d{2})\s*$/;

/**
 * PDF "EXTRATO DE CONTA" do Mercado Pago (pessoa física), texto extraído.
 */
export function parseMercadoPagoExtratoPdfText(raw: string): ParsedExtratoRow[] {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const out: ParsedExtratoRow[] = [];
  let i = 0;

  while (i < lines.length) {
    const L = lines[i];
    if (/^Data\s+Descri/i.test(L) || /^DETALHE DOS MOVIMENTOS/i.test(L) || /^Saldo final/i.test(L)) {
      i++;
      continue;
    }
    if (
      /^Você tem alguma dúvida|^Mercado Pago Instituição|^Data de geração|^Encontre nossos canais|^www\.mercadopago/i.test(
        L,
      )
    ) {
      i++;
      continue;
    }
    if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(L)) {
      i++;
      continue;
    }

    const start = L.match(/^(\d{2}-\d{2}-\d{4})\s*(.*)$/);
    if (!start) {
      i++;
      continue;
    }

    const iso = toIso(start[1]);
    const rest = start[2].trim();

    const oneLine = rest.match(/^(.+?)\s+(\d{10,})\s+R\$\s*(-?[\d.]+,\d{2})\s+R\$\s*([\d.]+,\d{2})\s*$/);
    if (oneLine) {
      const desc = `${oneLine[1].trim()} [MP ${oneLine[2]}]`.replace(/\s+/g, " ");
      const { amount, outflow } = parseBrSigned(oneLine[3]);
      if (amount > 0) {
        const type = outflow ? "outflow" : "inflow";
        out.push({
          date: iso,
          description: desc,
          category: mpPdfCategory(desc, outflow),
          amount,
          type,
          status: "paid",
          account: "Mercado Pago",
          needsReconcile: type === "inflow",
        });
      }
      i++;
      continue;
    }

    if (!rest) {
      i++;
      continue;
    }

    const chunks: string[] = [rest];
    let j = i + 1;
    let matched = false;

    while (j < lines.length) {
      const N = lines[j];
      if (/^\d{2}-\d{2}-\d{4}\s/.test(N)) break;
      if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(N)) {
        j++;
        continue;
      }
      if (/^Você tem alguma dúvida|^Mercado Pago Instituição|^Data de geração/i.test(N)) {
        j++;
        continue;
      }

      let tail = N.match(ID_AMOUNTS);
      let descExtra = "";
      if (!tail) {
        const inline = N.match(DESC_ID_AMOUNTS);
        if (inline) {
          descExtra = inline[1].trim();
          tail = [inline[0], inline[2], inline[3], inline[4]] as RegExpMatchArray;
        }
      }
      if (tail) {
        const parts = [...chunks, descExtra].filter(Boolean);
        const descClean = parts.join(" ").replace(/\s+/g, " ").trim();
        const fullDesc = `${descClean} [MP ${tail[1]}]`;
        const { amount, outflow } = parseBrSigned(tail[2]);
        if (amount > 0) {
          const type = outflow ? "outflow" : "inflow";
          out.push({
            date: iso,
            description: fullDesc,
            category: mpPdfCategory(fullDesc, outflow),
            amount,
            type,
            status: "paid",
            account: "Mercado Pago",
            needsReconcile: type === "inflow",
          });
        }
        matched = true;
        i = j;
        break;
      }

      chunks.push(N);
      j++;
    }

    if (matched) {
      i++;
      continue;
    }

    i++;
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

export function looksLikeMercadoPagoExtratoPdf(text: string): boolean {
  const u = text.slice(0, 4000).toUpperCase();
  return u.includes("EXTRATO DE CONTA") && (u.includes("ID DA OPERA") || u.includes("MERCADO PAGO"));
}
