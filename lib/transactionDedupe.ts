import { createHash } from "node:crypto";

/** Normaliza descrição para deduplicação estável entre importações. */
export function normalizeDescriptionForDedupe(description: string): string {
  return description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

/**
 * Chave única por lançamento — evita o mesmo PIX/linha duas vezes no banco.
 * Formato: sha256 hex (64 chars).
 */
export function makeTransactionDedupeKey(input: {
  date: string;
  description: string;
  amount: number;
  type: string;
  account: string | null | undefined;
}): string {
  const dateStr = input.date.slice(0, 10);
  const desc = normalizeDescriptionForDedupe(input.description);
  const acc = (input.account ?? "").trim().toLowerCase() || "—";
  const amt = Math.round(input.amount * 100) / 100;
  const raw = `${dateStr}|${desc}|${amt}|${input.type}|${acc}`;
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export function sha256HexBuffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}
