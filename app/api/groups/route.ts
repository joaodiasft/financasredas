import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { paidInflowWhereForTurmaName, turmaNameVariantsForStudentMatch } from "@/lib/turmaCanonical";

const createSchema = z.object({
  name: z.string().min(1),
  studentCount: z.number().int().min(0).optional(),
});

const CHART_MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const groups = await prisma.group.findMany({ orderBy: { name: "asc" } });
  const now = new Date();
  const startThis = new Date(now.getFullYear(), now.getMonth(), 1);
  const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endPrev = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const items = await Promise.all(
    groups.map(async (g) => {
      const basePaid = paidInflowWhereForTurmaName(g.name);
      const paidAll = await prisma.transaction.aggregate({
        where: basePaid,
        _sum: { amount: true },
      });
      const thisM = await prisma.transaction.aggregate({
        where: {
          AND: [basePaid, { date: { gte: startThis } }],
        } as Prisma.TransactionWhereInput,
        _sum: { amount: true },
      });
      const prevM = await prisma.transaction.aggregate({
        where: {
          AND: [basePaid, { date: { gte: startPrev, lte: endPrev } }],
        } as Prisma.TransactionWhereInput,
        _sum: { amount: true },
      });

      const balance = Math.round((paidAll._sum.amount ?? 0) * 100) / 100;
      const a = thisM._sum.amount ?? 0;
      const b = prevM._sum.amount ?? 0;
      let performance = 0;
      if (b > 0) performance = Math.round(((a - b) / b) * 1000) / 10;
      else if (a > 0) performance = 100;

      let status: "profitable" | "loss" | "neutral" = "neutral";
      if (performance > 0.5) status = "profitable";
      else if (performance < -0.5) status = "loss";

      const nameVariants = turmaNameVariantsForStudentMatch(g.name);
      const enrolled = await prisma.student.count({
        where: {
          active: true,
          OR: nameVariants.flatMap((v) => [{ turma1: v }, { turma2: v }]),
        },
      });

      return {
        id: g.id,
        name: g.name,
        students: enrolled,
        balance,
        performance,
        status,
      };
    }),
  );

  const byBalance = [...items].sort((a, b) => b.balance - a.balance);
  const g1 = byBalance[0]?.name;
  const g2 = byBalance[1]?.name;

  const chart: { name: string; A: number; B: number }[] = [];
  for (let i = 0; i < CHART_MONTHS.length; i++) {
    const t0 = new Date(2026, i, 1);
    const t1 = new Date(2026, i + 1, 0, 23, 59, 59, 999);
    let A = 0;
    let B = 0;
    if (g1) {
      const s = await prisma.transaction.aggregate({
        where: {
          AND: [paidInflowWhereForTurmaName(g1), { date: { gte: t0, lte: t1 } }],
        } as Prisma.TransactionWhereInput,
        _sum: { amount: true },
      });
      A = Math.round(s._sum.amount ?? 0);
    }
    if (g2) {
      const s = await prisma.transaction.aggregate({
        where: {
          AND: [paidInflowWhereForTurmaName(g2), { date: { gte: t0, lte: t1 } }],
        } as Prisma.TransactionWhereInput,
        _sum: { amount: true },
      });
      B = Math.round(s._sum.amount ?? 0);
    }
    chart.push({ name: CHART_MONTHS[i], A, B });
  }

  return NextResponse.json({ items, chart });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const row = await prisma.group.create({
      data: {
        name: parsed.data.name,
        studentCount: parsed.data.studentCount ?? 0,
        balance: 0,
        performance: 0,
        status: "neutral",
      },
    });
    return NextResponse.json({ item: row });
  } catch {
    return NextResponse.json({ error: "Turma com este nome já existe" }, { status: 409 });
  }
}
