"use client";

import Link from "next/link";
import { useResendEmailVerification } from "@/lib/hooks/useAuth";
import { useAuthStore } from "@/lib/store/authStore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

/**
 * Authenticated re-send: the request endpoint reads the user from the
 * access token, so this form has no inputs — one button, one mutation.
 * Anonymous users are bounced to /auth/login.
 */
export function ResendVerificationForm() {
  const { isAuthenticated } = useAuthStore();
  const { mutate, isPending, isSuccess, isError } =
    useResendEmailVerification();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-neutral-500">
          You need to be signed in to request a new verification email.
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

  if (isSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col gap-3 text-center"
      >
        <h2 className="text-lg font-semibold text-primary-900">Sent</h2>
        <p className="text-sm text-neutral-500">
          Check your inbox. The new link is valid for the next 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {isError && (
        <div
          role="alert"
          className="rounded-xl bg-[var(--color-error-light)] border border-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]"
        >
          We couldn&apos;t send the email right now. Please try again in a
          few minutes.
        </div>
      )}
      <button
        type="button"
        onClick={() => mutate()}
        disabled={isPending}
        className="h-11 rounded-xl bg-primary-900 text-white font-medium text-sm hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <LoadingSpinner size="sm" />
            Sending…
          </>
        ) : (
          "Send verification email"
        )}
      </button>
    </div>
  );
}
