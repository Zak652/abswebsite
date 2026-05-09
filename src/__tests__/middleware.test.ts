/**
 * @vitest-environment node
 *
 * Tests for src/proxy.ts auth gating + path-traversal guard (§ 2.6, § 2.4.5).
 * Note: Next.js 16 renamed middleware.ts → proxy.ts; logic is the same.
 *
 * Runs under the node environment because jose's WebCrypto path is unreliable
 * inside jsdom (jose ships separate node and webapi builds; jsdom advertises a
 * subset of WebCrypto that hangs on jose's HS256 verify).
 */
import { createHmac } from "node:crypto";
import { describe, it, expect, beforeAll } from "vitest";
import type { NextRequest } from "next/server";

import { proxy as middleware } from "@/proxy";

const SECRET = "test-jwt-secret-32-chars-minimum-for-hs256";

beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
});

function b64url(input: Buffer | string): string {
    return Buffer.from(input)
        .toString("base64")
        .replace(/=+$/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function makeSessionJwt(role: "admin" | "client"): string {
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = b64url(
        JSON.stringify({ user_id: "u1", role, exp: now + 3600 }),
    );
    const data = `${header}.${payload}`;
    const sig = createHmac("sha256", SECRET).update(data).digest();
    return `${data}.${b64url(sig)}`;
}

function makeRequest(path: string, search: string = "", cookie?: string): NextRequest {
    return {
        nextUrl: {
            pathname: path,
            search,
            clone: () => {
                // jest/vitest URL is fine for the redirect rewrite below.
                const u = new URL(`http://localhost:3001${path}${search}`);
                u.pathname = path;
                u.search = search;
                return u;
            },
        },
        cookies: {
            get: (name: string) =>
                cookie && name === "abs_session" ? { value: cookie } : undefined,
        },
        headers: new Map(),
    } as unknown as NextRequest;
}

describe("middleware", () => {
    it("redirects unauthenticated users from /admin-portal to /auth/login", async () => {
        const res = await middleware(makeRequest("/admin-portal/cms"));
        expect([302, 307, 308]).toContain(res.status);
        expect(res.headers.get("location")).toContain("/auth/login");
        expect(res.headers.get("location")).toContain("next=%2Fadmin-portal%2Fcms");
    });

    it("returns 403 for authenticated non-admin on /admin-portal", async () => {
        const res = await middleware(
            makeRequest("/admin-portal/cms", "", makeSessionJwt("client")),
        );
        expect(res.status).toBe(403);
    });

    it("allows authenticated admin on /admin-portal", async () => {
        const res = await middleware(
            makeRequest("/admin-portal/cms", "", makeSessionJwt("admin")),
        );
        expect(res.status).toBe(200);
    });

    it("redirects unauthenticated users from /portal to /auth/login", async () => {
        const res = await middleware(makeRequest("/portal/account"));
        expect([302, 307, 308]).toContain(res.status);
        expect(res.headers.get("location")).toContain("/auth/login");
    });

    it("allows authenticated user on /portal regardless of role", async () => {
        const res = await middleware(
            makeRequest("/portal/account", "", makeSessionJwt("client")),
        );
        expect(res.status).toBe(200);
    });

    it("rejects path traversal in /media/*", async () => {
        const res = await middleware(makeRequest("/media/../../etc/passwd"));
        expect(res.status).toBe(400);
    });

    it("rejects encoded path traversal", async () => {
        const res = await middleware(makeRequest("/media/foo/%2e%2e/bar"));
        expect(res.status).toBe(400);
    });
});
