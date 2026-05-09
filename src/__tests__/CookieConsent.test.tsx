/**
 * Cookie consent (§ 3.9).
 *
 * The contract: banner shows iff no choice has been made; choice
 * persists across renders and across hooks; analytics gating defaults
 * to denied. Real third-party analytics is not yet wired up — this
 * proves the scaffolding is correct so it stays correct when one is.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
    setConsent,
    clearConsent,
    getConsent,
    useAnalyticsAllowed,
} from "@/lib/cookies";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

beforeEach(() => {
    if (typeof window !== "undefined") {
        window.localStorage.clear();
    }
});

describe("getConsent / setConsent", () => {
    it("returns null when nothing has been stored", () => {
        expect(getConsent()).toBeNull();
    });

    it("round-trips granted and denied values", () => {
        setConsent("granted");
        expect(getConsent()).toBe("granted");
        setConsent("denied");
        expect(getConsent()).toBe("denied");
    });

    it("clearConsent removes the stored value", () => {
        setConsent("granted");
        clearConsent();
        expect(getConsent()).toBeNull();
    });

    it("ignores stored values that aren't a recognised consent string", () => {
        window.localStorage.setItem("abs-cookie-consent", "yes-please");
        expect(getConsent()).toBeNull();
    });
});

describe("CookieConsentBanner", () => {
    it("renders when no choice has been made", async () => {
        render(<CookieConsentBanner />);
        // Banner mounts hydrated=true on first effect
        expect(await screen.findByRole("region", { name: /cookie consent/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /accept all/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /reject non-essential/i })).toBeInTheDocument();
    });

    it("disappears once the user accepts", async () => {
        render(<CookieConsentBanner />);
        const accept = await screen.findByRole("button", { name: /accept all/i });
        fireEvent.click(accept);
        expect(screen.queryByRole("region", { name: /cookie consent/i })).toBeNull();
        expect(getConsent()).toBe("granted");
    });

    it("disappears once the user rejects", async () => {
        render(<CookieConsentBanner />);
        const reject = await screen.findByRole("button", {
            name: /reject non-essential/i,
        });
        fireEvent.click(reject);
        expect(screen.queryByRole("region", { name: /cookie consent/i })).toBeNull();
        expect(getConsent()).toBe("denied");
    });

    it("does not render when the user already chose previously", () => {
        setConsent("granted");
        render(<CookieConsentBanner />);
        expect(screen.queryByRole("region", { name: /cookie consent/i })).toBeNull();
    });
});

describe("useAnalyticsAllowed", () => {
    function Probe() {
        const allowed = useAnalyticsAllowed();
        return <span data-testid="probe">{allowed ? "yes" : "no"}</span>;
    }

    it("is false until the user explicitly grants consent", () => {
        render(<Probe />);
        expect(screen.getByTestId("probe").textContent).toBe("no");
    });

    it("flips to true after setConsent('granted')", () => {
        render(<Probe />);
        act(() => {
            setConsent("granted");
        });
        expect(screen.getByTestId("probe").textContent).toBe("yes");
    });

    it("flips back to false after clearConsent", () => {
        setConsent("granted");
        render(<Probe />);
        expect(screen.getByTestId("probe").textContent).toBe("yes");
        act(() => {
            clearConsent();
        });
        expect(screen.getByTestId("probe").textContent).toBe("no");
    });
});
