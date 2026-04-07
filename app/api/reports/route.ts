import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { TURMAS } from "@/lib/orgConstants";

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

  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [txs, students] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: since } },
      orderBy: { date: "asc" },
      include: { student: { select: { id: true, name: true } } },
    }),
    prisma.student.findMany({ where: { active: true }, select: { id: true, name: true } }),
  ]);

  const paidIn = txs.filter((t) => t.type === "inflow" && t.status === "paid");
  const pendingIn = txs.filter((t) => t.type === "inflow" && t.status === "pending");

  const now = new Date();

  const byMonth = new Map<string, { in: number; out: number }>();
  for (const t of txs) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!byMonth.has(key)) {
      byMonth.set(key, { in: 0, out: 0 });
    }
    const b = byMonth.get(key)!;
    if (t.type === "inflow" && t.status === "paid") b.in += t.amount;
    if (t.type === "outflow" && t.status === "paid") b.out += t.amount;
  }

  /** 12 meses corridos com linha mesmo sem movimento (evita “sumir” mês no relatório). */
  const monthlyTable: { month: string; receita: number; despesa: number; saldo: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const b = byMonth.get(key);
    const receita = b?.in ?? 0;
    const despesa = b?.out ?? 0;
    monthlyTable.push({
      month: `${MONTHS_PT[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`,
      receita: Math.round(receita * 100) / 100,
      despesa: Math.round(despesa * 100) / 100,
      saldo: Math.round((receita - despesa) * 100) / 100,
    });
  }

  const revCat = new Map<string, number>();
  for (const t of paidIn) {
    revCat.set(t.category, (revCat.get(t.category) ?? 0) + t.amount);
  }
  const revenueByCategory = Array.from(revCat.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  const expCat = new Map<string, number>();
  for (const t of txs.filter((x) => x.type === "outflow" && x.status === "paid")) {
    expCat.set(t.category, (expCat.get(t.category) ?? 0) + t.amount);
  }
  const expenseByCategory = Array.from(expCat.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  const turmaMap = new Map<string, number>();
  for (const t of paidIn) {
    const tags = parseTurmas(t.turmas);
    const use = tags.length ? tags : t.group ? [t.group] : [];
    for (const tag of use) {
      if ((TURMAS as readonly string[]).includes(tag)) {
        turmaMap.set(tag, (turmaMap.get(tag) ?? 0) + t.amount);
      }
    }
  }
  const byTurma = Array.from(turmaMap.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  const accMap = new Map<string, { in: number; out: number }>();
  for (const t of txs) {
    const a = t.account?.trim() || "—";
    if (!accMap.has(a)) accMap.set(a, { in: 0, out: 0 });
    const z = accMap.get(a)!;
    if (t.type === "inflow" && t.status === "paid") z.in += t.amount;
    if (t.type === "outflow" && t.status === "paid") z.out += t.amount;
  }
  const byAccount = Array.from(accMap.entries())
    .map(([name, v]) => ({
      name,
      entradas: Math.round(v.in * 100) / 100,
      saidas: Math.round(v.out * 100) / 100,
      liquido: Math.round((v.in - v.out) * 100) / 100,
    }))
    .sort((a, b) => b.liquido - a.liquido);

  const studentDebt = new Map<string, { name: string; total: number; count: number }>();
  for (const t of pendingIn) {
    if (!t.studentId || !t.student) continue;
    const cur = studentDebt.get(t.studentId) ?? { name: t.student.name, total: 0, count: 0 };
    cur.total += t.amount;
    cur.count += 1;
    studentDebt.set(t.studentId, cur);
  }
  const pendingByStudent = Array.from(studentDebt.values())
    .map((v) => ({ ...v, total: Math.round(v.total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);

  const ticketNumerator = paidIn.reduce((s, t) => s + t.amount, 0);
  const ticketDenom = paidIn.length || 1;
  const ticketMedio = Math.round((ticketNumerator / ticketDenom) * 100) / 100;

  const prevSince = new Date(since);
  prevSince.setMonth(prevSince.getMonth() - 6);
  const prevIn = txs.filter(
    (t) => t.type === "inflow" && t.status === "paid" && t.date >= prevSince && t.date < since,
  );
  const prevTicket = prevIn.length ? prevIn.reduce((s, t) => s + t.amount, 0) / prevIn.length : ticketMedio;
  const ticketDelta = prevTicket > 0 ? Math.round(((ticketMedio - prevTicket) / prevTicket) * 1000) / 10 : 0;

  const chart = monthlyTable.map((m) => ({ name: m.month, value: m.receita }));

  return NextResponse.json({
    chart,
    monthlyTable,
    revenueByCategory,
    expenseByCategory,
    byTurma,
    byAccount,
    pendingByStudent,
    ticketMedio,
    ticketDelta,
    totalStudents: students.length,
    pendingInflowCount: pendingIn.length,
    pendingInflowSum: Math.round(pendingIn.reduce((s, t) => s + t.amount, 0) * 100) / 100,
    needsReconcileCount: txs.filter((t) => t.needsReconcile).length,
  });
}
