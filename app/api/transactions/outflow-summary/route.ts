import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { EXPENSE_CATEGORY_ORDER } from "@/lib/classifyExpenseCategory";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const rows = await prisma.transaction.groupBy({
    by: ["category"],
    where: { type: "outflow" },
    _sum: { amount: true },
    _count: { _all: true },
  });

  const orderIndex = new Map(EXPENSE_CATEGORY_ORDER.map((c, i) => [c, i]));

  const items = rows
    .map((r) => ({
      category: r.category,
      total: Math.round((r._sum.amount ?? 0) * 100) / 100,
      count: r._count._all,
    }))
    .sort((a, b) => {
      const ia = orderIndex.has(a.category) ? orderIndex.get(a.category)! : 999;
      const ib = orderIndex.has(b.category) ? orderIndex.get(b.category)! : 999;
      if (ia !== ib) return ia - ib;
      return b.total - a.total;
    });

  const grandTotal = Math.round(items.reduce((s, x) => s + x.total, 0) * 100) / 100;

  return NextResponse.json({ items, grandTotal });
}
