"use client";

/**
 * Focus trap for modal dialogs (build guide § 3.1).
 *
 * Ships the three a11y guarantees a modal needs to clear WCAG 2.1 §
 * 2.4.3 (Focus Order) and § 2.1.2 (No Keyboard Trap, in the
 * narrow-trap-only-when-open sense):
 *
 * 1. **Focus moves into the dialog when it opens.** First focusable
 *    descendant wins; if there are none, the container itself takes
 *    focus (we set ``tabIndex=-1`` on it).
 * 2. **Tab cycles within the dialog.** Tab from the last focusable
 *    wraps to the first; Shift+Tab from the first wraps to the last.
 *    Browser default Tab order leaks to the page below otherwise.
 * 3. **Focus returns to the trigger on close.** The element that was
 *    focused when the modal opened gets ``focus()`` back so screen
 *    readers and keyboard users land where they were.
 *
 * Why a local hook instead of a library
 * -------------------------------------
 * focus-trap-react is the obvious dep — but it's ~12kb min+gzip and
 * we have exactly two modals. The native ``querySelectorAll`` approach
 * here is ~50 lines and matches what e.g. Radix Dialog does internally.
 * If a third modal needs more (eg. iframe or shadow-DOM focusables),
 * upgrade to focus-trap-react then; today YAGNI.
 *
 * Limitations
 * -----------
 * - Doesn't handle ``contenteditable``, iframes, or shadow DOM. The
 *   two modals on the site are plain inputs/buttons.
 * - Doesn't handle multiple stacked modals. We don't have any.
 */

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "textarea:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(",");

interface UseFocusTrapOptions {
    active: boolean;
    onEscape?: () => void;
}

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
    active,
    onEscape,
}: UseFocusTrapOptions) {
    const containerRef = useRef<T | null>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    // Latch the most recent ``onEscape`` so callers can pass an inline
    // arrow without retriggering the trap setup on every render. The
    // effect's only real dep is ``active``.
    const onEscapeRef = useRef(onEscape);
    useEffect(() => {
        onEscapeRef.current = onEscape;
    }, [onEscape]);

    useEffect(() => {
        if (!active) return;

        const container = containerRef.current;
        if (!container) return;

        const getFocusables = () =>
            Array.from(
                container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
            ).filter((el) => !el.hasAttribute("aria-hidden"));

        previouslyFocusedRef.current =
            (document.activeElement as HTMLElement) ?? null;

        // Move focus into the dialog. First focusable wins; container
        // itself if there are none (eg. a confirmation banner).
        const focusables = getFocusables();
        const target = focusables[0] ?? container;
        if (!container.hasAttribute("tabindex")) {
            container.setAttribute("tabindex", "-1");
        }
        target.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && onEscapeRef.current) {
                e.stopPropagation();
                onEscapeRef.current();
                return;
            }
            if (e.key !== "Tab") return;

            const focusables = getFocusables();
            if (focusables.length === 0) {
                e.preventDefault();
                container.focus();
                return;
            }

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const activeEl = document.activeElement as HTMLElement | null;

            if (e.shiftKey && activeEl === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && activeEl === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            // Restore focus to the originally-focused element.
            previouslyFocusedRef.current?.focus?.();
        };
    }, [active]);

    return containerRef;
}
