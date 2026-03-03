import { z } from "zod";

export const trialSignupSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  company_name: z.string().min(2, "Company name is required"),
  full_name: z.string().min(2, "Full name is required"),
  phone: z.string().optional(),
  plan: z.enum(["starter", "growth", "professional", "enterprise"]),
  asset_count_estimate: z.string().optional(),
});

export type TrialSignupFormData = z.infer<typeof trialSignupSchema>;

export interface TrialSignup {
  id: string;
  email: string;
  company_name: string;
  full_name: string;
  plan: "starter" | "growth" | "professional" | "enterprise";
  status: "pending" | "provisioned" | "active" | "converted" | "expired";
  created_at: string;
}
