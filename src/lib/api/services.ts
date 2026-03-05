import { apiClient } from "./client";
import type { ServiceRequestPayload, ServiceRequest } from "@/types/services";

export const servicesService = {
  submitRequest: (data: ServiceRequestPayload) =>
    apiClient.post<ServiceRequest>("/services/requests/", data),
};
