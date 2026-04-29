/**
 * ArcplusPageClient component tests.
 *
 * Verifies CMS PageBlock data is consumed for the Arcplus sections that
 * were previously hardcoded (modules intro, lifecycle, pricing intro,
 * feature comparison, conversion CTA), with sensible fallbacks.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArcplusPageClient } from "@/app/arcplus/ArcplusPageClient";
import type { PageBlockData } from "@/types/cms";

// TrialSignupModal calls into APIs; stub it for these tests.
vi.mock("@/components/subscriptions/TrialSignupModal", () => ({
    TrialSignupModal: () => null,
}));

const baseBlock = (overrides: Partial<PageBlockData>): PageBlockData => ({
    id: 1,
    page: "arcplus",
    key: "",
    block_type: "text",
    title: "",
    body: "",
    image: null,
    video_url: "",
    icon: "",
    link_url: "",
    link_text: "",
    data: {},
    order: 0,
    ...overrides,
});

const renderClient = (blocks: PageBlockData[] = []) =>
    render(
        <ArcplusPageClient
            hero={null}
            cmsModules={[]}
            cmsPricingPlans={[]}
            blocks={blocks}
            currencyRates={null}
        />
    );

describe("ArcplusPageClient — CMS block resolution", () => {
    it("falls back to hardcoded copy when no blocks are supplied", () => {
        renderClient([]);
        expect(screen.getByText("Visual Lifecycle Management")).toBeInTheDocument();
        expect(screen.getByText("Simple, scale-based pricing.")).toBeInTheDocument();
        expect(
            screen.getByText("Transform your asset lifecycle.")
        ).toBeInTheDocument();
        expect(screen.getByText("Arcplus Dashboard Overview")).toBeInTheDocument();
    });

    it("uses CMS lifecycle title, body, dashboard label and step strings", () => {
        const lifecycle = baseBlock({
            id: 100,
            key: "arcplus_lifecycle",
            block_type: "workflow",
            title: "CMS Lifecycle Title",
            body: "CMS lifecycle body text.",
            order: 20,
            data: {
                dashboard_label: "CMS Dashboard Label",
                steps: [
                    {
                        label: "CMS Register",
                        dashboard_title: "CMS Register Workflow Title",
                        dashboard_caption: "CMS Register caption running...",
                    },
                    {
                        label: "CMS Operate",
                        dashboard_title: "CMS Operate Workflow Title",
                        dashboard_caption: "CMS Operate caption running...",
                    },
                ],
            },
        });

        renderClient([lifecycle]);

        expect(screen.getByText("CMS Lifecycle Title")).toBeInTheDocument();
        expect(screen.getByText("CMS lifecycle body text.")).toBeInTheDocument();
        expect(screen.getByText("CMS Dashboard Label")).toBeInTheDocument();
        expect(screen.getByText("CMS Register")).toBeInTheDocument();
        expect(screen.getByText("CMS Operate")).toBeInTheDocument();
        // First step is active by default — its dashboard caption is shown.
        expect(
            screen.getByText("CMS Register Workflow Title")
        ).toBeInTheDocument();
        expect(
            screen.getByText("CMS Register caption running...")
        ).toBeInTheDocument();
    });

    it("uses CMS pricing intro heading + body", () => {
        const pricingIntro = baseBlock({
            id: 101,
            key: "arcplus_pricing_intro",
            block_type: "intro",
            title: "CMS Pricing Heading",
            body: "CMS pricing intro body.",
            order: 30,
        });
        renderClient([pricingIntro]);
        expect(screen.getByText("CMS Pricing Heading")).toBeInTheDocument();
        expect(screen.getByText("CMS pricing intro body.")).toBeInTheDocument();
    });

    it("renders CMS modules intro eyebrow + heading + body above the grid", () => {
        const modulesIntro = baseBlock({
            id: 102,
            key: "arcplus_modules_intro",
            block_type: "intro",
            title: "CMS Modules Heading",
            body: "CMS modules intro body.",
            order: 10,
            data: { eyebrow: "CMS Modules Eyebrow" },
        });
        renderClient([modulesIntro]);
        expect(screen.getByText("CMS Modules Eyebrow")).toBeInTheDocument();
        expect(screen.getByText("CMS Modules Heading")).toBeInTheDocument();
        expect(screen.getByText("CMS modules intro body.")).toBeInTheDocument();
    });

    it("uses CMS feature-comparison toggle, column and feature labels", () => {
        const fc = baseBlock({
            id: 103,
            key: "arcplus_feature_comparison",
            block_type: "feature_comparison",
            title: "CMS Feature Comparison",
            order: 40,
            data: {
                toggle_show: "Reveal CMS comparison",
                toggle_hide: "Conceal CMS comparison",
                feature_label: "CMS Feature",
                column_labels: {
                    starter: "CMS Starter",
                    growth: "CMS Growth",
                    pro: "CMS Pro",
                    enterprise: "CMS Enterprise",
                },
            },
        });
        renderClient([fc]);
        // Toggle button uses the CMS show label initially.
        expect(screen.getByText("Reveal CMS comparison")).toBeInTheDocument();
    });

    it("CTA renders both buttons; primary uses #trial sentinel as a button", () => {
        const cta = baseBlock({
            id: 104,
            key: "arcplus_cta",
            block_type: "cta_banner",
            title: "CMS CTA Title",
            body: "CMS CTA body.",
            link_text: "CMS Start Trial",
            link_url: "#trial",
            order: 50,
            data: {
                secondary_label: "CMS Get Quote",
                secondary_url: "/cms-rfq",
            },
        });
        renderClient([cta]);
        expect(screen.getByText("CMS CTA Title")).toBeInTheDocument();
        expect(screen.getByText("CMS CTA body.")).toBeInTheDocument();

        // Primary is a button (opens trial modal) when link_url is "#trial".
        const primary = screen.getByText("CMS Start Trial");
        expect(primary.tagName).toBe("BUTTON");

        // Secondary is a link with the CMS-supplied href.
        const secondary = screen.getByText("CMS Get Quote");
        expect(secondary.closest("a")).toHaveAttribute("href", "/cms-rfq");
    });

    it("CTA renders primary as a link when link_url is an external href", () => {
        const cta = baseBlock({
            id: 105,
            key: "arcplus_cta",
            block_type: "cta_banner",
            title: "CMS CTA Title",
            link_text: "CMS External CTA",
            link_url: "/some-where",
            order: 50,
        });
        renderClient([cta]);
        const primary = screen.getByText("CMS External CTA");
        expect(primary.closest("a")).toHaveAttribute("href", "/some-where");
    });
});
