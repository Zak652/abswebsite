/**
 * ComparePageClient component tests.
 *
 * Verifies CMS pricing plan data is used for the Arcplus tab, with fallback.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComparePageClient } from "@/app/compare/ComparePageClient";
import { mockPricingPlans } from "./fixtures/cms";

// Mock useProductsByCategory hook used by scanner/tags tabs
vi.mock("@/lib/hooks/useProducts", () => ({
    useProductsByCategory: () => ({ data: [], isLoading: false }),
}));

describe("ComparePageClient", () => {
    it("renders the page title", () => {
        render(<ComparePageClient cmsPricingPlans={[]} />);
        expect(screen.getByText("Compare Solutions")).toBeInTheDocument();
    });

    it("renders category tabs", () => {
        render(<ComparePageClient cmsPricingPlans={[]} />);
        expect(screen.getByText("Hardware Scanners")).toBeInTheDocument();
        expect(screen.getByText("RFID & Barcode Tags")).toBeInTheDocument();
        expect(screen.getByText("Arcplus Software Tiers")).toBeInTheDocument();
    });

    describe("Arcplus tab with CMS data", () => {
        it("renders CMS pricing plan names when Arcplus tab is selected", async () => {
            const user = userEvent.setup();
            render(<ComparePageClient cmsPricingPlans={mockPricingPlans} />);

            await user.click(screen.getByText("Arcplus Software Tiers"));

            expect(screen.getByText("Starter")).toBeInTheDocument();
            expect(screen.getByText("Growth")).toBeInTheDocument();
        });

        it("renders CMS feature rows from plan feature_values", async () => {
            const user = userEvent.setup();
            render(<ComparePageClient cmsPricingPlans={mockPricingPlans} />);

            await user.click(screen.getByText("Arcplus Software Tiers"));

            expect(screen.getByText("Asset Limit")).toBeInTheDocument();
            expect(screen.getByText("RFID Support")).toBeInTheDocument();
            expect(screen.getByText("1,000")).toBeInTheDocument();
            expect(screen.getByText("5,000")).toBeInTheDocument();
        });
    });

    describe("Arcplus tab with empty CMS data (fallback)", () => {
        it("renders fallback plan names", async () => {
            const user = userEvent.setup();
            render(<ComparePageClient cmsPricingPlans={[]} />);

            await user.click(screen.getByText("Arcplus Software Tiers"));

            expect(screen.getByText("Starter")).toBeInTheDocument();
            expect(screen.getByText("Growth")).toBeInTheDocument();
            expect(screen.getByText("Professional")).toBeInTheDocument();
        });

        it("renders fallback features", async () => {
            const user = userEvent.setup();
            render(<ComparePageClient cmsPricingPlans={[]} />);

            await user.click(screen.getByText("Arcplus Software Tiers"));

            expect(screen.getByText("Asset Limit")).toBeInTheDocument();
            expect(screen.getByText("User Seats")).toBeInTheDocument();
            expect(screen.getByText("SLA")).toBeInTheDocument();
        });
    });

    it("renders bottom CTA", () => {
        render(<ComparePageClient cmsPricingPlans={[]} />);
        expect(screen.getByText("Get Custom Quote")).toBeInTheDocument();
    });
});
