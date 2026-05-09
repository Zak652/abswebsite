/**
 * Password reset frontend (§ 3.8).
 *
 * Backend coverage lives in apps/accounts/tests/test_password_reset.py.
 * These tests cover what only the React layer can break: that the
 * forms call the right API helpers, render success states correctly,
 * and don't leak whether an email exists.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/lib/api/auth", () => ({
    authService: {
        requestPasswordReset: vi.fn(),
        confirmPasswordReset: vi.fn(),
    },
}));

import { authService } from "@/lib/api/auth";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

function withQuery(node: React.ReactNode) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("ForgotPasswordForm", () => {
    it("submits the email to the API and shows the neutral success state", async () => {
        // Mocked API resolves with the same shape regardless of email — the
        // backend is enumeration-safe; the UI must respect that.
        (authService.requestPasswordReset as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            data: { detail: "If an account exists for that address, a reset link has been sent." },
        });
        render(withQuery(<ForgotPasswordForm />));
        fireEvent.input(screen.getByLabelText(/email address/i), {
            target: { value: "alice@example.com" },
        });
        fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

        await waitFor(() => {
            expect(authService.requestPasswordReset).toHaveBeenCalledWith(
                "alice@example.com",
            );
        });
        expect(await screen.findByText(/check your inbox/i)).toBeInTheDocument();
    });

    it("does not surface raw backend errors on failure", async () => {
        (authService.requestPasswordReset as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
            response: { data: { detail: "DEBUG: user not found in db_users_v2" } },
        });
        render(withQuery(<ForgotPasswordForm />));
        fireEvent.input(screen.getByLabelText(/email address/i), {
            target: { value: "alice@example.com" },
        });
        fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(/something went wrong/i);
        expect(alert).not.toHaveTextContent(/db_users_v2/);
    });

    it("blocks submission with an invalid email client-side", async () => {
        render(withQuery(<ForgotPasswordForm />));
        fireEvent.input(screen.getByLabelText(/email address/i), {
            target: { value: "not-an-email" },
        });
        fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

        // zod resolver runs on submit and produces a field error
        expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
        expect(authService.requestPasswordReset).not.toHaveBeenCalled();
    });
});

describe("ResetPasswordForm", () => {
    it("posts token + new password and shows success state", async () => {
        (authService.confirmPasswordReset as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            data: { detail: "Password has been reset." },
        });
        render(withQuery(<ResetPasswordForm token="signed.token.value" />));
        fireEvent.input(screen.getByLabelText(/^new password\s*\*?$/i), {
            target: { value: "brand-new-password-123" },
        });
        fireEvent.input(screen.getByLabelText(/confirm new password/i), {
            target: { value: "brand-new-password-123" },
        });
        fireEvent.click(screen.getByRole("button", { name: /update password/i }));

        await waitFor(() => {
            expect(authService.confirmPasswordReset).toHaveBeenCalledWith(
                "signed.token.value",
                "brand-new-password-123",
                "brand-new-password-123",
            );
        });
        expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
    });

    it("shows the curated invalid-link message verbatim from the backend", async () => {
        // The backend's "This reset link is invalid or has expired." string is
        // user-safe, so the UI should display it as-is.
        (authService.confirmPasswordReset as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
            response: { data: { detail: "This reset link is invalid or has expired." } },
        });
        render(withQuery(<ResetPasswordForm token="bad-token" />));
        fireEvent.input(screen.getByLabelText(/^new password\s*\*?$/i), {
            target: { value: "brand-new-password-123" },
        });
        fireEvent.input(screen.getByLabelText(/confirm new password/i), {
            target: { value: "brand-new-password-123" },
        });
        fireEvent.click(screen.getByRole("button", { name: /update password/i }));

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(/invalid or has expired/i);
    });

    it("validates passwords match before calling the API", async () => {
        render(withQuery(<ResetPasswordForm token="t" />));
        fireEvent.input(screen.getByLabelText(/^new password\s*\*?$/i), {
            target: { value: "brand-new-password-123" },
        });
        fireEvent.input(screen.getByLabelText(/confirm new password/i), {
            target: { value: "different-password-456" },
        });
        fireEvent.click(screen.getByRole("button", { name: /update password/i }));

        expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
        expect(authService.confirmPasswordReset).not.toHaveBeenCalled();
    });
});
