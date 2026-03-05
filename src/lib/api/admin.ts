import { apiClient } from "./client";
import type { RFQSubmission } from "@/types/rfq";
import type { TrialSignup } from "@/types/subscription";
import type { TrainingRegistration } from "@/types/training";
import type { PaginatedResponse } from "@/types/api";
import type { ServiceRequest } from "@/types/services";
import type { Product } from "@/types/products";

export interface AdminStats {
  new_rfqs_today: number;
  pending_trials: number;
  upcoming_training_headcount: number;
  total_rfqs: number;
  total_trials: number;
  total_registrations: number;
  new_service_requests: number;
}

export interface AdminAnalytics {
  period_days: number;
  revenue: {
    total_rfq_value: number;
    avg_rfq_value: number;
    rfq_count: number;
  };
  trials: {
    new_signups: number;
    provisioned: number;
    expired: number;
    conversion_rate: number;
  };
  rfqs_by_status: Record<string, number>;
  training: {
    registrations: number;
    revenue: number;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export const adminService = {
  // ── Stats & Analytics ────────────────────────────────────────────
  getStats: () => apiClient.get<AdminStats>("/admin/stats/"),

  getAnalytics: (period: 7 | 30 | 90 = 30) =>
    apiClient.get<AdminAnalytics>("/admin/analytics/", {
      params: { period },
    }),

  // ── RFQs ─────────────────────────────────────────────────────────
  getRFQs: (status?: string) =>
    apiClient.get<PaginatedResponse<RFQSubmission>>("/admin/rfq/", {
      params: status ? { status } : {},
    }),

  updateRFQ: (
    id: string,
    data: { status?: string; admin_notes?: string }
  ) => apiClient.patch<RFQSubmission>(`/admin/rfq/${id}/`, data),

  exportRFQs: () =>
    apiClient.get<Blob>("/admin/export/rfq/", { responseType: "blob" }),

  // ── Trial Signups ─────────────────────────────────────────────────
  getTrialSignups: (status?: string) =>
    apiClient.get<PaginatedResponse<TrialSignup>>("/admin/subscriptions/", {
      params: status ? { status } : {},
    }),

  markTrialProvisioned: (id: string, provisioned_by: string) =>
    apiClient.patch(`/admin/subscriptions/${id}/`, {
      status: "provisioned",
      provisioned_by,
    }),

  exportTrials: () =>
    apiClient.get<Blob>("/admin/export/trials/", { responseType: "blob" }),

  // ── Training ──────────────────────────────────────────────────────
  getTrainingRegistrations: () =>
    apiClient.get<PaginatedResponse<TrainingRegistration>>("/admin/training/"),

  exportTraining: () =>
    apiClient.get<Blob>("/admin/export/training/", { responseType: "blob" }),

  // ── Users ─────────────────────────────────────────────────────────
  getUsers: (params?: { search?: string; role?: string }) =>
    apiClient.get<PaginatedResponse<AdminUser>>("/admin/users/", { params }),

  updateUser: (id: string, data: { is_active?: boolean; role?: string }) =>
    apiClient.patch<AdminUser>(`/admin/users/${id}/`, data),

  // ── Products ──────────────────────────────────────────────────────
  getProducts: (params?: { category?: string }) =>
    apiClient.get<Product[]>("/admin/products/", { params }),

  createProduct: (data: Partial<Product>) =>
    apiClient.post<Product>("/admin/products/", data),

  updateProduct: (id: string, data: Partial<Product>) =>
    apiClient.patch<Product>(`/admin/products/${id}/`, data),

  deleteProduct: (id: string) =>
    apiClient.delete(`/admin/products/${id}/`),

  // ── Service Requests ──────────────────────────────────────────────
  getServiceRequests: (params?: { service_type?: string; status?: string }) =>
    apiClient.get<PaginatedResponse<ServiceRequest>>("/admin/services/", { params }),

  updateServiceRequest: (
    id: string,
    data: { status?: string; admin_notes?: string }
  ) => apiClient.patch<ServiceRequest>(`/admin/services/${id}/`, data),
};
