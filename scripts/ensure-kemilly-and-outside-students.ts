/**
 * Garante Kemilly (Redação R3 + vínculo PIX) e alunos "pagamento por fora" (María Eduarda, Clóvis).
 * Uso após import: npx tsx scripts/ensure-kemilly-and-outside-students.ts
 */
import { PrismaClient } from "@prisma/client";
import { linkPendingInflowsToStudent } from "../lib/linkStudentTransactions";

const prisma = new PrismaClient();

const OUTSIDE_NOTE =
  "Mensalidade paga por fora — conta Nubank Martha. Use este campo para anotar turma/matrícula e para onde vai o registro.";

async function main() {
  let kemilly = await prisma.student.findFirst({
    where: { name: { contains: "Kemilly", mode: "insensitive" } },
  });

  const kemillyData = {
    name: "Kemilly Endy Goncalves Martins",
    turma1: "Redação R3",
    turma2: null as string | null,
    pixMatchNames: "Kemilly Endy, Kemilly Endy Goncalves Martins, K Endy Goncalves",
    paysOutside: false,
    outsideNote: null as string | null,
    active: true,
  };

  if (!kemilly) {
    kemilly = await prisma.student.create({ data: kemillyData });
    console.log("Criada:", kemilly.name);
  } else {
    kemilly = await prisma.student.update({
      where: { id: kemilly.id },
      data: {
        name: kemillyData.name,
        turma1: kemillyData.turma1,
        turma2: kemillyData.turma2,
        pixMatchNames: kemillyData.pixMatchNames,
        paysOutside: false,
        outsideNote: null,
        active: true,
      },
    });
    console.log("Atualizada:", kemilly.name);
  }

  const { linked } = await linkPendingInflowsToStudent(kemilly.id);
  console.log("Vínculo automático (desativado):", linked, "— concilie manualmente em Entradas se precisar.");

  const inflowsKemilly = await prisma.transaction.count({
    where: {
      type: "inflow",
      studentId: kemilly.id,
    },
  });
  console.log("Total de entradas já vinculadas a Kemilly no banco:", inflowsKemilly);

  for (const name of ["Maria Eduarda Marques", "Clovis Daniel Marques"]) {
    let s = await prisma.student.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (!s) {
      s = await prisma.student.create({
        data: {
          name,
          paysOutside: true,
          outsideNote: OUTSIDE_NOTE,
          active: true,
        },
      });
      console.log("Criada (pagamento por fora):", s.name);
    } else {
      await prisma.student.update({
        where: { id: s.id },
        data: {
          paysOutside: true,
          outsideNote: s.outsideNote?.trim() ? s.outsideNote : OUTSIDE_NOTE,
        },
      });
      console.log("Atualizada (pagamento por fora):", name);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
