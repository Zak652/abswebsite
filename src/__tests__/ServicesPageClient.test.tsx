/**
 * ServicesPageClient component tests.
 *
 * Verifies CMS service offerings rendering and fallback to defaults.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ServicesPageClient } from "@/app/services/ServicesPageClient";
import { mockHero, mockService } from "./fixtures/cms";
import type { HeroSectionData } from "@/types/cms";

describe("ServicesPageClient", () => {
    describe("with CMS data", () => {
        it("renders CMS hero headline and subheadline", () => {
            const hero: HeroSectionData = { ...mockHero, page: "services", headline: "Services CMS Title", subheadline: "Services CMS Sub" };
            render(<ServicesPageClient hero={hero} cmsServices={[]} />);
            expect(screen.getByText("Services CMS Title")).toBeInTheDocument();
            expect(screen.getByText("Services CMS Sub")).toBeInTheDocument();
        });

        it("renders CMS service offerings", () => {
            render(<ServicesPageClient hero={null} cmsServices={[mockService]} />);
            expect(screen.getByText("CMS Service")).toBeInTheDocument();
            expect(screen.getByText("CMS problem")).toBeInTheDocument();
            expect(screen.getByText("CMS result")).toBeInTheDocument();
        });

        it("renders CMS service deliverables", () => {
            render(<ServicesPageClient hero={null} cmsServices={[mockService]} />);
            expect(screen.getByText("Item 1")).toBeInTheDocument();
            expect(screen.getByText("Item 2")).toBeInTheDocument();
        });
    });

    describe("with null/empty CMS data (fallbacks)", () => {
        it("renders default hero when hero is null", () => {
            render(<ServicesPageClient hero={null} cmsServices={[]} />);
            expect(screen.getByRole("heading", { level: 1, name: /Expert Services/i })).toBeInTheDocument();
        });

        it("renders default services when cmsServices is empty", () => {
            render(<ServicesPageClient hero={null} cmsServices={[]} />);
            expect(screen.getByText("Physical Asset Verification")).toBeInTheDocument();
            expect(screen.getByText("Asset Register Construction")).toBeInTheDocument();
        });
    });
});
