"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { STALE_PRICING, STALE_USER_SCOPED } from "@/app/providers";
import { trainingService } from "@/lib/api/training";
import { useAuthStore } from "@/lib/store/authStore";
import { safeRedirect } from "@/lib/redirect";

export function useTrainingSessions() {
  // Sessions carry seat counts — they fall in the pricing/availability
  // tier where staleness costs the user a misleading "Available" pill.
  return useQuery({
    queryKey: ["training", "sessions"],
    queryFn: () => trainingService.getSessions().then((r) => r.data.results),
    staleTime: STALE_PRICING,
  });
}

export function useRegisterForTraining() {
  return useMutation({
    mutationFn: trainingService.register,
    onSuccess: (response) => {
      const { payment_link } = response.data;
      if (payment_link) {
        // Flutterwave hosted checkout — host must be on the
        // `safeRedirect` allowlist; rejected URLs land on `/`.
        safeRedirect(payment_link);
      }
    },
  });
}

export function useMyTrainingRegistrations() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["training", "registrations"],
    queryFn: () => trainingService.listMyRegistrations().then((r) => r.data.results),
    enabled: isAuthenticated,
    staleTime: STALE_USER_SCOPED,
  });
}
