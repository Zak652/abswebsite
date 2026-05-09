import { apiClient } from "./client";
import type { TrialSignupFormData, TrialSignup } from "@/types/subscription";
import type { PaginatedResponse } from "@/types/api";

export const subscriptionService = {
  submitTrial: (data: TrialSignupFormData) =>
    apiClient.post<{ id: string }>("/subscriptions/trial/", data),

  listMine: () => apiClient.get<PaginatedResponse<TrialSignup>>("/subscriptions/"),

  cancel: (id: string, reason?: string) =>
    apiClient.post<TrialSignup>(`/subscriptions/${id}/cancel/`, {
      reason: reason ?? "",
    }),
};
