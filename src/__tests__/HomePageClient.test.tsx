/**
 * HomePageClient component tests.
 *
 * Verifies CMS data rendering and fallback to hardcoded defaults.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomePageClient } from "@/app/HomePageClient";
import { mockHero, mockGuidedBlock, mockStatsBlock, mockLogoCarouselBlock, mockTestimonials } from "./fixtures/cms";

// Mock ProductCard — it fetches API data internally
vi.mock("@/components/ui/ProductCard", () => ({
    __esModule: true,
    default: ({ title, href }: { title: string; href: string }) => (
        <div data-testid={`product-card-${title.toLowerCase()}`}><a href={href}>{title}</a></div>
    ),
}));

describe("HomePageClient", () => {
    describe("with CMS data", () => {
        it("renders CMS hero headline and subheadline", () => {
            render(<HomePageClient hero={mockHero} blocks={[]} />);
            expect(screen.getByText("CMS Headline")).toBeInTheDocument();
            expect(screen.getByText("CMS Subheadline")).toBeInTheDocument();
        });

        it("renders CMS hero CTA links", () => {
            render(<HomePageClient hero={mockHero} blocks={[]} />);
            const primaryLink = screen.getByText("CMS CTA");
            expect(primaryLink.closest("a")).toHaveAttribute("href", "/cms-link");

            const secondaryLink = screen.getByText("CMS Secondary");
            expect(secondaryLink.closest("a")).toHaveAttribute("href", "/cms-secondary");
        });

        it("renders CMS guided decision items from blocks", () => {
            render(<HomePageClient hero={null} blocks={[mockGuidedBlock]} />);
            expect(screen.getByText("CMS Item")).toBeInTheDocument();
            expect(screen.getByText("CMS desc")).toBeInTheDocument();
        });

        it("renders trust layer heading from stats_row block as fallback", () => {
            render(<HomePageClient hero={null} blocks={[mockStatsBlock]} />);
            expect(screen.getByText("Trust Stats")).toBeInTheDocument();
        });

        it("renders CMS logo carousel from blocks", () => {
            render(<HomePageClient hero={null} blocks={[mockLogoCarouselBlock]} />);
            expect(screen.getByText("CMS Trusted By")).toBeInTheDocument();
            expect(screen.getByText("CMS Trusted")).toBeInTheDocument();
            const logos = screen.getAllByAltText("TestCorp");
            // Doubled for seamless marquee loop
            expect(logos.length).toBe(2);
        });

        it("renders CMS testimonial content", () => {
            render(<HomePageClient hero={null} blocks={[]} testimonials={mockTestimonials} />);
            expect(screen.getByText(/CMS testimonial quote/i)).toBeInTheDocument();
            expect(screen.getByText("Jane Doe")).toBeInTheDocument();
        });
    });

    describe("with null/empty CMS data (fallbacks)", () => {
        it("renders default hero when hero is null", () => {
            render(<HomePageClient hero={null} blocks={[]} />);
            // Default headline is "Control\nEvery Asset." — rendered as two lines
            expect(screen.getByText("Control")).toBeInTheDocument();
            expect(screen.getByText("Every Asset.")).toBeInTheDocument();
        });

        it("renders default guided decision items when no block", () => {
            render(<HomePageClient hero={null} blocks={[]} />);
            expect(screen.getByText("Digitize asset management")).toBeInTheDocument();
            expect(screen.getByText("Capture assets faster")).toBeInTheDocument();
            expect(screen.getByText("Tag assets permanently")).toBeInTheDocument();
            expect(screen.getByText("Build an asset register")).toBeInTheDocument();
        });

        it("renders default trust stats when no block", () => {
            render(<HomePageClient hero={null} blocks={[]} />);
            // Default logos should render (not stats)
            const logos = screen.getAllByAltText("Acme Corp");
            expect(logos.length).toBe(2); // Doubled for marquee
        });

        it("renders default testimonial section when no CMS testimonials are provided", () => {
            render(<HomePageClient hero={null} blocks={[]} />);
            expect(screen.getByText("What teams say after deployment")).toBeInTheDocument();
            expect(screen.getByText("County Asset Manager")).toBeInTheDocument();
        });

        it("renders product cards section", () => {
            render(<HomePageClient hero={null} blocks={[]} />);
            expect(screen.getByTestId("product-card-scanners")).toBeInTheDocument();
            expect(screen.getByTestId("product-card-tags")).toBeInTheDocument();
            expect(screen.getByTestId("product-card-arcplus")).toBeInTheDocument();
        });
    });
});
