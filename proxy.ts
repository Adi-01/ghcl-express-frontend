import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_NAME } from "@/lib/constants";
import { decryptSessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_NAME)?.value;

  const isLoginPage = pathname === "/login" || pathname === "/";
  const isApiRoute = pathname.startsWith("/api");
  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".");

  if (isStaticFile || isApiRoute) {
    return NextResponse.next();
  }

  const hasAuthError = request.nextUrl.searchParams.has("error");

  // If user is on login page with an error query param (e.g. session_expired, account_blocked),
  // preserve the view and purge any stale session cookie.
  if (isLoginPage && hasAuthError) {
    const response = NextResponse.next();
    if (token) {
      response.cookies.delete(TOKEN_NAME);
    }
    return response;
  }

  // 1. Unauthenticated user attempting to access protected route -> Redirect to /login
  if (!token) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // 2. Authenticated user with token
  const session = await decryptSessionToken(token);

  // If token is invalid or unparseable, clear cookie and redirect to /login
  if (!session) {
    if (isLoginPage) {
      const response = NextResponse.next();
      response.cookies.delete(TOKEN_NAME);
      return response;
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "session_expired");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(TOKEN_NAME);
    return response;
  }

  // 3. Authenticated user visiting /login or root / -> Redirect to appropriate home
  if (isLoginPage) {
    const destination = session.is_admin ? "/admin/users" : "/profile";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 4. Role Guard: Non-admin trying to access /admin routes
  if (pathname.startsWith("/admin") && !session.is_admin) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

