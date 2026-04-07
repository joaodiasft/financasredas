import { cookies } from "next/headers";
import { verify } from "@/lib/auth";

export type SessionUser = { email: string; role?: string };

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get("session")?.value;
  if (!token) return null;
  try {
    const payload = await verify(token);
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!email) return null;
    return { email, role: typeof payload.role === "string" ? payload.role : undefined };
  } catch {
    return null;
  }
}
