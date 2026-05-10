/**
 * useFocusTrap (build guide § 3.1).
 *
 * Pins three guarantees the modal-trap layer must hold:
 *   1. Focus moves into the dialog when ``active`` flips to true.
 *   2. Tab and Shift+Tab cycle within the dialog (no leak to the page
 *      below).
 *   3. Focus returns to the originally-focused element when the trap
 *      tears down.
 *
 * Modal integration is exercised in the per-modal tests; this file
 * keeps the hook itself honest in isolation.
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useState } from "react";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

function Harness({ initialOpen = false }: { initialOpen?: boolean }) {
    const [open, setOpen] = useState(initialOpen);
    const ref = useFocusTrap<HTMLDivElement>({
        active: open,
        onEscape: () => setOpen(false),
    });

    return (
        <div>
            <button type="button" data-testid="opener" onClick={() => setOpen(true)}>
                Open dialog
            </button>
            <button type="button" data-testid="outside-after">
                Outside after
            </button>
            {open && (
                <div ref={ref} role="dialog" aria-label="Test dialog" data-testid="dialog">
                    <button type="button" data-testid="first">
                        First
                    </button>
                    <input data-testid="middle" aria-label="Middle input" />
                    <button type="button" data-testid="last">
                        Last
                    </button>
                </div>
            )}
        </div>
    );
}

describe("useFocusTrap", () => {
    it("moves focus to the first focusable on activation", () => {
        render(<Harness />);
        screen.getByTestId("opener").focus();
        fireEvent.click(screen.getByTestId("opener"));

        // After the trap mounts, the first focusable inside the dialog is focused.
        expect(document.activeElement).toBe(screen.getByTestId("first"));
    });

    it("cycles Tab from the last focusable back to the first", () => {
        render(<Harness initialOpen={true} />);
        const first = screen.getByTestId("first");
        const last = screen.getByTestId("last");

        last.focus();
        // Forward Tab from `last` → trap intercepts and lands on `first`.
        fireEvent.keyDown(document, { key: "Tab" });
        expect(document.activeElement).toBe(first);
    });

    it("cycles Shift+Tab from the first focusable back to the last", () => {
        render(<Harness initialOpen={true} />);
        const first = screen.getByTestId("first");
        const last = screen.getByTestId("last");

        first.focus();
        fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
        expect(document.activeElement).toBe(last);
    });

    it("calls onEscape on Escape", () => {
        render(<Harness initialOpen={true} />);
        expect(screen.getByTestId("dialog")).toBeInTheDocument();

        fireEvent.keyDown(document, { key: "Escape" });
        // onEscape calls setOpen(false), unmounting the dialog.
        expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("restores focus to the originally-focused element when the trap deactivates", () => {
        render(<Harness />);
        const opener = screen.getByTestId("opener");
        opener.focus();
        expect(document.activeElement).toBe(opener);

        // Open: focus moves into the dialog.
        fireEvent.click(opener);
        expect(document.activeElement).toBe(screen.getByTestId("first"));

        // Close via Escape — trap unmounts → focus restores to opener.
        act(() => {
            fireEvent.keyDown(document, { key: "Escape" });
        });
        expect(document.activeElement).toBe(opener);
    });
});
