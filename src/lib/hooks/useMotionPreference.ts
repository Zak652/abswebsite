"use client";

/**
 * Motion preference hook (build guide § 3.1).
 *
 * Reads the OS-level ``prefers-reduced-motion`` media query and
 * returns a stable predicate. Use it everywhere a component decides
 * whether to animate — the contract is: *if the user has asked for
 * reduced motion, respect it*. That means no entrance animations, no
 * parallax, no auto-playing video, no hover-triggered movement.
 *
 * Why a local hook
 * ----------------
 * Framer Motion ships ``useReducedMotion`` already, but using it
 * leaks the framer-motion dependency into pages/components that
 * render no motion of their own (typescript bundle imports, lint
 * complaints about mixed concerns). This hook is one line of native
 * matchMedia and doesn't pull anything in.
 *
 * SSR safety: returns ``false`` on the server (no animation
 * suppression by default) and hydrates to the real value on the
 * client. The first paint may briefly animate before the preference
 * locks in — acceptable since the animations we use are short.
 */

import { useEffect, useState } from "react";

const MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

export function useMotionPreference(): { prefersReducedMotion: boolean } {
    const [prefers, setPrefers] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const mql = window.matchMedia(MEDIA_QUERY);
        setPrefers(mql.matches);

        const onChange = (e: MediaQueryListEvent) => setPrefers(e.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return { prefersReducedMotion: prefers };
}

/**
 * Convenience: returns ``initial`` when the user prefers reduced
 * motion, otherwise the ``animated`` value. Useful for picking
 * Framer Motion variant strings.
 *
 * ```tsx
 * const variant = useMotionVariant("hidden", "visible");
 * <motion.div animate={variant} variants={fade} />
 * ```
 */
export function useMotionVariant<T>(reducedValue: T, animatedValue: T): T {
    const { prefersReducedMotion } = useMotionPreference();
    return prefersReducedMotion ? reducedValue : animatedValue;
}
