/**
 * Tests for the on-demand ISR revalidation API route.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

// Mock next/cache revalidateTag
const mockRevalidateTag = vi.fn();
vi.mock("next/cache", () => ({
    revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}));

// Mock NextResponse
vi.mock("next/server", () => ({
    NextRequest: class { },
    NextResponse: {
        json: (data: unknown, init?: { status?: number }) => ({
            data,
            status: init?.status ?? 200,
        }),
    },
}));

// Helper to create mock requests
let _ipCounter = 0;
function createMockRequest(body: unknown) {
    // Each test gets a fresh "IP" so the per-IP rate limiter doesn't leak
    // state across tests in the same file.
    const ip = `10.0.0.${++_ipCounter}`;
    const headers = new Map<string, string>([["x-forwarded-for", ip]]);
    return {
        json: async () => body,
        headers: { get: (k: string) => headers.get(k.toLowerCase()) ?? null },
    } as never;
}

// Set env var BEFORE dynamic import so the module captures it
let POST: (req: unknown) => Promise<{ status: number; data: unknown }>;

beforeAll(async () => {
    process.env.REVALIDATION_SECRET = "test-secret-123";
    const mod = await import("@/app/api/revalidate/route");
    POST = mod.POST as typeof POST;
});

beforeEach(() => {
    mockRevalidateTag.mockReset();
});

describe("POST /api/revalidate", () => {
    it("returns 401 when secret is missing", async () => {
        const req = createMockRequest({ tags: ["cms-home"] });
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it("returns 401 when secret is wrong", async () => {
        const req = createMockRequest({ secret: "wrong", tags: ["cms-home"] });
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it("returns 400 when tags array is missing", async () => {
        const req = createMockRequest({ secret: "test-secret-123" });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it("returns 400 when tags is empty array", async () => {
        const req = createMockRequest({ secret: "test-secret-123", tags: [] });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it("revalidates each tag and returns success", async () => {
        const req = createMockRequest({
            secret: "test-secret-123",
            tags: ["cms-home", "cms-hero"],
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(res.data).toEqual({ revalidated: true, tags: ["cms-home", "cms-hero"] });

        expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
        expect(mockRevalidateTag).toHaveBeenCalledWith("cms-home", "default");
        expect(mockRevalidateTag).toHaveBeenCalledWith("cms-hero", "default");
    });
});
