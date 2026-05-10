/**
 * LoginForm + RegisterForm (build guide § 3.10).
 *
 * Backend coverage already pins the API contract via apps/accounts/tests/.
 * These tests cover what the React layer alone can break: the forms
 * call the right API helper with the right payload, validation gates
 * submission, and API errors are surfaced to the user via role="alert"
 * without leaking raw backend strings.
 *
 * The success path doesn't need to walk the router push — the auth
 * store/router side effects are exercised in the integration suite. We
 * pin the shape that crosses the API boundary and stop there.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/api/auth", () => ({
    authService: {
        login: vi.fn(),
        register: vi.fn(),
    },
}));

import { authService } from "@/lib/api/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useAuthStore } from "@/lib/store/authStore";

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

describe("LoginForm", () => {
    it("submits the credentials to the API on a valid form", async () => {
        (authService.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            data: {
                access: "access.jwt",
                user: {
                    id: "u1",
                    email: "alice@example.com",
                    full_name: "Alice",
                    company_name: "Co",
                    role: "client",
                    email_verified: true,
                    created_at: "2026-01-01T00:00:00Z",
                },
            },
        });
        render(withQuery(<LoginForm />));
        fireEvent.input(screen.getByLabelText(/email address/i), {
            target: { value: "alice@example.com" },
        });
        fireEvent.input(screen.getByLabelText(/^password\s*\*?$/i), {
            target: { value: "correct-password-123" },
        });
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => {
            expect(authService.login).toHaveBeenCalledWith({
                email: "alice@example.com",
                password: "correct-password-123",
            });
        });
    });

    it("surfaces a curated invalid-credentials error via role='alert'", async () => {
        // The string must be on the parseApiError SAFE_DETAILS allowlist —
        // anything else collapses to the generic fallback. That's by design.
        (authService.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
            response: {
                status: 400,
                data: { detail: "Invalid email or password." },
            },
        });
        render(withQuery(<LoginForm />));
        fireEvent.input(screen.getByLabelText(/email address/i), {
            target: { value: "alice@example.com" },
        });
        fireEvent.input(screen.getByLabelText(/^password\s*\*?$/i), {
            target: { value: "wrong-password-12" }, // gitleaks:allow
        });
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(/invalid email or password/i);
    });

    it("collapses an unknown backend detail to the generic fallback (no leak)", async () => {
        (authService.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
            response: {
                status: 400,
                data: { detail: "DEBUG: bcrypt mismatch in db_users_v2" },
            },
        });
        render(withQuery(<LoginForm />));
        fireEvent.input(screen.getByLabelText(/email address/i), {
            target: { value: "alice@example.com" },
        });
        fireEvent.input(screen.getByLabelText(/^password\s*\*?$/i), {
            target: { value: "any-password-1234" }, // gitleaks:allow
        });
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(/something went wrong/i);
        expect(alert).not.toHaveTextContent(/db_users_v2/i);
    });

    it("blocks submission when zod validation fails", async () => {
        render(withQuery(<LoginForm />));
        fireEvent.input(screen.getByLabelText(/email address/i), {
            target: { value: "not-an-email" },
        });
        fireEvent.input(screen.getByLabelText(/^password\s*\*?$/i), {
            target: { value: "short" },
        });
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
        expect(authService.login).not.toHaveBeenCalled();
    });
});

describe("RegisterForm", () => {
    const validPayload = {
        full_name: "Alice Example",
        company_name: "Acme Industries",
        email: "alice@acme.com",
        phone: "",
        password: "brand-new-password-123",
        password_confirm: "brand-new-password-123",
    };

    function fill(payload: typeof validPayload) {
        fireEvent.input(screen.getByLabelText(/full name/i), {
            target: { value: payload.full_name },
        });
        fireEvent.input(screen.getByLabelText(/company name/i), {
            target: { value: payload.company_name },
        });
        fireEvent.input(screen.getByLabelText(/email address/i), {
            target: { value: payload.email },
        });
        fireEvent.input(screen.getByLabelText(/^password\s*\*?$/i), {
            target: { value: payload.password },
        });
        fireEvent.input(screen.getByLabelText(/confirm password/i), {
            target: { value: payload.password_confirm },
        });
    }

    it("submits the full registration payload", async () => {
        (authService.register as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            data: {
                access: "access.jwt",
                user: {
                    id: "u1",
                    email: validPayload.email,
                    full_name: validPayload.full_name,
                    company_name: validPayload.company_name,
                    role: "client",
                    email_verified: false,
                    created_at: "2026-05-09T00:00:00Z",
                },
            },
        });
        render(withQuery(<RegisterForm />));
        fill(validPayload);
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(authService.register).toHaveBeenCalledWith(
                expect.objectContaining({
                    full_name: validPayload.full_name,
                    company_name: validPayload.company_name,
                    email: validPayload.email,
                    password: validPayload.password,
                    password_confirm: validPayload.password_confirm,
                }),
            );
        });
    });

    it("blocks submission when passwords do not match", async () => {
        render(withQuery(<RegisterForm />));
        fill({ ...validPayload, password_confirm: "different-password-456" });
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
        expect(authService.register).not.toHaveBeenCalled();
    });

    it("surfaces an email-taken backend error on the alert region", async () => {
        (authService.register as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
            response: {
                status: 400,
                data: { email: ["A user with that email already exists."] },
            },
        });
        render(withQuery(<RegisterForm />));
        fill(validPayload);
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(/already exists/i);
    });
});
