/**
 * Auth store: ensure refresh token never lands in storage (§ 2.2.2).
 */
import { describe, it, expect, beforeEach } from "vitest";

describe("auth store", () => {
    beforeEach(() => {
        // Clear sessionStorage between tests so persisted state doesn't leak.
        if (typeof window !== "undefined") {
            window.sessionStorage.clear();
        }
    });

    it("does not expose a refreshToken field", async () => {
        const { useAuthStore } = await import("@/lib/store/authStore");
        const state = useAuthStore.getState();
        expect("refreshToken" in state).toBe(false);
    });

    it("setAccessToken flips isAuthenticated", async () => {
        const { useAuthStore } = await import("@/lib/store/authStore");
        useAuthStore.getState().setAccessToken("abc.def.ghi");
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().accessToken).toBe("abc.def.ghi");
    });

    it("logout clears access token and isAuthenticated", async () => {
        const { useAuthStore } = await import("@/lib/store/authStore");
        useAuthStore.getState().setAccessToken("abc.def.ghi");
        useAuthStore.getState().logout();
        const state = useAuthStore.getState();
        expect(state.accessToken).toBeNull();
        expect(state.isAuthenticated).toBe(false);
    });

    it("partialize never persists the access token to sessionStorage", async () => {
        const { useAuthStore } = await import("@/lib/store/authStore");
        useAuthStore.getState().setAccessToken("must-not-persist");
        useAuthStore.getState().setUser({
            id: "u1",
            email: "x@x.com",
            full_name: "X",
            company_name: "Co",
            role: "client",
            created_at: new Date().toISOString(),
        });
        const raw = window.sessionStorage.getItem("abs-auth") ?? "";
        expect(raw).not.toContain("must-not-persist");
        expect(raw).not.toContain("refreshToken");
    });
});
