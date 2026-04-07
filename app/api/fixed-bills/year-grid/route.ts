import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

/** Mês pago no ano (qualquer lançamento que case com a conta fixa ou regra do slug). */
export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const year = parseInt(new URL(request.url).searchParams.get("year") ?? "", 10);
  const y = Number.isFinite(year) ? year : new Date().getFullYear();

  const start = new Date(y, 0, 1, 0, 0, 0, 0);
  const end = new Date(y, 11, 31, 23, 59, 59, 999);

  const bills = await prisma.fixedBill.findMany({ where: { active: true } });
  const grid: Record<string, boolean[]> = {};

  for (const b of bills) {
    const monthsPaid = Array(12).fill(false) as boolean[];
    const or: Prisma.TransactionWhereInput[] = [{ fixedBillId: b.id }];

    if (b.slug === "aluguel") {
      or.push({
        AND: [
          { type: "outflow" },
          { amount: { gte: 1095, lte: 1105 } },
          { description: { contains: "ALUGUEL", mode: "insensitive" } },
        ],
      });
    }

    const txs = await prisma.transaction.findMany({
      where: {
        type: "outflow",
        date: { gte: start, lte: end },
        OR: or,
      },
      select: { date: true },
    });

    for (const t of txs) {
      monthsPaid[new Date(t.date).getMonth()] = true;
    }
    grid[b.id] = monthsPaid;
  }

  return NextResponse.json({ year: y, grid });
}
