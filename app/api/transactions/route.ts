import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
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

function parseTurmaAmountsField(raw: unknown): Record<string, number> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

const createSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(["inflow", "outflow"]),
  status: z.enum(["paid", "pending", "overdue"]).optional(),
  account: z.string().optional().nullable(),
  group: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().nullable(),
  studentId: z.string().optional().nullable(),
  turmas: z.array(z.string()).max(2).optional(),
  needsReconcile: z.boolean().optional(),
  fixedBillId: z.string().optional().nullable(),
});

function normalizeTurmas(arr: string[] | undefined) {
  if (!arr?.length) return { json: null as string | null, primary: null as string | null };
  const valid = (TURMAS as readonly string[]).filter((t) => arr.includes(t));
  const uniq = Array.from(new Set(valid)).slice(0, 2);
  return {
    json: uniq.length ? JSON.stringify(uniq) : null,
    primary: uniq[0] ?? null,
  };
}

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as "inflow" | "outflow" | null;
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";
  const groupName = searchParams.get("group")?.trim() ?? "";

  const where: Prisma.TransactionWhereInput = {};
  if (type === "inflow" || type === "outflow") where.type = type;
  if (category) where.category = category;

  const andParts: Prisma.TransactionWhereInput[] = [];
  if (groupName && type === "inflow") {
    andParts.push({
      OR: [
        { group: groupName },
        { turmas: { contains: `"${groupName}"` } },
      ],
    });
  }
  if (q) {
    andParts.push({
      OR: [{ description: { contains: q } }, { category: { contains: q } }],
    });
  }
  if (andParts.length) {
    where.AND = andParts;
  }

  const rows = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: { student: { select: { id: true, name: true } } },
  });

  const items = rows.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    description: t.description,
    category: t.category,
    amount: t.amount,
    type: t.type,
    status: t.status,
    account: t.account,
    group: t.group,
    priority: t.priority,
    studentId: t.studentId,
    studentName: t.student?.name ?? null,
    turmas: parseTurmasJson(t.turmas),
    turmaAmounts: parseTurmaAmountsField(t.turmaAmounts),
    needsReconcile: t.needsReconcile,
    fixedBillId: t.fixedBillId,
  }));

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
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const status = data.status ?? "pending";
  const priority = data.type === "outflow" ? data.priority ?? "medium" : data.priority ?? null;

  const { json: turmasJson, primary: turmaPrimary } = normalizeTurmas(data.turmas);
  const groupVal = data.group ?? turmaPrimary;

  if (data.studentId) {
    const st = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!st) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 400 });
    }
  }

  const row = await prisma.transaction.create({
    data: {
      date: new Date(data.date),
      description: data.description,
      category: data.category,
      amount: data.amount,
      type: data.type,
      status,
      account: data.account ?? null,
      group: groupVal,
      priority,
      studentId: data.studentId ?? null,
      turmas: turmasJson,
      needsReconcile: data.needsReconcile ?? false,
      fixedBillId: data.fixedBillId ?? null,
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
      needsReconcile: row.needsReconcile,
    },
  });
}
