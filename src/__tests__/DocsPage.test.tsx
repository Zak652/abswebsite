import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DocsPageClient from "@/app/resources/docs/DocsPageClient";
import type { DocumentationPageData } from "@/types/cms";

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
    FileText: () => <span data-testid="file-text" />,
}));

const CMS_PAGES: DocumentationPageData[] = [
    {
        id: 1,
        title: "Getting Started",
        slug: "getting-started",
        content: "<p>Welcome to the docs</p>",
        order: 0,
    },
    {
        id: 2,
        title: "Advanced Usage",
        slug: "advanced-usage",
        content: "<p>Advanced content here</p>",
        order: 1,
    },
];

describe("DocsPageClient", () => {
    it("renders CMS content when provided", () => {
        render(<DocsPageClient cmsPages={CMS_PAGES} />);
        // Title appears in sidebar button + h2 heading
        expect(screen.getAllByText("Getting Started").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("Advanced Usage").length).toBeGreaterThanOrEqual(1);
    });

    it("renders fallback content when CMS returns empty", () => {
        render(<DocsPageClient cmsPages={[]} />);
        // Fallback sections include "Asset Fields", "CSV Import", etc.
        expect(screen.getByText("Asset Fields")).toBeInTheDocument();
        expect(screen.getByText("CSV Import")).toBeInTheDocument();
    });

    it("displays the page heading", () => {
        render(<DocsPageClient cmsPages={CMS_PAGES} />);
        expect(
            screen.getByRole("heading", { name: "Documentation" })
        ).toBeInTheDocument();
    });

    it("switches active section on sidebar click", () => {
        render(<DocsPageClient cmsPages={CMS_PAGES} />);
        // Initially shows first section content
        expect(screen.getByText("Welcome to the docs")).toBeInTheDocument();

        // Click on second section
        fireEvent.click(screen.getByText("Advanced Usage"));
        expect(
            screen.getByText("Advanced content here")
        ).toBeInTheDocument();
    });

    it("shows prev/next navigation between sections", () => {
        render(<DocsPageClient cmsPages={CMS_PAGES} />);
        // On first section, should show "next" but no "prev"
        expect(screen.getByText(/Advanced Usage →/)).toBeInTheDocument();

        // Navigate to second section
        fireEvent.click(screen.getByText(/Advanced Usage →/));
        expect(screen.getByText(/← Getting Started/)).toBeInTheDocument();
    });

    it("renders HTML content from CMS via dangerouslySetInnerHTML", () => {
        const pages: DocumentationPageData[] = [
            {
                id: 1,
                title: "HTML Test",
                slug: "html-test",
                content:
                    '<div class="test-class"><strong>Bold text</strong></div>',
                order: 0,
            },
        ];
        render(<DocsPageClient cmsPages={pages} />);
        expect(screen.getByText("Bold text")).toBeInTheDocument();
    });
});
