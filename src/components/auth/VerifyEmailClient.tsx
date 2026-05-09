"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useConfirmEmailVerification } from "@/lib/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { parseApiError } from "@/lib/api/errors";

/**
 * Client island that consumes the email-verification token from the
 * URL on mount, posts it to the backend, and renders one of three
 * states (loading, verified, expired/used). The page itself is a
 * server component so the metadata stays static and the token never
 * round-trips through Next's data layer.
 */
export function VerifyEmailClient({ token }: { token: string }) {
  const { mutate, isPending, isSuccess, isError, error } =
    useConfirmEmailVerification();

  useEffect(() => {
    if (token) mutate(token);
    // Run once per token change. The mutation's own state guards
    // against double-firing in StrictMode dev re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <LoadingSpinner />
        <p className="text-sm text-neutral-500">Verifying your email…</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-4 text-center">
        <h1 className="text-2xl font-bold text-primary-900 font-heading">
          Email verified ✓
        </h1>
        <p className="text-sm text-neutral-500">
          Thanks — your account is fully active. You can now access every
          part of the portal.
        </p>
        <Link
          href="/portal"
          className="h-11 rounded-xl bg-primary-900 text-white font-medium text-sm hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center"
        >
          Go to portal
        </Link>
      </div>
    );
  }

  if (isError) {
    const detail = error ? parseApiError(error).message : "Something went wrong.";
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-2xl font-bold text-primary-900 font-heading">
          Verification failed
        </h1>
        <p role="alert" className="text-sm text-neutral-500">
          {detail}
        </p>
        <Link
          href="/auth/verify-email"
          className="h-11 rounded-xl bg-primary-900 text-white font-medium text-sm hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center"
        >
          Send a new link
        </Link>
        <Link
          href="/auth/login"
          className="text-sm text-primary-500 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return null;
}
