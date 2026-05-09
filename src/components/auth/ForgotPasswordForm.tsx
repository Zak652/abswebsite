"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRequestPasswordReset } from "@/lib/hooks/useAuth";
import {
  passwordResetRequestSchema,
  type PasswordResetRequestFormData,
} from "@/types/auth";
import { FormInput } from "@/components/ui/FormInput";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function ForgotPasswordForm() {
  const { mutate, isPending, isSuccess, isError } = useRequestPasswordReset();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequestFormData>({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  const onSubmit = (data: PasswordResetRequestFormData) =>
    mutate(data.email);

  if (isSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col gap-3 text-center"
      >
        <h2 className="text-lg font-semibold text-primary-900">
          Check your inbox
        </h2>
        <p className="text-sm text-neutral-500">
          If an account exists for that email, we&apos;ve sent a link to
          reset your password. The link is valid for the next hour.
        </p>
        <p className="text-xs text-neutral-400">
          Didn&apos;t receive it? Check your spam folder, then try again
          in a few minutes.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      {isError && (
        <div
          role="alert"
          className="rounded-xl bg-[var(--color-error-light)] border border-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]"
        >
          Something went wrong. Please try again in a moment.
        </div>
      )}

      <FormInput
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        error={errors.email?.message}
        required
        {...register("email")}
      />

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-primary-900 text-white font-medium text-sm
          hover:bg-primary-700 transition-colors duration-200
          flex items-center justify-center gap-2
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <LoadingSpinner size="sm" />
            Sending…
          </>
        ) : (
          "Send reset link"
        )}
      </button>
    </form>
  );
}
