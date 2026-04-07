import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { inflowWhereForTurmaName } from "@/lib/turmaTransactionFilter";

function parseTurmasJson(s: string | null): string[] {
  if (!s) return [];
  try {
    const x = JSON.parse(s) as unknown;
    return Array.isArray(x) ? x.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const group = await prisma.group.findUnique({ where: { id: params.id } });
  if (!group) {
    return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
  }

  const name = group.name;
  const baseWhere = inflowWhereForTurmaName(name);

  const [students, txs, paidSum, pendingSum, paidCount, pendingCount] = await Promise.all([
    prisma.student.findMany({
      where: {
        active: true,
        OR: [{ turma1: name }, { turma2: name }],
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        turma1: true,
        turma2: true,
        email: true,
        phone: true,
        scholarship: true,
        paysOutside: true,
      },
    }),
    prisma.transaction.findMany({
      where: baseWhere,
      orderBy: { date: "desc" },
      take: 60,
      include: { student: { select: { id: true, name: true } } },
    }),
    prisma.transaction.aggregate({
      where: { ...baseWhere, status: "paid" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...baseWhere, status: { in: ["pending", "overdue"] } },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: { ...baseWhere, status: "paid" } }),
    prisma.transaction.count({ where: { ...baseWhere, status: { in: ["pending", "overdue"] } } }),
  ]);

  const withScholarship = students.filter((s) => s.scholarship).length;
  const paysOutsideCount = students.filter((s) => s.paysOutside).length;
  const otherStudents = students.filter((s) => !s.scholarship && !s.paysOutside).length;

  const transactions = txs.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    description: t.description,
    category: t.category,
    amount: t.amount,
    status: t.status,
    account: t.account,
    group: t.group,
    studentName: t.student?.name ?? null,
    turmas: parseTurmasJson(t.turmas),
  }));

  return NextResponse.json({
    group: { id: group.id, name: group.name },
    students,
    studentSummary: {
      total: students.length,
      withScholarship,
      paysOutsideCount,
      otherCount: otherStudents,
    },
    stats: {
      paidTotal: Math.round((paidSum._sum.amount ?? 0) * 100) / 100,
      pendingTotal: Math.round((pendingSum._sum.amount ?? 0) * 100) / 100,
      paidCount,
      pendingCount,
      listedCount: transactions.length,
    },
    transactions,
  });
}
