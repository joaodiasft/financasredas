import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { TURMAS } from "@/lib/orgConstants";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
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
  let t1 = u.turma1 !== undefined ? validTurma(u.turma1) : undefined;
  let t2 = u.turma2 !== undefined ? validTurma(u.turma2) : undefined;
  if (t1 !== undefined && t2 !== undefined && t1 && t2 && t1 === t2) t2 = null;

  try {
    const row = await prisma.student.update({
      where: { id: params.id },
      data: {
        ...(u.name !== undefined ? { name: u.name.trim() } : {}),
        ...(u.email !== undefined
          ? {
              email: (() => {
                const t = u.email?.trim() || null;
                return t && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : null;
              })(),
            }
          : {}),
        ...(u.phone !== undefined ? { phone: u.phone?.trim() || null } : {}),
        ...(t1 !== undefined ? { turma1: t1 } : {}),
        ...(t2 !== undefined ? { turma2: t2 } : {}),
        ...(u.notes !== undefined ? { notes: u.notes?.trim() || null } : {}),
        ...(u.pixMatchNames !== undefined ? { pixMatchNames: u.pixMatchNames?.trim() || null } : {}),
        ...(u.paysOutside !== undefined ? { paysOutside: u.paysOutside } : {}),
        ...(u.outsideNote !== undefined ? { outsideNote: u.outsideNote?.trim() || null } : {}),
        ...(u.scholarship !== undefined ? { scholarship: u.scholarship } : {}),
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
    await prisma.student.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
