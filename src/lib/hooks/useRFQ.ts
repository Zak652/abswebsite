"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { rfqService } from "@/lib/api/rfq";
import { useAuthStore } from "@/lib/store/authStore";
import type { RFQFormData } from "@/types/rfq";

export function useSubmitRFQ() {
  return useMutation({
    mutationFn: (data: RFQFormData) =>
      rfqService.submit(data).then((r) => r.data),
  });
}

export function useMyRFQs() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["rfq", "mine"],
    queryFn: () => rfqService.listMine().then((r) => r.data.results),
    enabled: isAuthenticated,
  });
}
