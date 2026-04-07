/**
 * Cadastra/atualiza alunos em lote (turmas oficiais + bolsa quando indicado).
 * Uso: npx tsx scripts/seed-students-redacao-batch.ts
 */
import { prisma } from "../lib/prisma";

const EX1 = "Exatas EX 1";
const R1 = "Redação R1";
const R2 = "Redação R2";
const R3 = "Redação R3";
const R4 = "Redação R4";

type Row = { name: string; turma1: string | null; turma2: string | null; scholarship?: boolean };

const ROWS: Row[] = [
  { name: "Anna Beatriz Ferreira Mota", turma1: EX1, turma2: R1 },
  { name: "Isabela Araújo", turma1: R4, turma2: null },
  { name: "Auane Souza Cruz", turma1: R4, turma2: null },
  { name: "Lucas Tomé de Assis", turma1: EX1, turma2: R3 },
  { name: "Davi Santos Magalhães", turma1: R2, turma2: null },
  { name: "Diego Kauan De Oliveira", turma1: R2, turma2: null },
  { name: "Ana Julia Pereira", turma1: R2, turma2: null },
  { name: "Ana Clara Franco", turma1: R2, turma2: null },
  { name: "Arthur Resende", turma1: EX1, turma2: R2 },
  { name: "Livia Porfirio", turma1: R2, turma2: null },
  { name: "Isabela Pereira Felicio", turma1: R2, turma2: null },
  { name: "Gabriel Bastos", turma1: R2, turma2: null },
  { name: "Miguel M. Santos", turma1: R2, turma2: null },
  { name: "Maria Eduarda Batista", turma1: R2, turma2: null },
  { name: "Yasmin Carvalho", turma1: R2, turma2: null, scholarship: true },
  { name: "Paulo Sousa Brito", turma1: R2, turma2: null },
  { name: "Pedro Henrique Pereira", turma1: R2, turma2: null },
  { name: "Débora Silva Santana", turma1: R1, turma2: null },
  { name: "Davi Belarmino", turma1: R1, turma2: null },
  { name: "Arthur Pires Lopes", turma1: R1, turma2: null },
  { name: "Hadacia Cibelly Sousa", turma1: R1, turma2: null },
  { name: "João Gabriel Lopes", turma1: R1, turma2: null },
  { name: "Gustavo Henrique Perim", turma1: R1, turma2: null },
  { name: "Laura Costa Viana", turma1: R1, turma2: null },
  { name: "Laura Sophia Pereira", turma1: R1, turma2: null },
  { name: "Maria Eduarda M. Borges", turma1: R1, turma2: null },
  { name: "Maria Eduarda Pires Andrade Borges", turma1: R1, turma2: null },
  { name: "Maria Luiza Mendes", turma1: R1, turma2: null },
  { name: "Natálya Júlia", turma1: R1, turma2: null },
  { name: "Anna Luiza Mota", turma1: R1, turma2: null },
  { name: "Júlia Gabrielly", turma1: R2, turma2: null },
  { name: "Helena Moreira Pires", turma1: R3, turma2: null },
];

async function upsertStudent(row: Row) {
  const scholarship = row.scholarship === true;
  const existing = await prisma.student.findFirst({
    where: { name: row.name },
  });

  if (existing) {
    await prisma.student.update({
      where: { id: existing.id },
      data: {
        turma1: row.turma1,
        turma2: row.turma2,
        scholarship,
        active: true,
      },
    });
    return "atualizado";
  }

  await prisma.student.create({
    data: {
      name: row.name,
      turma1: row.turma1,
      turma2: row.turma2,
      scholarship,
      active: true,
    },
  });
  return "criado";
}

async function main() {
  let criados = 0;
  let atualizados = 0;
  for (const row of ROWS) {
    const r = await upsertStudent(row);
    if (r === "criado") criados++;
    else atualizados++;
    console.log(row.name, "→", r, row.turma2 ? `${row.turma1} + ${row.turma2}` : row.turma1, scholarshipLabel(row));
  }
  console.log(`\nTotal: ${ROWS.length} | criados: ${criados} | atualizados: ${atualizados}`);
}

function scholarshipLabel(row: Row): string {
  return row.scholarship ? "| bolsa integral" : "";
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
