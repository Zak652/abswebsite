"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/lib/api/subscriptions";
import { useAuthStore } from "@/lib/store/authStore";
import type { TrialSignupFormData } from "@/types/subscription";

export function useSubmitTrialSignup() {
  return useMutation({
    mutationFn: (data: TrialSignupFormData) =>
      subscriptionService.submitTrial(data).then((r) => r.data),
  });
}

export function useMySubscriptions() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["subscriptions", "mine"],
    queryFn: () => subscriptionService.listMine().then((r) => r.data.results),
    enabled: isAuthenticated,
  });
}

export function useCancelTrial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      subscriptionService.cancel(id, reason).then((r) => r.data),
    onSuccess: () => {
      // Refetch the list so the freshly-cancelled trial picks up its new
      // status without a hard reload.
      qc.invalidateQueries({ queryKey: ["subscriptions", "mine"] });
    },
  });
}
