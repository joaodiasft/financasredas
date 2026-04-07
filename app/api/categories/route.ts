import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") as "inflow" | "outflow" | null;

  const where =
    kind === "inflow"
      ? { OR: [{ kind: "inflow" }, { kind: "both" }] }
      : kind === "outflow"
        ? { OR: [{ kind: "outflow" }, { kind: "both" }] }
        : {};

  const items = await prisma.category.findMany({
    where,
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ items });
}
