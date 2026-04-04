import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Protege rotas admin
  if (url.pathname.startsWith("/admin")) {
    const hasSession =
      req.cookies.get("sb-access-token") ||
      req.cookies.get("supabase-auth-token");

    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};