/**
 * EmailVerificationBanner (build guide § 3.8).
 *
 * The frontend half of the email-verified gating story. Backend
 * coverage in apps/accounts/tests/test_email_verified_gate.py pins
 * the 403s; this file pins the React behaviours: render only when
 * authenticated + unverified, fire the resend mutation, swap to the
 * confirmation copy on success, dismiss-on-close.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/lib/api/auth", () => ({
    authService: {
        resendEmailVerification: vi.fn(),
    },
}));

import { authService } from "@/lib/api/auth";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { useAuthStore } from "@/lib/store/authStore";
import type { User } from "@/types/auth";

const verified: User = {
    id: "u1",
    email: "alice@example.com",
    full_name: "Alice",
    company_name: "Co",
    role: "client",
    email_verified: true,
    created_at: "2026-01-01T00:00:00Z",
};

const unverified: User = { ...verified, email_verified: false };

function withQuery(node: React.ReactNode) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
});

describe("EmailVerificationBanner", () => {
    it("does not render when the user is not authenticated", () => {
        const { container } = render(withQuery(<EmailVerificationBanner />));
        expect(container).toBeEmptyDOMElement();
    });

    it("does not render when the user is verified", () => {
        useAuthStore.getState().setUser(verified);
        useAuthStore.getState().setAccessToken("at");
        const { container } = render(withQuery(<EmailVerificationBanner />));
        expect(container).toBeEmptyDOMElement();
    });

    it("renders the prompt with the user's email when authenticated + unverified", () => {
        useAuthStore.getState().setUser(unverified);
        useAuthStore.getState().setAccessToken("at");
        render(withQuery(<EmailVerificationBanner />));
        expect(screen.getByText(/please verify your email/i)).toBeInTheDocument();
        expect(screen.getByText(/alice@example\.com/i)).toBeInTheDocument();
    });

    it("calls resendEmailVerification and swaps to confirmation copy on success", async () => {
        (authService.resendEmailVerification as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            data: { detail: "Verification email sent." },
        });
        useAuthStore.getState().setUser(unverified);
        useAuthStore.getState().setAccessToken("at");
        render(withQuery(<EmailVerificationBanner />));

        fireEvent.click(screen.getByRole("button", { name: /resend link/i }));

        await waitFor(() => {
            expect(authService.resendEmailVerification).toHaveBeenCalledTimes(1);
        });
        expect(
            await screen.findByText(/verification email sent/i),
        ).toBeInTheDocument();
    });

    it("dismisses on close (banner unmounts)", () => {
        useAuthStore.getState().setUser(unverified);
        useAuthStore.getState().setAccessToken("at");
        const { container } = render(withQuery(<EmailVerificationBanner />));

        fireEvent.click(
            screen.getByRole("button", { name: /dismiss verification banner/i }),
        );
        expect(container).toBeEmptyDOMElement();
    });
});
