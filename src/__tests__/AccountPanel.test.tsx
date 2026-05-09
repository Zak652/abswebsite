/**
 * Account / GDPR panel (§ 3.9).
 *
 * Backend coverage lives in apps/accounts/tests/test_gdpr.py. These
 * tests exercise the React-only behaviours: the JSON download blob
 * is built and the anchor click fires; the delete button is gated on
 * a typed confirmation phrase; success/error states render.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/lib/api/auth", () => ({
    authService: {
        exportMyData: vi.fn(),
        deleteMyAccount: vi.fn(),
    },
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

import { authService } from "@/lib/api/auth";
import { AccountPanel } from "@/components/portal/AccountPanel";
import { useAuthStore } from "@/lib/store/authStore";

function withQuery(node: React.ReactNode) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAccessToken("test.access.token");
    useAuthStore.getState().setUser({
        id: "u1",
        email: "alice@example.com",
        full_name: "Alice",
        company_name: "Co",
        role: "client",
        email_verified: true,
        created_at: "2026-05-01T00:00:00Z",
    });
});

describe("AccountPanel — profile summary", () => {
    it("renders the user's email, name, company, and verification flag", () => {
        render(withQuery(<AccountPanel />));
        expect(screen.getByText("alice@example.com")).toBeInTheDocument();
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Co")).toBeInTheDocument();
        // "Yes" indicates email_verified=true
        expect(screen.getByText("Yes")).toBeInTheDocument();
    });
});

describe("AccountPanel — export", () => {
    it("calls exportMyData and triggers a download", async () => {
        const fakeData = { profile: { email: "alice@example.com" }, rfqs: [] };
        (authService.exportMyData as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            data: fakeData,
        });
        // Stub URL.createObjectURL — not implemented in jsdom by default.
        const createUrl = vi
            .spyOn(URL, "createObjectURL")
            .mockReturnValue("blob:mock");
        const revokeUrl = vi
            .spyOn(URL, "revokeObjectURL")
            .mockImplementation(() => { });

        render(withQuery(<AccountPanel />));
        fireEvent.click(screen.getByRole("button", { name: /download json/i }));

        await waitFor(() => {
            expect(authService.exportMyData).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(createUrl).toHaveBeenCalled();
        });
        expect(revokeUrl).toHaveBeenCalledWith("blob:mock");
    });

    it("shows a curated error message on a network failure", async () => {
        (authService.exportMyData as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
            code: "ERR_NETWORK",
        });
        render(withQuery(<AccountPanel />));
        fireEvent.click(screen.getByRole("button", { name: /download json/i }));

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(/couldn't reach the server/i);
    });
});

describe("AccountPanel — delete gating", () => {
    it("hides the confirm UI behind an opt-in click", () => {
        render(withQuery(<AccountPanel />));
        // Confirm input is not on the page until the disclosure button fires.
        expect(screen.queryByLabelText(/type/i)).toBeNull();
        fireEvent.click(
            screen.getByRole("button", { name: /i want to delete my account/i }),
        );
        expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    });

    it("disables the destructive button until the confirm phrase is typed exactly", () => {
        render(withQuery(<AccountPanel />));
        fireEvent.click(
            screen.getByRole("button", { name: /i want to delete my account/i }),
        );
        const confirmInput = screen.getByLabelText(/type/i);
        const deleteBtn = screen.getByRole("button", { name: /^delete account$/i });
        expect(deleteBtn).toBeDisabled();

        fireEvent.input(confirmInput, { target: { value: "delete me" } });
        expect(deleteBtn).toBeDisabled();

        fireEvent.input(confirmInput, { target: { value: "delete my account" } });
        expect(deleteBtn).not.toBeDisabled();
    });

    it("calls deleteMyAccount when the confirm phrase matches", async () => {
        (authService.deleteMyAccount as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            data: { detail: "Account deleted." },
        });
        render(withQuery(<AccountPanel />));
        fireEvent.click(
            screen.getByRole("button", { name: /i want to delete my account/i }),
        );
        fireEvent.input(screen.getByLabelText(/type/i), {
            target: { value: "delete my account" },
        });
        fireEvent.click(screen.getByRole("button", { name: /^delete account$/i }));

        await waitFor(() => {
            expect(authService.deleteMyAccount).toHaveBeenCalled();
        });
    });
});
