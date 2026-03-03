"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/authStore";

export function useAdminStats() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminService.getStats().then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useAdminRFQs(status?: string) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["admin", "rfq", status],
    queryFn: () => adminService.getRFQs(status).then((r) => r.data.results),
    enabled: isAuthenticated,
  });
}

export function useUpdateRFQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status?: string; admin_notes?: string };
    }) => adminService.updateRFQ(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "rfq"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useAdminTrials(status?: string) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["admin", "subscriptions", status],
    queryFn: () => adminService.getTrialSignups(status).then((r) => r.data.results),
    enabled: isAuthenticated,
  });
}

export function useMarkTrialProvisioned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      provisioned_by,
    }: {
      id: string;
      provisioned_by: string;
    }) =>
      adminService.markTrialProvisioned(id, provisioned_by).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useAdminTraining() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["admin", "training"],
    queryFn: () =>
      adminService.getTrainingRegistrations().then((r) => r.data.results),
    enabled: isAuthenticated,
  });
}
