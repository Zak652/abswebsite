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

export function useAdminAnalytics(period: 7 | 30 | 90 = 30) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["admin", "analytics", period],
    queryFn: () => adminService.getAnalytics(period).then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useAdminUsers(params?: { search?: string; role?: string }) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () =>
      adminService.getUsers(params).then((r) => r.data.results),
    enabled: isAuthenticated,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { is_active?: boolean; role?: string };
    }) => adminService.updateUser(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminProducts(params?: { category?: string }) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["admin", "products", params],
    queryFn: () => adminService.getProducts(params).then((r) => r.data),
    enabled: isAuthenticated,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof adminService.createProduct>[0]) =>
      adminService.createProduct(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

export function useUpdateAdminProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminService.updateProduct>[1] }) =>
      adminService.updateProduct(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

export function useAdminServiceRequests(params?: { service_type?: string; status?: string }) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["admin", "services", params],
    queryFn: () =>
      adminService.getServiceRequests(params).then((r) => r.data.results),
    enabled: isAuthenticated,
  });
}

export function useUpdateServiceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status?: string; admin_notes?: string };
    }) => adminService.updateServiceRequest(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "services"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
