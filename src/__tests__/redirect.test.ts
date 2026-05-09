/**
 * safeRedirect tests (§ 3.8).
 *
 * Goal: prove the policy — internal paths pass, protocol-relative URLs
 * are rejected, external URLs only pass when the host is allowlisted.
 * The actual `window.location.href = ...` side-effect is exercised via
 * a stubbed location.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    isInternalPath,
    isAllowedExternalUrl,
    isSafeRedirectTarget,
    safeRedirect,
} from "@/lib/redirect";

describe("isInternalPath", () => {
    it.each([
        ["/", true],
        ["/portal", true],
        ["/auth/login?next=/admin-portal", true],
        ["/admin-portal/cms#section", true],
    ])("accepts %p", (path, expected) => {
        expect(isInternalPath(path)).toBe(expected);
    });

    it.each([
        ["//evil.com/foo"], // protocol-relative — must reject
        ["https://evil.com/foo"],
        [""],
        ["javascript:alert(1)"],
        ["mailto:foo@bar.com"],
        ["?query-only"],
    ])("rejects %p", (path) => {
        expect(isInternalPath(path as string)).toBe(false);
    });
});

describe("isAllowedExternalUrl", () => {
    it("accepts allowlisted Flutterwave hosts", () => {
        expect(isAllowedExternalUrl("https://checkout.flutterwave.com/pay/abc")).toBe(true);
        expect(isAllowedExternalUrl("https://ravesandboxapi.flutterwave.com/v3/x")).toBe(true);
    });

    it("rejects non-allowlisted hosts even if HTTPS", () => {
        expect(isAllowedExternalUrl("https://evil.com/checkout")).toBe(false);
        expect(isAllowedExternalUrl("https://flutterwave.com.evil.com/pay")).toBe(false);
    });

    it("rejects javascript: and data: URLs", () => {
        expect(isAllowedExternalUrl("javascript:alert(1)")).toBe(false);
        expect(isAllowedExternalUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    });

    it("rejects malformed URLs", () => {
        expect(isAllowedExternalUrl("not a url")).toBe(false);
        expect(isAllowedExternalUrl("")).toBe(false);
    });
});

describe("isSafeRedirectTarget", () => {
    it("is true for either an internal path or an allowlisted external URL", () => {
        expect(isSafeRedirectTarget("/portal")).toBe(true);
        expect(isSafeRedirectTarget("https://checkout.flutterwave.com/pay/abc")).toBe(true);
        expect(isSafeRedirectTarget("https://evil.com/")).toBe(false);
        expect(isSafeRedirectTarget("//evil.com/foo")).toBe(false);
    });
});

describe("safeRedirect", () => {
    let originalLocation: Location;
    let hrefSpy: { current: string };

    beforeEach(() => {
        originalLocation = window.location;
        hrefSpy = { current: "" };
        // Replace location with a stub whose href setter we can assert on.
        // jsdom marks location read-only; defineProperty bypasses that.
        Object.defineProperty(window, "location", {
            writable: true,
            configurable: true,
            value: {
                ...originalLocation,
                set href(v: string) {
                    hrefSpy.current = v;
                },
                get href() {
                    return hrefSpy.current;
                },
            },
        });
    });

    afterEach(() => {
        Object.defineProperty(window, "location", {
            writable: true,
            configurable: true,
            value: originalLocation,
        });
        vi.restoreAllMocks();
    });

    it("performs the navigation for safe internal paths", () => {
        const result = safeRedirect("/portal");
        expect(result).toBe(true);
        expect(hrefSpy.current).toBe("/portal");
    });

    it("performs the navigation for allowlisted external URLs", () => {
        const result = safeRedirect("https://checkout.flutterwave.com/pay/abc");
        expect(result).toBe(true);
        expect(hrefSpy.current).toBe("https://checkout.flutterwave.com/pay/abc");
    });

    it("rejects unsafe targets and falls back to /", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => { });
        const result = safeRedirect("https://evil.com/x");
        expect(result).toBe(false);
        expect(hrefSpy.current).toBe("/");
        expect(warn).toHaveBeenCalled();
    });

    it("rejects protocol-relative URLs", () => {
        vi.spyOn(console, "warn").mockImplementation(() => { });
        const result = safeRedirect("//evil.com/foo");
        expect(result).toBe(false);
        expect(hrefSpy.current).toBe("/");
    });
});
