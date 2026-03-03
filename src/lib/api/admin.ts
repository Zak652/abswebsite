import { apiClient } from "./client";
import type { RFQSubmission } from "@/types/rfq";
import type { TrialSignup } from "@/types/subscription";
import type { TrainingRegistration } from "@/types/training";
import type { PaginatedResponse } from "@/types/api";

export interface AdminStats {
  new_rfqs_today: number;
  pending_trials: number;
  upcoming_training_headcount: number;
  total_rfqs: number;
  total_trials: number;
  total_registrations: number;
}

export const adminService = {
  getStats: () => apiClient.get<AdminStats>("/admin/stats/"),

  getRFQs: (status?: string) =>
    apiClient.get<PaginatedResponse<RFQSubmission>>("/admin/rfq/", {
      params: status ? { status } : {},
    }),

  updateRFQ: (
    id: string,
    data: { status?: string; admin_notes?: string }
  ) => apiClient.patch<RFQSubmission>(`/admin/rfq/${id}/`, data),

  getTrialSignups: (status?: string) =>
    apiClient.get<PaginatedResponse<TrialSignup>>("/admin/subscriptions/", {
      params: status ? { status } : {},
    }),

  markTrialProvisioned: (id: string, provisioned_by: string) =>
    apiClient.patch(`/admin/subscriptions/${id}/`, {
      status: "provisioned",
      provisioned_by,
    }),

  getTrainingRegistrations: () =>
    apiClient.get<PaginatedResponse<TrainingRegistration>>("/admin/training/"),
};
