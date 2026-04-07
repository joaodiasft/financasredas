import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { linkPendingInflowsToStudent } from "@/lib/linkStudentTransactions";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const st = await prisma.student.findUnique({ where: { id: params.id } });
  if (!st) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  const { linked } = await linkPendingInflowsToStudent(params.id);
  return NextResponse.json({
    linked,
    message:
      linked === 0
        ? "Vínculo automático de PIX está desativado. Use Entradas → Conciliar aluno para cada lançamento."
        : undefined,
  });
}
