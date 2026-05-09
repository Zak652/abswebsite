"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Per-category staleTime constants for TanStack Query (§ 3.3).
 *
 * Pick one of these for any new ``useQuery`` so the cadence is
 * intentional — not the global default. Numbers reflect how stale we
 * can tolerate that data being before a refetch:
 *
 * - ``STALE_PRICING``: pricing & availability shift fast (currency
 *   rates, capacity, in-stock); 30 s is a sensible upper bound.
 * - ``STALE_CMS_CONTENT``: marketing copy, hero, blocks. 5 min lets
 *   editors see edits without constant refetching.
 * - ``STALE_STATIC_CATALOG``: reference data that rarely changes
 *   (categories, plan features, support tiers). 1 h.
 * - ``STALE_USER_SCOPED``: anything keyed off the current user
 *   (subscriptions, training registrations). 1 min — tight enough
 *   that a state change in another tab is reflected quickly.
 */
export const STALE_PRICING = 30 * 1000;
export const STALE_USER_SCOPED = 60 * 1000;
export const STALE_CMS_CONTENT = 5 * 60 * 1000;
export const STALE_STATIC_CATALOG = 60 * 60 * 1000;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default falls in the CMS-content tier — most public-page
            // queries pull marketing copy. Overrides happen at the
            // useQuery call site using one of the constants above.
            staleTime: STALE_CMS_CONTENT,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
