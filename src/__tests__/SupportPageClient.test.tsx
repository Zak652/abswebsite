/**
 * SupportPageClient component tests.
 *
 * Verifies CMS support tier rendering and fallback to defaults.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SupportPageClient } from "@/app/resources/support/SupportPageClient";
import { mockSupportTiers } from "./fixtures/cms";

// Mock global fetch for the contact form submission
const mockFetch = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal("fetch", mockFetch);

describe("SupportPageClient", () => {
    describe("with CMS tiers", () => {
        it("renders CMS tier feature rows", () => {
            render(<SupportPageClient cmsTiers={mockSupportTiers} />);
            expect(screen.getByText("Response Time")).toBeInTheDocument();
            expect(screen.getByText("Dedicated AM")).toBeInTheDocument();
        });

        it("renders CMS tier values correctly", () => {
            render(<SupportPageClient cmsTiers={mockSupportTiers} />);
            expect(screen.getByText("48h")).toBeInTheDocument();
            expect(screen.getByText("1h")).toBeInTheDocument();
        });

        it("renders boolean values as check/dash", () => {
            const { container } = render(<SupportPageClient cmsTiers={mockSupportTiers} />);
            // "true" renders a Check icon (svg), "false" renders "—"
            const dashes = container.querySelectorAll("span.text-neutral-300");
            expect(dashes.length).toBeGreaterThan(0);
        });
    });

    describe("with empty CMS tiers (fallbacks)", () => {
        it("renders fallback tier features", () => {
            render(<SupportPageClient cmsTiers={[]} />);
            expect(screen.getByText("Initial response time")).toBeInTheDocument();
            expect(screen.getByText("Support channels")).toBeInTheDocument();
            expect(screen.getByText("Bug fix priority")).toBeInTheDocument();
        });

        it("renders all 4 plan headers", () => {
            render(<SupportPageClient cmsTiers={[]} />);
            // Plan names appear in both table headers and form select options, use getAllByText
            expect(screen.getAllByText("Starter").length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText("Growth").length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText("Professional").length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText("Enterprise").length).toBeGreaterThanOrEqual(1);
        });

        it("renders 7 fallback feature rows", () => {
            const { container } = render(<SupportPageClient cmsTiers={[]} />);
            // Each row has a <td> with font-medium for the feature name
            const featureCells = container.querySelectorAll("tbody tr");
            expect(featureCells.length).toBe(7);
        });
    });

    describe("contact form", () => {
        it("renders the contact form", () => {
            render(<SupportPageClient cmsTiers={[]} />);
            expect(screen.getByText("Send us a message")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Jane Mwangi")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("jane@yourorg.com")).toBeInTheDocument();
        });

        it("submits the form and shows success message", async () => {
            render(<SupportPageClient cmsTiers={[]} />);

            fireEvent.change(screen.getByPlaceholderText("Jane Mwangi"), { target: { value: "Test User" } });
            fireEvent.change(screen.getByPlaceholderText("jane@yourorg.com"), { target: { value: "test@test.com" } });
            fireEvent.change(screen.getByPlaceholderText("Describe your issue, question, or request..."), { target: { value: "Help me" } });

            fireEvent.click(screen.getByText("Send Message"));

            await waitFor(() => {
                expect(screen.getByText("Message received")).toBeInTheDocument();
            });
            expect(mockFetch).toHaveBeenCalledWith(
                "/api/v1/rfq/",
                expect.objectContaining({ method: "POST" })
            );
        });
    });

    describe("static sections", () => {
        it("renders contact cards", () => {
            render(<SupportPageClient cmsTiers={[]} />);
            expect(screen.getByText("Email Support")).toBeInTheDocument();
            expect(screen.getByText("Sales Enquiries")).toBeInTheDocument();
            expect(screen.getByText("Phone Support")).toBeInTheDocument();
        });

        it("renders urgent CTA section", () => {
            render(<SupportPageClient cmsTiers={[]} />);
            expect(screen.getByText("Need urgent help?")).toBeInTheDocument();
            expect(screen.getByText("Send Urgent Request")).toBeInTheDocument();
        });
    });
});
