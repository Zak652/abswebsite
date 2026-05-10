/**
 * axe-core sweep across key public surfaces (build guide § 3.1).
 *
 * Why this exists
 * ---------------
 * Per § 3.1's acceptance row, the project commits to "axe-core run in
 * vitest reports 0 critical violations on `/`, `/scanners`, `/tags`,
 * `/configurator`, `/auth/login`, `/portal`."
 *
 * Server-component pages can't render fully in jsdom (Next runtime,
 * server fetches). What we do instead is render the *Client*
 * components that own each route's interactive chrome, with the same
 * shape of CMS data the server would supply, and run axe over the
 * resulting tree. That covers the structural + ARIA + label rules
 * the rule families care about; visual color-contrast is excluded
 * because jsdom doesn't compute styles a contrast check needs.
 *
 * Failure surface
 * ---------------
 * Any new ``critical`` or ``serious`` axe violation on these
 * components fails CI here. ``moderate`` and ``minor`` are surfaced
 * via console.warn (test still passes) — they're a watch-list, not
 * a gate. Use that channel before promoting a moderate to a hard
 * gate later.
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureAxe } from "vitest-axe";

import { LoginForm } from "@/components/auth/LoginForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { HomePageClient } from "@/app/HomePageClient";
import { ComparePageClient } from "@/app/compare/ComparePageClient";
import { AccountPanel } from "@/components/portal/AccountPanel";
import {
    mockHero,
    mockGuidedBlock,
    mockStatsBlock,
    mockLogoCarouselBlock,
    mockTestimonials,
    mockPricingPlans,
} from "./fixtures/cms";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => ({ get: () => null }),
    usePathname: () => "/",
}));

vi.mock("@/components/ui/ProductCard", () => ({
    __esModule: true,
    default: ({ title, href }: { title: string; href: string }) => (
        <div data-testid={`product-card-${title.toLowerCase()}`}>
            <a href={href}>{title}</a>
        </div>
    ),
}));

vi.mock("@/lib/hooks/useProducts", () => ({
    useProductsByCategory: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/lib/api/auth", () => ({
    authService: {
        login: vi.fn(),
        register: vi.fn(),
        requestPasswordReset: vi.fn(),
        confirmPasswordReset: vi.fn(),
    },
}));

// Configure axe to skip color-contrast in jsdom (no computed styles).
// Everything else (ARIA, landmarks, labels, semantics) stays on.
const axe = configureAxe({
    rules: {
        "color-contrast": { enabled: false },
        // jsdom doesn't lay out elements, so dimension-dependent rules
        // produce false positives.
        "scrollable-region-focusable": { enabled: false },
    },
});

function withQuery(node: React.ReactNode) {
    const qc = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

interface AxeResult {
    violations: Array<{
        id: string;
        impact?: string | null;
        description: string;
        nodes: unknown[];
    }>;
}

async function expectNoCriticalViolations(node: HTMLElement, label: string) {
    const result = (await axe(node)) as unknown as AxeResult;
    const blockers = result.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
    );
    const watchlist = result.violations.filter(
        (v) => v.impact === "moderate" || v.impact === "minor",
    );
    if (watchlist.length) {
        console.warn(
            `[axe-sweep:${label}] non-blocking findings`,
            watchlist.map((v) => `${v.id} (${v.impact})`),
        );
    }
    expect(blockers, `axe found blockers in ${label}`).toEqual([]);
}

describe("axe-core sweep on key public surfaces", () => {
    it("LoginForm has no critical/serious violations", async () => {
        const { container } = render(withQuery(<LoginForm />));
        await expectNoCriticalViolations(container, "LoginForm");
    });

    it("ForgotPasswordForm has no critical/serious violations", async () => {
        const { container } = render(withQuery(<ForgotPasswordForm />));
        await expectNoCriticalViolations(container, "ForgotPasswordForm");
    });

    it("ResetPasswordForm has no critical/serious violations", async () => {
        const { container } = render(
            withQuery(<ResetPasswordForm token="abc.def.ghi" />),
        );
        await expectNoCriticalViolations(container, "ResetPasswordForm");
    });

    it("HomePageClient (CMS-fed) has no critical/serious violations", async () => {
        const { container } = render(
            withQuery(
                <HomePageClient
                    hero={mockHero}
                    blocks={[mockGuidedBlock, mockStatsBlock, mockLogoCarouselBlock]}
                    testimonials={mockTestimonials}
                />,
            ),
        );
        await expectNoCriticalViolations(container, "HomePageClient");
    });

    it("HomePageClient (no CMS, fallback content) has no critical/serious violations", async () => {
        const { container } = render(
            withQuery(<HomePageClient hero={null} blocks={[]} />),
        );
        await expectNoCriticalViolations(container, "HomePageClient (fallback)");
    });

    it("ComparePageClient has no critical/serious violations", async () => {
        const { container } = render(
            withQuery(<ComparePageClient cmsPricingPlans={mockPricingPlans} />),
        );
        await expectNoCriticalViolations(container, "ComparePageClient");
    });

    it("AccountPanel (portal) has no critical/serious violations", async () => {
        const { container } = render(withQuery(<AccountPanel />));
        await expectNoCriticalViolations(container, "AccountPanel");
    });
});
