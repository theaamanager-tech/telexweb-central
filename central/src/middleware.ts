import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get("telex_auth")?.value

  // Allow access to login page, API auth, and static assets
  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname.startsWith("/api/") ||
    request.nextUrl.pathname.startsWith("/_next/") ||
    request.nextUrl.pathname === "/favicon.ico" ||
    request.nextUrl.pathname.startsWith("/logo") ||
    request.nextUrl.pathname.startsWith("/opengraph")
  ) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (authCookie !== "true") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
