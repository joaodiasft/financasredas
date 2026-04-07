import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { TURMAS } from "@/lib/orgConstants";

function parseTurmasJson(s: string | null): string[] {
  if (!s) return [];
  try {
    const x = JSON.parse(s) as unknown;
    return Array.isArray(x) ? x.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

function parseTurmaAmountsOut(raw: unknown): Record<string, number> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

const patchSchema = z.object({
  date: z.string().optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  status: z.enum(["paid", "pending", "overdue"]).optional(),
  account: z.string().optional().nullable(),
  group: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().nullable(),
  studentId: z.string().optional().nullable(),
  turmas: z.array(z.string()).max(2).optional(),
  turmaAmounts: z.record(z.number().positive()).optional().nullable(),
  needsReconcile: z.boolean().optional(),
});

function normalizeTurmas(arr: string[] | undefined) {
  if (arr === undefined) return undefined;
  const valid = (TURMAS as readonly string[]).filter((t) => arr.includes(t));
  const uniq = Array.from(new Set(valid)).slice(0, 2);
  return {
    json: uniq.length ? JSON.stringify(uniq) : null,
    primary: uniq[0] ?? null,
  };
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

  const existing = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const u = parsed.data;
  const turmaNorm = u.turmas !== undefined ? normalizeTurmas(u.turmas) : undefined;

  let turmaAmountsJson: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined;
  if (u.turmaAmounts !== undefined) {
    if (u.turmaAmounts === null) {
      turmaAmountsJson = Prisma.JsonNull;
    } else {
      const allowed = new Set(TURMAS as readonly string[]);
      const rawKeys = Object.keys(u.turmaAmounts);
      const entries = Object.entries(u.turmaAmounts).filter(([k]) => allowed.has(k));
      if (rawKeys.length > 0 && entries.length === 0) {
        return NextResponse.json({ error: "Turmas inválidas em turmaAmounts." }, { status: 400 });
      }
      const sum = entries.reduce((s, [, v]) => s + v, 0);
      const target = u.amount ?? existing.amount;
      if (entries.length && Math.abs(sum - target) > 0.02) {
        return NextResponse.json(
          { error: `Soma das turmas (${sum.toFixed(2)}) deve bater com o valor do PIX (${target.toFixed(2)}).` },
          { status: 400 },
        );
      }
      turmaAmountsJson =
        entries.length > 0 ? (Object.fromEntries(entries) as Prisma.InputJsonValue) : Prisma.JsonNull;
    }
  }

  if (u.studentId !== undefined && u.studentId !== null) {
    const st = await prisma.student.findUnique({ where: { id: u.studentId } });
    if (!st) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 400 });
    }
  }

  const row = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      ...(u.date ? { date: new Date(u.date) } : {}),
      ...(u.description !== undefined ? { description: u.description } : {}),
      ...(u.category !== undefined ? { category: u.category } : {}),
      ...(u.amount !== undefined ? { amount: u.amount } : {}),
      ...(u.status !== undefined ? { status: u.status } : {}),
      ...(u.account !== undefined ? { account: u.account } : {}),
      ...(u.group !== undefined ? { group: u.group } : {}),
      ...(u.priority !== undefined ? { priority: u.priority } : {}),
      ...(u.studentId !== undefined ? { studentId: u.studentId } : {}),
      ...(turmaNorm
        ? { turmas: turmaNorm.json, group: turmaNorm.primary }
        : {}),
      ...(turmaAmountsJson !== undefined ? { turmaAmounts: turmaAmountsJson } : {}),
      ...(u.needsReconcile !== undefined ? { needsReconcile: u.needsReconcile } : {}),
    },
    include: { student: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    item: {
      id: row.id,
      date: row.date.toISOString(),
      description: row.description,
      category: row.category,
      amount: row.amount,
      type: row.type,
      status: row.status,
      account: row.account,
      group: row.group,
      studentId: row.studentId,
      studentName: row.student?.name ?? null,
      turmas: parseTurmasJson(row.turmas),
      turmaAmounts: parseTurmaAmountsOut(row.turmaAmounts),
      needsReconcile: row.needsReconcile,
    },
  });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await prisma.transaction.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
