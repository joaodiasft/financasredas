/**
 * Gera prisma/data/extrato-nota-mil-fev-2026.json a partir do texto bruto do PDF.
 * Rode após: node scripts/extract-pdf-text.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parseSicoobExtratoText } from "../lib/parseSicoobExtrato";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rawPath = join(__dirname, "sources", "sicoob-extrato-raw.txt");
const outPath = join(__dirname, "data", "extrato-nota-mil-fev-2026.json");

const raw = readFileSync(rawPath, "utf8");
const txs = parseSicoobExtratoText(raw);
const serializable = txs.map((t) => ({
  ...t,
  date: (t.date as Date).toISOString().slice(0, 10),
}));
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(serializable, null, 2), "utf8");
console.log("Lançamentos:", serializable.length, "→", outPath);
