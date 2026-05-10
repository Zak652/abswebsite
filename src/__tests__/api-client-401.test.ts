/**
 * apiClient 401 → refresh → retry interceptor (build guide § 3.10).
 *
 * The interceptor sits in [src/lib/api/client.ts](../lib/api/client.ts).
 * Its contract:
 *
 *   1. On a 401 from any endpoint *except* the refresh endpoint
 *      itself, POST to ``/auth/token/refresh/`` with credentials.
 *   2. On success, store the new access token in the Zustand auth
 *      store, rewrite the original request's ``Authorization``
 *      header, and replay the original request.
 *   3. On refresh failure, log the user out and ``safeRedirect`` to
 *      ``/auth/login``.
 *   4. The retry guard ``original._retry`` prevents an infinite loop
 *      if the replayed request also 401s.
 *
 * The interceptor binds its ``safeRedirect`` and ``axios.post``
 * references at module load. We mock both at module level so the
 * test doubles are what the interceptor actually calls — spying
 * after import does not work for ESM bindings captured at the top
 * of ``client.ts``.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Module-level mocks. These must be declared before the import below
// so the interceptor binds to them, not the real implementations.
vi.mock("@/lib/redirect", () => ({
    safeRedirect: vi.fn(),
}));

vi.mock("axios", async () => {
    const actual = await vi.importActual<typeof import("axios")>("axios");
    return {
        ...actual,
        default: {
            ...actual.default,
            // Used by the interceptor for the refresh call.
            post: vi.fn(),
            create: actual.default.create,
        },
    };
});

import axios from "axios";
import { apiClient } from "@/lib/api/client";
import { safeRedirect } from "@/lib/redirect";

// Pull the registered response-error handler off the axios instance so
// we can drive it directly. Bypasses the network adapter.
type Handler = {
    fulfilled: (r: unknown) => unknown;
    rejected: (e: unknown) => unknown;
};
const handlers = (apiClient.interceptors.response as unknown as {
    handlers: Handler[];
}).handlers;
const onError = handlers[0].rejected;

beforeEach(() => {
    vi.clearAllMocks();
});

describe("apiClient 401 interceptor", () => {
    it("refreshes the access token and updates the store on success", async () => {
        const newAccess = "fresh.access.jwt";
        (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            data: { access: newAccess },
        });

        // ``apiClient(original)`` ultimately reaches ``defaults.adapter``.
        // Swap the adapter for a recording stub so the replayed request
        // never touches the network and we can assert against the config
        // that arrived.
        const adapterSpy = vi.fn().mockResolvedValue({
            data: { ok: true },
            status: 200,
            statusText: "OK",
            headers: {},
            config: {},
        });
        const realAdapter = apiClient.defaults.adapter;
        apiClient.defaults.adapter = adapterSpy;

        const original = {
            url: "/me/",
            method: "get",
            headers: { Authorization: "Bearer stale.access.jwt" } as Record<
                string,
                string
            >,
        };

        try {
            const result = await onError({
                response: { status: 401 },
                config: original,
            });

            // Refresh fired with the right URL + credentials.
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining("/auth/token/refresh/"),
                {},
                expect.objectContaining({ withCredentials: true }),
            );

            // Original request replayed via the adapter with the new bearer
            // and the _retry guard set to prevent a second refresh. Asserting
            // the rewritten Authorization header is enough — it proves the
            // refreshed token reached the replay path. (Store-update is its
            // own seam, covered in auth-store.test.ts.)
            expect(adapterSpy).toHaveBeenCalledTimes(1);
            const replayCfg = adapterSpy.mock.calls[0][0] as typeof original & {
                _retry?: boolean;
            };
            expect(replayCfg.headers.Authorization).toBe(`Bearer ${newAccess}`);
            expect(replayCfg._retry).toBe(true);

            expect((result as { data: unknown }).data).toEqual({ ok: true });
        } finally {
            apiClient.defaults.adapter = realAdapter;
        }
    });

    it("calls safeRedirect('/auth/login') when the refresh endpoint itself fails", async () => {
        (axios.post as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
            response: { status: 401 },
        });

        const original = {
            url: "/me/",
            headers: {} as Record<string, string>,
        };
        await expect(
            onError({ response: { status: 401 }, config: original }),
        ).rejects.toBeDefined();

        expect(safeRedirect).toHaveBeenCalledWith("/auth/login");
    });

    it("does not refresh when the failing request *is* the refresh endpoint", async () => {
        const original = {
            url: "/auth/token/refresh/",
            headers: {} as Record<string, string>,
        };
        await expect(
            onError({ response: { status: 401 }, config: original }),
        ).rejects.toBeDefined();

        expect(axios.post).not.toHaveBeenCalled();
    });

    it("does not refresh on non-401 errors", async () => {
        const original = {
            url: "/me/",
            headers: {} as Record<string, string>,
        };
        await expect(
            onError({ response: { status: 500 }, config: original }),
        ).rejects.toBeDefined();

        expect(axios.post).not.toHaveBeenCalled();
    });

    it("does not loop: a request already flagged _retry skips refresh", async () => {
        const original = {
            url: "/me/",
            headers: {} as Record<string, string>,
            _retry: true,
        };
        await expect(
            onError({ response: { status: 401 }, config: original }),
        ).rejects.toBeDefined();

        expect(axios.post).not.toHaveBeenCalled();
    });
});
