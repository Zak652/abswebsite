/**
 * Accessibility primitives (build guide § 3.1).
 *
 * Goal of this file: pin the foundational a11y contracts so future
 * regressions get caught at PR time, before they reach a production
 * Lighthouse run.
 *
 * Heavy a11y coverage (axe-core sweeps on every public route, focus
 * trap on every modal) is a separate follow-up in § 3.10. These
 * tests cover what's small, deterministic, and load-bearing.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, renderHook, screen } from "@testing-library/react";
import { FormInput } from "@/components/ui/FormInput";
import {
    useMotionPreference,
    useMotionVariant,
} from "@/lib/hooks/useMotionPreference";

describe("FormInput — label linkage", () => {
    it("links the <label> to the <input> via htmlFor / id", () => {
        render(<FormInput label="Email address" />);
        // The accessible name of the input is the visible label text.
        // testing-library resolves this via aria-labelledby OR
        // <label htmlFor>; either path is acceptable.
        const input = screen.getByLabelText(/email address/i);
        expect(input).toBeInstanceOf(HTMLInputElement);
    });

    it("derives a stable id from the label when none is given", () => {
        render(<FormInput label="Phone number" />);
        const input = screen.getByLabelText(/phone number/i);
        // The slugified id is implementation-specific, but the input
        // must end up with a non-empty id so the label can target it.
        expect(input.id).toBeTruthy();
    });

    it("respects an explicitly-provided id", () => {
        render(<FormInput label="Email" id="signup-email" />);
        const input = screen.getByLabelText(/email/i);
        expect(input.id).toBe("signup-email");
    });

    it("error messages are announced via role='alert'", () => {
        render(
            <FormInput label="Password" type="password" error="Too short" />,
        );
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(/too short/i);
    });
});

describe("useMotionPreference", () => {
    let mqlListeners: Array<(e: MediaQueryListEvent) => void> = [];
    let mockMatches = false;

    beforeEach(() => {
        mqlListeners = [];
        mockMatches = false;
        Object.defineProperty(window, "matchMedia", {
            configurable: true,
            writable: true,
            value: vi.fn((query: string) => ({
                matches: mockMatches,
                media: query,
                onchange: null,
                addEventListener: (
                    _ev: string,
                    cb: (e: MediaQueryListEvent) => void,
                ) => mqlListeners.push(cb),
                removeEventListener: () => undefined,
                addListener: () => undefined,
                removeListener: () => undefined,
                dispatchEvent: () => false,
            })),
        });
    });

    it("returns false when the user has no preference", () => {
        const { result } = renderHook(() => useMotionPreference());
        expect(result.current.prefersReducedMotion).toBe(false);
    });

    it("picks up the OS preference on first effect", () => {
        mockMatches = true;
        const { result, rerender } = renderHook(() => useMotionPreference());
        rerender();
        expect(result.current.prefersReducedMotion).toBe(true);
    });

    it("useMotionVariant returns the reduced value when the user opts in", () => {
        mockMatches = true;
        const { result, rerender } = renderHook(() =>
            useMotionVariant("hidden", "visible"),
        );
        rerender();
        expect(result.current).toBe("hidden");
    });

    it("useMotionVariant returns the animated value otherwise", () => {
        mockMatches = false;
        const { result } = renderHook(() =>
            useMotionVariant("hidden", "visible"),
        );
        expect(result.current).toBe("visible");
    });
});
