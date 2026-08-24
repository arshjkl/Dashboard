import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE =
  "bgmi_session";

export function middleware(
  request: NextRequest
) {
  const { pathname } =
    request.nextUrl;

  const session =
    request.cookies.get(
      SESSION_COOKIE
    )?.value;

  /*
   * Dashboard requires authentication.
   */
  const isProtectedRoute =
    pathname.startsWith(
      "/dashboard"
    );

  /*
   * Login and registration are public.
   *
   * We intentionally do NOT redirect
   * authenticated users away from these
   * pages here.
   *
   * The actual page can decide what to do.
   */
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register";

  /*
   * Unauthenticated user trying to access
   * dashboard.
   */
  if (
    isProtectedRoute &&
    !session
  ) {
    const loginUrl =
      new URL(
        "/login",
        request.url
      );

    loginUrl.searchParams.set(
      "next",
      pathname
    );

    return NextResponse.redirect(
      loginUrl
    );
  }

  /*
   * Authentication routes remain accessible
   * regardless of whether a session cookie
   * exists.
   */
  if (isAuthRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
  ],
};