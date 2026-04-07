import { detectSeparator, parseDelimitedLine } from "./csvLine";
import type { ParsedExtratoRow } from "./types";

/**
 * Formato manual do painel: data, descrição, categoria, valor[, tipo][, status][, conta].
 * Aceita vírgula ou ponto e vírgula; respeita aspas.
 */
export function parseGenericImportCsv(text: string): ParsedExtratoRow[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const sep = detectSeparator(lines[0]) ?? ",";
  const rows: ParsedExtratoRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parts = parseDelimitedLine(lines[i], sep);
    if (parts.length < 4) continue;
    if (i === 0 && /data|descri/i.test(parts[0] ?? "")) continue;

    const [dateStr, description, category, amountStr, typeStr = "outflow", statusStr = "paid", account = "—"] = parts;
    const amtClean = amountStr.replace(/\s/g, "").replace(/^R\$/i, "");
    const amount =
      amtClean.includes(",") && /\.\d{3}/.test(amtClean)
        ? Math.abs(parseFloat(amtClean.replace(/\./g, "").replace(",", ".")))
        : Math.abs(parseFloat(amtClean.replace(",", ".")));
    if (!dateStr || !description || Number.isNaN(amount)) continue;

    const type = typeStr.toLowerCase() === "entrada" || typeStr.toLowerCase() === "inflow" ? "inflow" : "outflow";
    const status = statusStr.toLowerCase() === "pendente" || statusStr.toLowerCase() === "pending" ? "pending" : "paid";

    rows.push({
      date: dateStr.length === 10 ? dateStr : new Date().toISOString().slice(0, 10),
      description,
      category: category || "Importado",
      amount,
      type,
      status,
      account,
    });
  }

  return rows;
}
