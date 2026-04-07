import { canonicalTurmaName } from "@/lib/turmaCanonical";
import { TURMAS } from "@/lib/orgConstants";

function parseTurmasJson(s: string | null): string[] {
  if (!s) return [];
  try {
    const x = JSON.parse(s) as unknown;
    return Array.isArray(x) ? x.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

function parseTurmaAmountsField(raw: unknown): Record<string, number> | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const canon = canonicalTurmaName(k);
    if (!canon) continue;
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n) && n > 0) out[canon] = Math.round(((out[canon] ?? 0) + n) * 100) / 100;
  }
  return Object.keys(out).length ? out : null;
}

/** Reparte valor em `parts` cotas iguais em centavos (soma exata). */
function splitEqualCents(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / parts);
  const rem = cents - base * parts;
  const arr: number[] = [];
  for (let i = 0; i < parts; i++) {
    arr.push((base + (i < rem ? 1 : 0)) / 100);
  }
  return arr;
}

export type InflowForAllocation = {
  amount: number;
  turmas: string | null;
  group: string | null;
  turmaAmounts: unknown;
};

/**
 * Atribui receita paga de uma entrada às turmas canônicas.
 * Prioriza `turmaAmounts` (conciliação); senão usa tags em `turmas` / `group` com partilha igual.
 */
export function allocatePaidInflowToTurmas(t: InflowForAllocation): Map<string, number> {
  const result = new Map<string, number>();
  const fromJson = parseTurmaAmountsField(t.turmaAmounts);
  if (fromJson) {
    for (const [turma, amt] of Object.entries(fromJson)) {
      if (!(TURMAS as readonly string[]).includes(turma)) continue;
      result.set(turma, (result.get(turma) ?? 0) + amt);
    }
    return result;
  }

  const tags = parseTurmasJson(t.turmas);
  const useRaw = tags.length ? tags : t.group ? [t.group] : [];
  const canonical = useRaw.map((x) => canonicalTurmaName(x)).filter((x): x is string => !!x);
  if (canonical.length === 0) return result;

  const shares = splitEqualCents(t.amount, canonical.length);
  for (let i = 0; i < canonical.length; i++) {
    const turma = canonical[i];
    result.set(turma, (result.get(turma) ?? 0) + shares[i]);
  }
  return result;
}
