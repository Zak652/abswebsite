"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { trainingService } from "@/lib/api/training";
import { useAuthStore } from "@/lib/store/authStore";

export function useTrainingSessions() {
  return useQuery({
    queryKey: ["training", "sessions"],
    queryFn: () => trainingService.getSessions().then((r) => r.data.results),
  });
}

export function useRegisterForTraining() {
  return useMutation({
    mutationFn: trainingService.register,
    onSuccess: (response) => {
      const { payment_link } = response.data;
      if (payment_link && typeof window !== "undefined") {
        window.location.href = payment_link;
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
  });
}
