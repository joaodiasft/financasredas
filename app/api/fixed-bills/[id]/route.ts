import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const patchSchema = z.object({
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  account: z.string().optional().nullable(),
  dueDay: z.number().int().min(1).max(31).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  notes: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const u = parsed.data;
  try {
    const row = await prisma.fixedBill.update({
      where: { id: params.id },
      data: {
        ...(u.description !== undefined ? { description: u.description.trim() } : {}),
        ...(u.category !== undefined ? { category: u.category.trim() } : {}),
        ...(u.amount !== undefined ? { amount: u.amount } : {}),
        ...(u.account !== undefined ? { account: u.account?.trim() || null } : {}),
        ...(u.dueDay !== undefined ? { dueDay: u.dueDay } : {}),
        ...(u.priority !== undefined ? { priority: u.priority } : {}),
        ...(u.notes !== undefined ? { notes: u.notes?.trim() || null } : {}),
        ...(u.active !== undefined ? { active: u.active } : {}),
      },
    });
    return NextResponse.json({ item: row });
  } catch {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await prisma.fixedBill.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
