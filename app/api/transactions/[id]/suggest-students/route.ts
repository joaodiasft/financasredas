import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { scoreStudentMatch } from "@/lib/matchStudentToDescription";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tx = await prisma.transaction.findUnique({
    where: { id: params.id },
    select: { id: true, description: true, type: true },
  });
  if (!tx || tx.type !== "inflow") {
    return NextResponse.json({ error: "Lançamento inválido" }, { status: 400 });
  }

  const students = await prisma.student.findMany({
    where: { active: true, paysOutside: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, pixMatchNames: true, turma1: true, turma2: true },
  });

  const scored = students
    .map((s) => ({
      id: s.id,
      name: s.name,
      turma1: s.turma1,
      turma2: s.turma2,
      score: scoreStudentMatch(tx.description, s.name, s.pixMatchNames),
    }))
    .filter((s) => s.score >= 38)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return NextResponse.json({ items: scored });
}
