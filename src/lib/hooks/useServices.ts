"use client";

import { useMutation } from "@tanstack/react-query";
import { servicesService } from "@/lib/api/services";
import type { ServiceRequestPayload } from "@/types/services";

export function useSubmitServiceRequest() {
  return useMutation({
    mutationFn: (data: ServiceRequestPayload) =>
      servicesService.submitRequest(data).then((r) => r.data),
  });
}
