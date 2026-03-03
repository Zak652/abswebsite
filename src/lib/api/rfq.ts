import { apiClient } from "./client";
import type { RFQFormData, RFQSubmission } from "@/types/rfq";
import type { PaginatedResponse } from "@/types/api";

export const rfqService = {
  submit: (data: RFQFormData) =>
    apiClient.post<{ id: string }>("/rfq/", data),

  listMine: () => apiClient.get<PaginatedResponse<RFQSubmission>>("/rfq/mine/"),
};
