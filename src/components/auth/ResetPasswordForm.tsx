"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useConfirmPasswordReset } from "@/lib/hooks/useAuth";
import {
  passwordResetConfirmSchema,
  type PasswordResetConfirmFormData,
} from "@/types/auth";
import { FormInput } from "@/components/ui/FormInput";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function ResetPasswordForm({ token }: { token: string }) {
  const { mutate, isPending, isSuccess, error } = useConfirmPasswordReset();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetConfirmFormData>({
    resolver: zodResolver(passwordResetConfirmSchema),
  });

  const onSubmit = (data: PasswordResetConfirmFormData) =>
    mutate({
      token,
      new_password: data.new_password,
      new_password_confirm: data.new_password_confirm,
    });

  // Pull a single line of feedback from the API. We never echo raw
  // backend messages other than the curated "invalid or expired" case
  // — anything else collapses to a generic try-again line.
  const apiError =
    error && "response" in error
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((error as any).response?.data?.detail as string | undefined) ??
        "Something went wrong. Please try again."
      : null;

  if (isSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col gap-4 text-center"
      >
        <h2 className="text-lg font-semibold text-primary-900">
          Password updated
        </h2>
        <p className="text-sm text-neutral-500">
          You can now sign in with your new password. We&apos;ve also
          signed you out of any other devices for safety.
        </p>
        <Link
          href="/auth/login"
          className="h-11 rounded-xl bg-primary-900 text-white font-medium text-sm hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      {apiError && (
        <div
          role="alert"
          className="rounded-xl bg-[var(--color-error-light)] border border-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]"
        >
          {apiError}
        </div>
      )}

      <FormInput
        label="New password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        error={errors.new_password?.message}
        required
        {...register("new_password")}
      />

      <FormInput
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        error={errors.new_password_confirm?.message}
        required
        {...register("new_password_confirm")}
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
            Updating…
          </>
        ) : (
          "Update password"
        )}
      </button>

      <p className="text-center text-sm text-neutral-500">
        <Link
          href="/auth/login"
          className="text-primary-500 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
