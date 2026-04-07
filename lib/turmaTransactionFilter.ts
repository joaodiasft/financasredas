import type { Prisma } from "@prisma/client";

/** Filtro Prisma: entradas vinculadas ao nome da turma (campo group ou JSON turmas). */
export function inflowWhereForTurmaName(turmaName: string): Prisma.TransactionWhereInput {
  return {
    type: "inflow",
    OR: [{ group: turmaName }, { turmas: { contains: `"${turmaName}"` } }],
  };
}
