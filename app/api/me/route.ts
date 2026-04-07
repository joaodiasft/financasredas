import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email },
    select: { email: true, name: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  return NextResponse.json({
    email: user.email,
    name: user.name,
  });
}
