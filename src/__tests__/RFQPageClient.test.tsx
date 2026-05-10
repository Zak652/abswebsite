/**
 * RFQ multi-step quote flow (build guide § 3.10).
 *
 * Backend coverage lives in apps/rfq/tests/test_submission.py — this
 * file only pins what the React layer alone can break: validation
 * gates between steps, the API helper is called with the right
 * payload, and the success state replaces the form on a 201.
 *
 * The page uses next/navigation's useSearchParams. We mock it inline
 * so the Suspense fallback never blocks us.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const searchParamsMock = { get: vi.fn(() => null) };

vi.mock("next/navigation", () => ({
    useSearchParams: () => searchParamsMock,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api/rfq", () => ({
    rfqService: {
        submit: vi.fn(),
    },
}));

import { rfqService } from "@/lib/api/rfq";
import { RFQPageClient } from "@/app/rfq/RFQPageClient";

function withQuery(node: React.ReactNode) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock.get.mockReturnValue(null);
});

describe("RFQ flow", () => {
    it("blocks step 1 → step 2 when no solution type is picked", async () => {
        render(withQuery(<RFQPageClient />));
        // Step 1 visible
        expect(
            await screen.findByText(/what do you need a quote for/i),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        expect(
            await screen.findByText(/select at least one item to quote/i),
        ).toBeInTheDocument();
    });

    it("walks step 1 → 2 → 3 → submit and lands on the success screen", async () => {
        (rfqService.submit as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            data: {
                id: "rfq-1",
                email: "buyer@acme.com",
                company_name: "Acme Industries",
                status: "new",
            },
        });

        render(withQuery(<RFQPageClient />));

        // Step 1: pick "Hardware & Tags"
        fireEvent.click(
            await screen.findByRole("button", { name: /hardware & tags/i }),
        );
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        // Step 2: pick the asset-count range. Step 2 has two <select>s
        // (asset count + location count); pick the first.
        const selects = await screen.findAllByRole("combobox");
        fireEvent.change(selects[0], { target: { value: "1001-5000" } });
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        // Step 3: contact
        fireEvent.input(await screen.findByPlaceholderText(/you@company.com/i), {
            target: { value: "buyer@acme.com" },
        });
        fireEvent.input(screen.getByPlaceholderText(/acme corp/i), {
            target: { value: "Acme Industries" },
        });
        fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

        await waitFor(() => {
            expect(rfqService.submit).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: "buyer@acme.com",
                    company_name: "Acme Industries",
                    needs_hardware: true,
                    needs_software: false,
                    needs_services: false,
                    asset_count_range: "1001-5000",
                }),
            );
        });

        expect(await screen.findByText(/request received/i)).toBeInTheDocument();
    });

    it("blocks step 3 submit on an invalid email", async () => {
        render(withQuery(<RFQPageClient />));

        // Step 1
        fireEvent.click(
            await screen.findByRole("button", { name: /hardware & tags/i }),
        );
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        // Step 2
        const selects = await screen.findAllByRole("combobox");
        fireEvent.change(selects[0], { target: { value: "1001-5000" } });
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        // Step 3 — bad email
        fireEvent.input(await screen.findByPlaceholderText(/you@company.com/i), {
            target: { value: "not-an-email" },
        });
        fireEvent.input(screen.getByPlaceholderText(/acme corp/i), {
            target: { value: "Acme Industries" },
        });
        fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

        expect(
            await screen.findByText(/valid work email/i),
        ).toBeInTheDocument();
        expect(rfqService.submit).not.toHaveBeenCalled();
    });

    it("surfaces a generic error on a failed submit (does not reach step 4)", async () => {
        (rfqService.submit as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
            response: { status: 500, data: { detail: "internal" } },
        });

        render(withQuery(<RFQPageClient />));

        fireEvent.click(
            await screen.findByRole("button", { name: /hardware & tags/i }),
        );
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        const selects = await screen.findAllByRole("combobox");
        fireEvent.change(selects[0], { target: { value: "1001-5000" } });
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        fireEvent.input(await screen.findByPlaceholderText(/you@company.com/i), {
            target: { value: "buyer@acme.com" },
        });
        fireEvent.input(screen.getByPlaceholderText(/acme corp/i), {
            target: { value: "Acme Industries" },
        });
        fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

        expect(
            await screen.findByText(/something went wrong submitting/i),
        ).toBeInTheDocument();
        // Success screen never rendered.
        expect(screen.queryByText(/request received/i)).not.toBeInTheDocument();
    });
});
