import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sign } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ success: false, error: "Credenciais inválidas" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ success: false, error: "Credenciais inválidas" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return NextResponse.json({ success: false, error: "Credenciais inválidas" }, { status: 401 });
  }

  const token = await sign({ email: user.email, role: "admin", sub: user.id });

  const response = NextResponse.json({ success: true });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
