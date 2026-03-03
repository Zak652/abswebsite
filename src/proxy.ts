import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_ROUTES = ["/portal", "/admin-portal"];
const ADMIN_ROUTES = ["/admin-portal"];
const AUTH_ROUTES = ["/auth/login", "/auth/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  const sessionCookie = request.cookies.get("abs_session");

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate admin role for admin-portal routes
  if (isAdminRoute && sessionCookie) {
    const jwtSecret =
      process.env.JWT_SECRET ?? process.env.DJANGO_SECRET_KEY ?? "";
    if (jwtSecret) {
      try {
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(sessionCookie.value, secret);
        if (payload.role !== "admin") {
          return NextResponse.redirect(new URL("/portal", request.url));
        }
      } catch {
        // Invalid/expired session cookie — clear it and redirect to login
        const response = NextResponse.redirect(
          new URL("/auth/login", request.url)
        );
        response.cookies.delete("abs_session");
        return response;
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/admin-portal/:path*", "/auth/:path*"],
};
