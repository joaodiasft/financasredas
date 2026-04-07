import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

function monthBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let target = new Date();
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body.month === "string" && /^\d{4}-\d{2}$/.test(body.month)) {
      const [y, m] = body.month.split("-").map(Number);
      target = new Date(y, m - 1, 1);
    }
  } catch {
    /* use now */
  }

  const bill = await prisma.fixedBill.findUnique({ where: { id: params.id } });
  if (!bill || !bill.active) {
    return NextResponse.json({ error: "Conta fixa não encontrada ou inativa" }, { status: 404 });
  }

  const { start, end } = monthBounds(target);
  const existing = await prisma.transaction.findFirst({
    where: {
      type: "outflow",
      fixedBillId: bill.id,
      date: { gte: start, lte: end },
    },
  });

  if (existing) {
    return NextResponse.json({ item: existing, alreadyExists: true });
  }

  const safeDay = Math.min(bill.dueDay, 28);
  const date = new Date(target.getFullYear(), target.getMonth(), safeDay, 12, 0, 0, 0);

  const row = await prisma.transaction.create({
    data: {
      date,
      description: `${bill.description} (fixo)`,
      category: bill.category,
      amount: bill.amount,
      type: "outflow",
      status: "pending",
      account: bill.account,
      priority: bill.priority,
      fixedBillId: bill.id,
    },
  });

  return NextResponse.json({ item: row, alreadyExists: false });
}
