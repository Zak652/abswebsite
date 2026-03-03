import { apiClient } from "./client";
import type { TrainingSession, TrainingRegistration } from "@/types/training";
import type { PaginatedResponse } from "@/types/api";

export const trainingService = {
  getSessions: () =>
    apiClient.get<PaginatedResponse<TrainingSession>>("/training/sessions/"),

  register: (data: {
    session: string;
    email: string;
    company_name: string;
    full_name: string;
    phone?: string;
    team_size?: number;
  }) =>
    apiClient.post<{ id: string; payment_link: string | null }>(
      "/training/register/",
      data
    ),

  listMyRegistrations: () =>
    apiClient.get<PaginatedResponse<TrainingRegistration>>("/training/registrations/"),
};
