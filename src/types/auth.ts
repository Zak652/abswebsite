import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    company_name: z
      .string()
      .min(2, "Company name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const passwordResetConfirmSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    new_password_confirm: z.string(),
  })
  .refine((data) => data.new_password === data.new_password_confirm, {
    message: "Passwords do not match",
    path: ["new_password_confirm"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PasswordResetRequestFormData = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetConfirmFormData = z.infer<
  typeof passwordResetConfirmSchema
>;

export interface User {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  phone?: string;
  role: "client" | "admin";
  email_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  user: User;
}
