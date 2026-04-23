/**
 * LogoCarousel component tests.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LogoCarousel from "@/components/patterns/LogoCarousel";

describe("LogoCarousel", () => {
    const logos = [
        { name: "Alpha", url: "/images/logos/alpha.svg" },
        { name: "Beta", url: "/images/logos/beta.svg" },
        { name: "Gamma", url: "/images/logos/gamma.svg" },
    ];

    it("renders all logos with correct alt text", () => {
        render(<LogoCarousel logos={logos} />);
        // Each logo appears twice (duplicated for seamless loop)
        expect(screen.getAllByAltText("Alpha")).toHaveLength(2);
        expect(screen.getAllByAltText("Beta")).toHaveLength(2);
        expect(screen.getAllByAltText("Gamma")).toHaveLength(2);
    });

    it("doubles logos for infinite scroll effect", () => {
        render(<LogoCarousel logos={logos} />);
        const images = screen.getAllByRole("img");
        expect(images).toHaveLength(logos.length * 2);
    });

    it("renders nothing when logos array is empty", () => {
        const { container } = render(<LogoCarousel logos={[]} />);
        expect(container.innerHTML).toBe("");
    });

    it("has marquee aria label for accessibility", () => {
        render(<LogoCarousel logos={logos} />);
        expect(screen.getByRole("marquee")).toHaveAttribute("aria-label", "Client logos");
    });
});
