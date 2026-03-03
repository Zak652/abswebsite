"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRegister } from "@/lib/hooks/useAuth";
import { registerSchema, type RegisterFormData } from "@/types/auth";
import { FormInput } from "@/components/ui/FormInput";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function RegisterForm() {
  const { mutate: register, isPending, error } = useRegister();

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => register(data);

  const apiError =
    error && "response" in error
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).response?.data?.email?.[0] ??
      (error as any).response?.data?.non_field_errors?.[0] ??
      "Registration failed. Please try again."
      : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {apiError && (
        <div
          role="alert"
          className="rounded-xl bg-[var(--color-error-light)] border border-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]"
        >
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Jane Mwangi"
          error={errors.full_name?.message}
          required
          {...formRegister("full_name")}
        />
        <FormInput
          label="Company name"
          type="text"
          autoComplete="organization"
          placeholder="Acme Ltd"
          error={errors.company_name?.message}
          required
          {...formRegister("company_name")}
        />
      </div>

      <FormInput
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        error={errors.email?.message}
        required
        {...formRegister("email")}
      />

      <FormInput
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        placeholder="+256 700 000 000"
        error={errors.phone?.message}
        {...formRegister("phone")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          required
          {...formRegister("password")}
        />
        <FormInput
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password_confirm?.message}
          required
          {...formRegister("password_confirm")}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-primary-900 text-white font-medium text-sm
          hover:bg-primary-700 transition-colors duration-200
          flex items-center justify-center gap-2 mt-1
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <LoadingSpinner size="sm" />
            Creating account…
          </>
        ) : (
          "Create Account"
        )}
      </button>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-primary-500 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
