import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const createSchema = z.object({
  description: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  account: z.string().optional().nullable(),
  dueDay: z.number().int().min(1).max(31),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  notes: z.string().optional().nullable(),
  active: z.boolean().optional(),
  slug: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const items = await prisma.fixedBill.findMany({
    orderBy: { dueDay: "asc" },
  });

  return NextResponse.json({ items });
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

  const row = await prisma.fixedBill.create({
    data: {
      description: parsed.data.description.trim(),
      category: parsed.data.category.trim(),
      amount: parsed.data.amount,
      account: parsed.data.account?.trim() || null,
      dueDay: parsed.data.dueDay,
      priority: parsed.data.priority ?? "medium",
      notes: parsed.data.notes?.trim() || null,
      active: parsed.data.active ?? true,
      slug: parsed.data.slug?.trim() || null,
    },
  });

  return NextResponse.json({ item: row });
}
