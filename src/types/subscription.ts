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

export type SubscriptionStatus =
  | "pending"
  | "provisioned"
  | "active"
  | "converted"
  | "expired"
  | "cancelled";

// Statuses from which the user can cancel their own trial. Mirrors
// `ArcplusTrialSignup.CANCELLABLE_STATUSES` on the backend.
export const CANCELLABLE_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "pending",
  "provisioned",
  "active",
]);

export interface TrialSignup {
  id: string;
  email: string;
  company_name: string;
  full_name: string;
  plan: "starter" | "growth" | "professional" | "enterprise";
  status: SubscriptionStatus;
  cancelled_at: string | null;
  created_at: string;
}
