/**
 * Footer component tests.
 *
 * Verifies CMS navigation and settings rendering with fallbacks.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "@/components/layout/Footer";
import { mockNavItem, mockSettings } from "./fixtures/cms";
import type { NavigationItemData } from "@/types/cms";

describe("Footer", () => {
    describe("with CMS data", () => {
        it("renders CMS navigation links", () => {
            const links: NavigationItemData[] = [
                { ...mockNavItem, id: 1, label: "CMS Platform Link", url: "/cms-platform" },
                { ...mockNavItem, id: 2, label: "CMS Resource Link", url: "/cms-resource", location: "footer_resources" },
            ];
            render(
                <Footer
                    platformLinks={[links[0]]}
                    resourceLinks={[links[1]]}
                    settings={mockSettings}
                />
            );
            expect(screen.getByText("CMS Platform Link")).toBeInTheDocument();
            expect(screen.getByText("CMS Resource Link")).toBeInTheDocument();
        });

        it("renders CMS contact info from settings", () => {
            render(<Footer platformLinks={[]} resourceLinks={[]} settings={mockSettings} />);
            expect(screen.getByText("cms@test.com")).toBeInTheDocument();
            expect(screen.getByText("+256 700 000000")).toBeInTheDocument();
        });

        it("renders CMS address with line breaks", () => {
            render(<Footer platformLinks={[]} resourceLinks={[]} settings={mockSettings} />);
            expect(screen.getByText("CMS Address")).toBeInTheDocument();
            expect(screen.getByText("Line 2")).toBeInTheDocument();
        });
    });

    describe("with no CMS data (fallbacks)", () => {
        it("renders default platform links", () => {
            render(<Footer />);
            expect(screen.getByText("Arcplus Software")).toBeInTheDocument();
            expect(screen.getByText("Industrial Scanners")).toBeInTheDocument();
            expect(screen.getByText("RFID & Barcode Tags")).toBeInTheDocument();
        });

        it("renders default resource links", () => {
            render(<Footer />);
            expect(screen.getByText("Case Studies")).toBeInTheDocument();
            expect(screen.getByText("Documentation")).toBeInTheDocument();
            expect(screen.getByText("Support Portal")).toBeInTheDocument();
        });

        it("renders default contact info", () => {
            render(<Footer />);
            expect(screen.getByText("contact@abssystems.com")).toBeInTheDocument();
            expect(screen.getByText("+1 (800) 555-0199")).toBeInTheDocument();
        });
    });

    it("renders copyright with current year", () => {
        render(<Footer />);
        const year = new Date().getFullYear();
        expect(screen.getByText(new RegExp(`${year}`))).toBeInTheDocument();
    });
});
