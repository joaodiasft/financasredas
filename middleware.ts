import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  // Paths that don't require authentication
  const isPublicPath = request.nextUrl.pathname === "/login";

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token) {
    try {
      await verify(token);
      if (isPublicPath) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      if (!isPublicPath) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("session");
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
