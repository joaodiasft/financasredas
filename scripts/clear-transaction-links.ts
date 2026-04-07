/**
 * Remove todas as vinculações de aluno/turma nas transações (conciliar do zero).
 * Não apaga lançamentos nem importações — só zera studentId, turmas, group e repasses.
 *
 * Uso: npx tsx scripts/clear-transaction-links.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cleared = await prisma.transaction.updateMany({
    data: {
      studentId: null,
      turmas: null,
      group: null,
      turmaAmounts: Prisma.JsonNull,
    },
  });

  const inflows = await prisma.transaction.updateMany({
    where: { type: "inflow" },
    data: { needsReconcile: true },
  });

  console.log(
    `Vínculos removidos: ${cleared.count} lançamento(s) atualizado(s) (aluno/turmas/grupo/repasse zerados).`,
  );
  console.log(`Entradas marcadas para conciliar: ${inflows.count} (needsReconcile = true).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
