/**
 * ScannersPageClient and TagsPageClient component tests.
 *
 * Verifies CMS hero data rendering and fallback to defaults.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScannersPageClient } from "@/app/scanners/ScannersPageClient";
import { TagsPageClient } from "@/app/tags/TagsPageClient";
import { mockHero } from "./fixtures/cms";
import type { HeroSectionData } from "@/types/cms";

/* ------------------------------------------------------------------ */
/*  ScannersPageClient                                                */
/* ------------------------------------------------------------------ */
describe("ScannersPageClient", () => {
    describe("with CMS hero", () => {
        it("renders CMS headline and subheadline", () => {
            const hero: HeroSectionData = {
                ...mockHero,
                page: "scanners",
                headline: "Scanners CMS Hero",
                subheadline: "Scanners CMS Sub",
            };
            render(<ScannersPageClient hero={hero} />);
            expect(screen.getByText("Scanners CMS Hero")).toBeInTheDocument();
            expect(screen.getByText("Scanners CMS Sub")).toBeInTheDocument();
        });

        it("renders CMS CTA text and links", () => {
            const hero: HeroSectionData = {
                ...mockHero,
                page: "scanners",
                cta_primary_text: "Custom CTA",
                cta_primary_link: "/custom-link",
                cta_secondary_text: "Custom Secondary",
                cta_secondary_link: "/custom-secondary",
            };
            render(<ScannersPageClient hero={hero} />);
            const cta = screen.getByText("Custom CTA");
            expect(cta.closest("a")).toHaveAttribute("href", "/custom-link");
        });
    });

    describe("with null hero (fallbacks)", () => {
        it("renders default headline", () => {
            render(<ScannersPageClient hero={null} />);
            expect(screen.getByText("Capture data at the source.")).toBeInTheDocument();
        });

        it("renders default subheadline", () => {
            render(<ScannersPageClient hero={null} />);
            expect(screen.getByText(/Industrial-grade barcode and RFID readers/)).toBeInTheDocument();
        });

        it("renders default CTA buttons", () => {
            render(<ScannersPageClient hero={null} />);
            const configLinks = screen.getAllByText("Configure Hardware");
            expect(configLinks[0].closest("a")).toHaveAttribute("href", "/configurator");

            const quoteLinks = screen.getAllByText("Get Quote");
            expect(quoteLinks[0].closest("a")).toHaveAttribute("href", "/rfq");
        });
    });
});

/* ------------------------------------------------------------------ */
/*  TagsPageClient                                                    */
/* ------------------------------------------------------------------ */
describe("TagsPageClient", () => {
    describe("with CMS hero", () => {
        it("renders CMS headline and subheadline", () => {
            const hero: HeroSectionData = {
                ...mockHero,
                page: "tags",
                headline: "Tags CMS Hero",
                subheadline: "Tags CMS Sub",
            };
            render(<TagsPageClient hero={hero} />);
            expect(screen.getByText("Tags CMS Hero")).toBeInTheDocument();
            expect(screen.getByText("Tags CMS Sub")).toBeInTheDocument();
        });
    });

    describe("with null hero (fallbacks)", () => {
        it("renders default headline", () => {
            render(<TagsPageClient hero={null} />);
            expect(screen.getByText("A digital identity for physical assets.")).toBeInTheDocument();
        });

        it("renders default subheadline", () => {
            render(<TagsPageClient hero={null} />);
            expect(screen.getByText(/Industrial RFID, Barcode, and GPS tags/)).toBeInTheDocument();
        });

        it("renders default CTA buttons", () => {
            render(<TagsPageClient hero={null} />);
            const configLinks = screen.getAllByText("Configure Tags");
            expect(configLinks[0].closest("a")).toHaveAttribute("href", "/configurator");
        });
    });

    describe("tag categories", () => {
        it("renders tag category cards", () => {
            render(<TagsPageClient hero={null} />);
            expect(screen.getByText("Metal Mount RFID")).toBeInTheDocument();
            expect(screen.getByText("Long Range UHF")).toBeInTheDocument();
            expect(screen.getByText("Tamper Proof")).toBeInTheDocument();
        });
    });
});
