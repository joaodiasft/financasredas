import type { Prisma } from "@prisma/client";
import { LEGACY_TURMA_ALIASES, TURMAS } from "@/lib/orgConstants";

/** Converte nome de turma (oficial ou legado) para o nome canônico em `TURMAS`, ou `null`. */
export function canonicalTurmaName(tag: string): string | null {
  const t = tag.trim();
  if (!t) return null;
  if ((TURMAS as readonly string[]).includes(t)) return t;
  const mapped = LEGACY_TURMA_ALIASES[t as keyof typeof LEGACY_TURMA_ALIASES];
  if (mapped !== undefined && (TURMAS as readonly string[]).includes(mapped)) return mapped;
  return null;
}

/** Chaves legadas que mapeiam para a turma canônica (ex.: EX1 → Exatas EX 1). */
export function legacyAliasesForCanonical(canonical: string): string[] {
  return Object.entries(LEGACY_TURMA_ALIASES)
    .filter(([, v]) => v === canonical)
    .map(([k]) => k);
}

/** Normaliza lista de turmas para persistência (nomes canônicos, máx. 2). */
export function normalizeTurmasForStorage(input: string[] | undefined): { json: string | null; primary: string | null } {
  if (!input?.length) return { json: null, primary: null };
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const c = canonicalTurmaName(raw);
    if (!c) continue;
    if (seen.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= 2) break;
  }
  return {
    json: out.length ? JSON.stringify(out) : null,
    primary: out[0] ?? null,
  };
}

/** Campo `group` ao salvar: prioriza canônico a partir do cliente; senão turma principal das tags. */
export function resolveStoredGroupField(groupInput: string | null | undefined, turmaPrimary: string | null): string | null {
  const g = groupInput?.trim() || null;
  if (g) {
    const c = canonicalTurmaName(g);
    if (c) return c;
  }
  return turmaPrimary ?? null;
}

/**
 * Entradas vinculadas a uma turma: `group` ou JSON `turmas`, incluindo nomes legados no banco.
 */
export function inflowWhereForTurmaName(turmaName: string): Prisma.TransactionWhereInput {
  const canon = canonicalTurmaName(turmaName) ?? turmaName.trim();
  const legacy = legacyAliasesForCanonical(canon);
  const orParts: Prisma.TransactionWhereInput[] = [
    { group: canon },
    { turmas: { contains: `"${canon}"` } },
  ];
  for (const lg of legacy) {
    orParts.push({ group: lg });
    orParts.push({ turmas: { contains: `"${lg}"` } });
  }
  return {
    type: "inflow",
    OR: orParts,
  };
}

export function paidInflowWhereForTurmaName(turmaName: string): Prisma.TransactionWhereInput {
  return {
    ...inflowWhereForTurmaName(turmaName),
    status: "paid",
  };
}

/** Nomes a considerar no cadastro de alunos (turma1/turma2) para bater com o cartão da turma. */
export function turmaNameVariantsForStudentMatch(groupName: string): string[] {
  const canon = canonicalTurmaName(groupName) ?? groupName.trim();
  const leg = legacyAliasesForCanonical(canon);
  return Array.from(new Set([groupName.trim(), canon, ...leg].filter(Boolean)));
}
