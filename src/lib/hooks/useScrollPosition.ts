"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when the page has scrolled past `threshold` pixels.
 * Uses a passive scroll listener for performance.
 */
export function useScrollPosition(threshold = 80): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > threshold);
    };

    // Check immediately in case page is already scrolled (e.g. after back-navigation)
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
