import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "abs_session";
const SUSPICIOUS_PATH_TOKENS = [
  "..",
  "%2e%2e",
  "%2E%2E",
  "%252e%252e",
  "\0",
  "%00",
];

interface SessionPayload {
  user_id: string;
  role: "client" | "admin" | string;
  exp: number;
}

async function verifySession(token: string): Promise<SessionPayload | null> {
  // Read JWT_SECRET on every call so tests (and dev hot-reload) can override
  // it without re-importing the module.
  const secret = process.env.JWT_SECRET ?? "";
  if (!token || !secret) return null;
  const encodedSecret = new TextEncoder().encode(secret);
  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ["HS256"],
    });
    if (typeof payload.user_id !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

function rejectPathTraversal(req: NextRequest): NextResponse | null {
  const raw = req.nextUrl.pathname + req.nextUrl.search;
  for (const token of SUSPICIOUS_PATH_TOKENS) {
    if (raw.includes(token)) {
      return new NextResponse("Bad Request", { status: 400 });
    }
  }
  return null;
}

function loginRedirect(req: NextRequest, next: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/auth/login";
  // Only echo back internal paths so we don't introduce an open-redirect.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  url.search = `?next=${encodeURIComponent(safeNext)}`;
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest) {
  const traversal = rejectPathTraversal(req);
  if (traversal) return traversal;

  const path = req.nextUrl.pathname;
  const session = req.cookies.get(SESSION_COOKIE)?.value ?? "";
  const payload = await verifySession(session);

  // Send already-authenticated users away from /auth/login and /auth/register
  // — they have no business there, and it's a small UX win.
  if (
    payload &&
    (path.startsWith("/auth/login") || path.startsWith("/auth/register"))
  ) {
    const dest = req.nextUrl.clone();
    dest.pathname = payload.role === "admin" ? "/admin-portal" : "/portal";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  if (path.startsWith("/admin-portal")) {
    if (!payload) {
      return loginRedirect(req, path + req.nextUrl.search);
    }
    if (payload.role !== "admin") {
      return new NextResponse(
        JSON.stringify({ detail: "Forbidden" }),
        { status: 403, headers: { "content-type": "application/json" } },
      );
    }
    return NextResponse.next();
  }

  if (path.startsWith("/portal")) {
    if (!payload) {
      return loginRedirect(req, path + req.nextUrl.search);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin-portal/:path*",
    "/portal/:path*",
    "/auth/login",
    "/auth/register",
    // Run on /media/* too so the path-traversal check can reject before the
    // rewrite reaches the backend (§ 2.4.5).
    "/media/:path*",
  ],
};
