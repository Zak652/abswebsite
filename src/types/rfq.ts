import { z } from "zod";

export const rfqSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  company_name: z.string().min(2, "Company name is required"),
  needs_hardware: z.boolean(),
  needs_software: z.boolean(),
  needs_services: z.boolean(),
  asset_count_range: z.string().min(1, "Please select an asset count range"),
  location_count: z.string().optional(),
  additional_notes: z.string().optional(),
});

export type RFQFormData = z.infer<typeof rfqSchema>;

export interface RFQSubmission {
  id: string;
  email: string;
  company_name: string;
  needs_hardware: boolean;
  needs_software: boolean;
  needs_services: boolean;
  asset_count_range: string;
  location_count: string;
  additional_notes: string;
  status: "new" | "reviewing" | "quoted" | "closed";
  created_at: string;
}
