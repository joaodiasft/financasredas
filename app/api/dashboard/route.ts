import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canonicalTurmaName } from "@/lib/turmaCanonical";

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function parseTurmas(s: string | null): string[] {
  if (!s) return [];
  try {
    const x = JSON.parse(s) as unknown;
    return Array.isArray(x) ? x.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [txs, activeStudents, pendingInflows, reconcileQueue, fixedBills, outPending] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: since } },
      orderBy: { date: "asc" },
    }),
    prisma.student.count({ where: { active: true } }),
    prisma.transaction.findMany({
      where: { type: "inflow", status: "pending" },
    }),
    prisma.transaction.count({ where: { needsReconcile: true } }),
    prisma.fixedBill.findMany({ where: { active: true } }),
    prisma.transaction.findMany({
      where: { type: "outflow", status: { in: ["pending", "overdue"] } },
    }),
  ]);

  const paidInflows = txs.filter((t) => t.type === "inflow" && t.status === "paid");
  const outflows = txs.filter((t) => t.type === "outflow");

  const totalRevenue = paidInflows.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = outflows.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const revenueThisMonth = txs
    .filter((t) => t.type === "inflow" && t.status === "paid" && t.date >= monthStart && t.date <= monthEnd)
    .reduce((s, t) => s + t.amount, 0);
  const expensesThisMonth = txs
    .filter((t) => t.type === "outflow" && t.status === "paid" && t.date >= monthStart && t.date <= monthEnd)
    .reduce((s, t) => s + t.amount, 0);

  const pendingInflowSum = pendingInflows.reduce((s, t) => s + t.amount, 0);
  const outPendingSum = outPending.reduce((s, t) => s + t.amount, 0);

  const byMonth = new Map<string, { inflow: number; outflow: number }>();
  for (const t of txs) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!byMonth.has(key)) {
      byMonth.set(key, { inflow: 0, outflow: 0 });
    }
    const bucket = byMonth.get(key)!;
    if (t.type === "inflow" && t.status === "paid") bucket.inflow += t.amount;
    if (t.type === "outflow" && t.status === "paid") bucket.outflow += t.amount;
  }

  /** Sempre 6 meses corridos (meses sem movimento aparecem com zero). */
  const cashFlow: { month: string; inflow: number; outflow: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const b = byMonth.get(key);
    cashFlow.push({
      month: `${MONTHS_PT[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`,
      inflow: Math.round(b?.inflow ?? 0),
      outflow: Math.round(b?.outflow ?? 0),
    });
  }

  const catMapOut = new Map<string, number>();
  for (const t of outflows) {
    if (t.status !== "paid") continue;
    catMapOut.set(t.category, (catMapOut.get(t.category) ?? 0) + t.amount);
  }
  const expensesByCategory = Array.from(catMapOut.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (expensesByCategory.length === 0) {
    expensesByCategory.push({ name: "Sem dados", value: 0 });
  }

  const catMapIn = new Map<string, number>();
  for (const t of paidInflows) {
    catMapIn.set(t.category, (catMapIn.get(t.category) ?? 0) + t.amount);
  }
  const revenueByCategory = Array.from(catMapIn.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const turmaTotals = new Map<string, number>();
  for (const t of paidInflows) {
    const tags = parseTurmas(t.turmas);
    const tagsUse = tags.length ? tags : t.group ? [t.group] : [];
    for (const tag of tagsUse) {
      const c = canonicalTurmaName(tag);
      if (c) {
        turmaTotals.set(c, (turmaTotals.get(c) ?? 0) + t.amount);
      }
    }
  }
  const revenueByTurma = Array.from(turmaTotals.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const accountTotals = new Map<string, number>();
  for (const t of [...paidInflows, ...outflows.filter((x) => x.status === "paid")]) {
    const acc = t.account?.trim() || "—";
    accountTotals.set(acc, (accountTotals.get(acc) ?? 0) + t.amount);
  }
  const byAccount = Array.from(accountTotals.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const lastTwoMonths = cashFlow.slice(-2);
  let growth = 0;
  if (lastTwoMonths.length === 2) {
    const a = lastTwoMonths[0];
    const b = lastTwoMonths[1];
    const netA = a.inflow - a.outflow;
    const netB = b.inflow - b.outflow;
    if (netA !== 0) growth = Math.round(((netB - netA) / Math.abs(netA)) * 1000) / 10;
    else if (netB !== 0) growth = 100;
  }

  const todayD = now.getDate();
  const fixedDueSoon = fixedBills.filter(
    (f) => f.active && f.dueDay >= todayD && f.dueDay <= Math.min(todayD + 7, 31),
  ).length;

  return NextResponse.json({
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      growth,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      expensesThisMonth: Math.round(expensesThisMonth * 100) / 100,
      marginMonth:
        revenueThisMonth > 0
          ? Math.round(((revenueThisMonth - expensesThisMonth) / revenueThisMonth) * 1000) / 10
          : 0,
      activeStudents,
      pendingInflowCount: pendingInflows.length,
      pendingInflowSum: Math.round(pendingInflowSum * 100) / 100,
      outPendingCount: outPending.length,
      outPendingSum: Math.round(outPendingSum * 100) / 100,
      reconcilePending: reconcileQueue,
      fixedBillsActive: fixedBills.length,
      fixedDueSoon,
    },
    cashFlow,
    expensesByCategory,
    revenueByCategory,
    revenueByTurma,
    byAccount,
  });
}
