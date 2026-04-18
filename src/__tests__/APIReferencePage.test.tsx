import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import APIReferencePageClient from "@/app/resources/api-reference/APIReferencePageClient";
import type { APIEndpointGroupData } from "@/types/cms";

// Mock next/link
vi.mock("next/link", () => ({
    default: ({
        children,
        href,
    }: {
        children: React.ReactNode;
        href: string;
    }) => <a href={href}>{children}</a>,
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
    ArrowLeft: () => <span data-testid="arrow-left" />,
    Check: () => <span data-testid="check" />,
    Copy: () => <span data-testid="copy" />,
    Code2: () => <span data-testid="code2" />,
}));

// Mock navigator.clipboard
Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

const CMS_GROUPS: APIEndpointGroupData[] = [
    {
        id: 1,
        name: "Widgets",
        slug: "widgets",
        badge_class: "bg-blue-50 text-blue-700",
        order: 0,
        endpoints: [
            {
                id: 1,
                method: "GET",
                path: "/widgets",
                description: "List all widgets",
                order: 0,
            },
            {
                id: 2,
                method: "POST",
                path: "/widgets",
                description: "Create a widget",
                order: 1,
            },
        ],
    },
    {
        id: 2,
        name: "Gadgets",
        slug: "gadgets",
        badge_class: "bg-green-50 text-green-700",
        order: 1,
        endpoints: [
            {
                id: 3,
                method: "GET",
                path: "/gadgets",
                description: "List gadgets",
                order: 0,
            },
        ],
    },
];

describe("APIReferencePageClient", () => {
    it("renders CMS endpoint groups when provided", () => {
        render(<APIReferencePageClient cmsGroups={CMS_GROUPS} />);
        expect(screen.getByText("Widgets")).toBeInTheDocument();
        expect(screen.getByText("Gadgets")).toBeInTheDocument();
    });

    it("renders fallback endpoints when CMS returns empty", () => {
        render(<APIReferencePageClient cmsGroups={[]} />);
        // Fallback groups include "Products", "Services", etc.
        expect(screen.getByText("Products")).toBeInTheDocument();
        expect(screen.getByText("Services")).toBeInTheDocument();
        expect(screen.getByText("Training")).toBeInTheDocument();
    });

    it("displays the page heading", () => {
        render(<APIReferencePageClient cmsGroups={CMS_GROUPS} />);
        expect(
            screen.getByRole("heading", { name: "API Reference" })
        ).toBeInTheDocument();
    });

    it("shows endpoint methods and paths", () => {
        render(<APIReferencePageClient cmsGroups={CMS_GROUPS} />);
        expect(screen.getAllByText("GET").length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText("POST")).toBeInTheDocument();
        // /widgets appears for both GET and POST rows
        expect(screen.getAllByText("/widgets").length).toBe(2);
        expect(screen.getByText("/gadgets")).toBeInTheDocument();
    });

    it("shows endpoint descriptions", () => {
        render(<APIReferencePageClient cmsGroups={CMS_GROUPS} />);
        expect(screen.getByText("List all widgets")).toBeInTheDocument();
        expect(screen.getByText("Create a widget")).toBeInTheDocument();
    });

    it("renders the auth overview section", () => {
        render(<APIReferencePageClient cmsGroups={CMS_GROUPS} />);
        expect(
            screen.getByRole("heading", { name: "Authentication" })
        ).toBeInTheDocument();
        expect(
            screen.getByText("https://api.absplatform.com/v1")
        ).toBeInTheDocument();
    });

    it("renders the code example section", () => {
        render(<APIReferencePageClient cmsGroups={CMS_GROUPS} />);
        expect(
            screen.getByRole("heading", { name: "Code Example" })
        ).toBeInTheDocument();
    });

    it("renders bottom CTA with pricing link", () => {
        render(<APIReferencePageClient cmsGroups={CMS_GROUPS} />);
        expect(screen.getByText("View Pricing")).toBeInTheDocument();
    });
});
