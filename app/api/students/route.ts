import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { TURMAS } from "@/lib/orgConstants";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  turma1: z.string().optional().nullable(),
  turma2: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  pixMatchNames: z.string().optional().nullable(),
  paysOutside: z.boolean().optional(),
  outsideNote: z.string().optional().nullable(),
  scholarship: z.boolean().optional(),
  active: z.boolean().optional(),
});

function validTurma(t: string | null | undefined) {
  if (!t || t === "") return null;
  return (TURMAS as readonly string[]).includes(t) ? t : null;
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const items = await prisma.student.findMany({
    orderBy: { name: "asc" },
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

  let t1 = validTurma(parsed.data.turma1 ?? undefined);
  let t2 = validTurma(parsed.data.turma2 ?? undefined);
  if (t1 && t2 && t1 === t2) t2 = null;

  const emailRaw = parsed.data.email?.trim() || null;
  const email =
    emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : null;

  const row = await prisma.student.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      phone: parsed.data.phone?.trim() || null,
      turma1: t1,
      turma2: t2,
      notes: parsed.data.notes?.trim() || null,
      pixMatchNames: parsed.data.pixMatchNames?.trim() || null,
      paysOutside: parsed.data.paysOutside ?? false,
      outsideNote: parsed.data.outsideNote?.trim() || null,
      scholarship: parsed.data.scholarship ?? false,
      active: parsed.data.active ?? true,
    },
  });

  return NextResponse.json({ item: row });
}
