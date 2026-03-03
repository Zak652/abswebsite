"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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
