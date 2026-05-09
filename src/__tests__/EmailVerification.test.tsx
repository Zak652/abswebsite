/**
 * Email verification frontend (§ 3.8).
 *
 * Backend coverage lives in apps/accounts/tests/test_email_verification.py.
 * These tests cover what only the React layer can break: that the
 * verify-on-mount happens automatically, the resend form gates on
 * auth state, and error/success states render correctly.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/lib/api/auth", () => ({
    authService: {
        confirmEmailVerification: vi.fn(),
        resendEmailVerification: vi.fn(),
    },
}));

import { authService } from "@/lib/api/auth";
import { VerifyEmailClient } from "@/components/auth/VerifyEmailClient";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { useAuthStore } from "@/lib/store/authStore";

function withQuery(node: React.ReactNode) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

beforeEach(() => {
    vi.clearAllMocks();
    // Each test starts logged out so isAuthenticated gating is exercised.
    useAuthStore.getState().logout();
});

describe("VerifyEmailClient", () => {
    it("posts the token on mount and shows the verified state", async () => {
        (authService.confirmEmailVerification as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            data: { detail: "Email verified.", verified: true, verified_at: "2026-05-09T12:00:00Z" },
        });
        render(withQuery(<VerifyEmailClient token="signed.token.value" />));

        await waitFor(() => {
            expect(authService.confirmEmailVerification).toHaveBeenCalledWith(
                "signed.token.value",
            );
        });
        expect(await screen.findByText(/email verified/i)).toBeInTheDocument();
    });

    it("shows the failure CTA on a 400 response", async () => {
        (authService.confirmEmailVerification as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
            response: { data: { detail: "This verification link is invalid or has expired." } },
        });
        render(withQuery(<VerifyEmailClient token="bad-token" />));

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(/invalid or has expired/i);
        expect(screen.getByRole("link", { name: /send a new link/i })).toBeInTheDocument();
    });
});

describe("ResendVerificationForm", () => {
    it("renders a sign-in CTA when the user is not authenticated", () => {
        render(withQuery(<ResendVerificationForm />));
        expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /send verification email/i })).toBeNull();
    });

    it("authenticated user sees the resend button and triggers the API", async () => {
        useAuthStore.getState().setAccessToken("test.access.token");
        useAuthStore.getState().setUser({
            id: "u1",
            email: "alice@example.com",
            full_name: "Alice",
            company_name: "Co",
            role: "client",
            email_verified: false,
            created_at: "2026-05-01T00:00:00Z",
        });
        (authService.resendEmailVerification as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            data: { detail: "A verification email has been sent.", verified: false },
        });

        render(withQuery(<ResendVerificationForm />));
        const btn = screen.getByRole("button", { name: /send verification email/i });
        fireEvent.click(btn);

        await waitFor(() => {
            expect(authService.resendEmailVerification).toHaveBeenCalled();
        });
        expect(await screen.findByText(/check your inbox/i)).toBeInTheDocument();
    });

    it("shows a generic error toast on a backend failure", async () => {
        useAuthStore.getState().setAccessToken("test.access.token");
        useAuthStore.getState().setUser({
            id: "u1",
            email: "alice@example.com",
            full_name: "Alice",
            company_name: "Co",
            role: "client",
            email_verified: false,
            created_at: "2026-05-01T00:00:00Z",
        });
        (authService.resendEmailVerification as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
            response: { data: { detail: "rate limit hit" } },
        });

        render(withQuery(<ResendVerificationForm />));
        fireEvent.click(screen.getByRole("button", { name: /send verification email/i }));

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(/couldn't send|try again/i);
    });
});
