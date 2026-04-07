import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { enrichPayableDisplay } from "@/lib/transactionDisplay";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);

  const outflows = await prisma.transaction.findMany({
    where: { type: "outflow" },
    orderBy: { date: "asc" },
  });

  const items = outflows.map((t) => {
    const due = startOfDay(new Date(t.date));
    let status = t.status as "paid" | "pending" | "overdue";
    if (t.status === "pending" && due < today) {
      status = "overdue";
    }
    const disp = enrichPayableDisplay(t.description, t.amount, t.category);
    return {
      id: t.id,
      description: t.description,
      displayDescription: disp.displayDescription,
      expenseTag: disp.tag,
      expenseTagLabel: disp.tagLabel,
      category: t.category,
      dueDate: t.date.toISOString().slice(0, 10),
      amount: t.amount,
      status,
      priority: (t.priority ?? "medium") as "low" | "medium" | "high" | "critical",
      fixedBillId: t.fixedBillId,
    };
  });

  const unpaid = items.filter((i) => i.status !== "paid");
  const overdueItems = items.filter((i) => i.status === "overdue");
  const overdueSum = overdueItems.reduce((s, i) => s + i.amount, 0);

  const next7 = unpaid.filter((i) => {
    const d = startOfDay(new Date(i.dueDate));
    return d >= today && d <= weekEnd;
  });
  const next7Sum = next7.reduce((s, i) => s + i.amount, 0);

  const paidMonth = items.filter((i) => {
    if (i.status !== "paid") return false;
    const d = new Date(i.dueDate);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const paidMonthSum = paidMonth.reduce((s, i) => s + i.amount, 0);

  const criticalOverdue = overdueItems.filter((i) => i.priority === "critical").length;

  return NextResponse.json({
    summary: {
      overdueTotal: Math.round(overdueSum * 100) / 100,
      next7Total: Math.round(next7Sum * 100) / 100,
      paidMonthTotal: Math.round(paidMonthSum * 100) / 100,
      criticalOverdue,
      overdueCount: overdueItems.length,
      next7Count: next7.length,
      paidMonthCount: paidMonth.length,
    },
    items,
  });
}
