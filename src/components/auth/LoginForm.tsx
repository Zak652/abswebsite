"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useLogin } from "@/lib/hooks/useAuth";
import { loginSchema, type LoginFormData } from "@/types/auth";
import { FormInput } from "@/components/ui/FormInput";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function LoginForm() {
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => login(data);

  const apiError =
    error && "response" in error
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).response?.data?.non_field_errors?.[0] ??
      "Login failed. Please check your credentials."
      : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {apiError && (
        <div
          role="alert"
          className="rounded-xl bg-[var(--color-error-light)] border border-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]"
        >
          {apiError}
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

      <FormInput
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        required
        {...register("password")}
      />

      <div className="flex items-center justify-end">
        <Link
          href="/auth/forgot-password"
          className="text-sm text-primary-500 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

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
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </button>

      <p className="text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-primary-500 font-medium hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
