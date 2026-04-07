import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  studentCount: z.number().int().min(0).optional(),
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

  try {
    const row = await prisma.group.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.studentCount !== undefined ? { studentCount: parsed.data.studentCount } : {}),
      },
    });
    return NextResponse.json({ item: row });
  } catch {
    return NextResponse.json({ error: "Não encontrado ou nome duplicado" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await prisma.group.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
