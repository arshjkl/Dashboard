import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "bgmi_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = request.cookies.get(
    SESSION_COOKIE
  )?.value;

  /*
   * ROOT
   *
   * Unauthenticated:
   *   / → /login
   *
   * Authenticated:
   *   / → /dashboard
   */
  if (pathname === "/") {
    if (session) {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  /*
   * Protected routes.
   */
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/team") ||
    pathname.startsWith("/player") ||
    pathname.startsWith("/tournaments") ||
    pathname.startsWith("/chats") ||
    pathname.startsWith("/comms");

  /*
   * Public authentication routes.
   */
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register/");

  /*
   * Unauthenticated user trying to access
   * a protected page.
   */
  if (isProtectedRoute && !session) {
    const loginUrl = new URL(
      "/login",
      request.url
    );

    loginUrl.searchParams.set(
      "next",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  /*
   * Login/register remain accessible.
   */
  if (isAuthRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/team/:path*",
    "/player/:path*",
    "/tournaments/:path*",
    "/chats/:path*",
    "/comms/:path*",
    "/login",
    "/register",
    "/register/:path*",
  ],
};