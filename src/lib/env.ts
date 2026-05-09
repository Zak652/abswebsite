import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

const baseSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

const prodOnlySchema = baseSchema.extend({
  JWT_SECRET: z.string().min(16),
  REVALIDATION_SECRET: z.string().min(16),
  DRAFT_MODE_SECRET: z.string().min(16),
});

const schema = isProd ? prodOnlySchema : baseSchema;

const parsed = schema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001",
  JWT_SECRET: process.env.JWT_SECRET,
  REVALIDATION_SECRET: process.env.REVALIDATION_SECRET,
  DRAFT_MODE_SECRET: process.env.DRAFT_MODE_SECRET,
});

if (!parsed.success) {
  console.error("Environment validation failed:", z.treeifyError(parsed.error));
  throw new Error(
    "Invalid environment variables. See preceding error for details. " +
      "In production every required value must be set; in development sane defaults are used.",
  );
}

export const env = parsed.data;
