"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Check, XCircle, ArrowRight } from "lucide-react";

function PaymentConfirmContent() {
  const params = useSearchParams();
  const status = params.get("status");
  const txRef = params.get("tx_ref");

  const isSuccess = status === "successful" || status === "completed";

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {isSuccess ? (
          <>
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Check className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-primary-900 mb-4">
              Registration Confirmed!
            </h1>
            <p className="text-primary-900/60 mb-4">
              Your training session has been confirmed. You will receive a
              confirmation email with session details and joining instructions
              shortly.
            </p>
            {txRef && (
              <p className="text-xs text-neutral-400 mb-8 font-mono">
                Ref: {txRef}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/portal/training"
                className="inline-flex items-center gap-2 bg-primary-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-accent-500 transition-colors"
              >
                View My Registrations
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-6 py-3 rounded-xl font-medium hover:border-neutral-400 transition-colors"
              >
                Return Home
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-primary-900 mb-4">
              Payment Incomplete
            </h1>
            <p className="text-primary-900/60 mb-8">
              Your payment was not completed. Your registration is pending. If
              you believe this is an error, please contact us with your reference
              number.
            </p>
            {txRef && (
              <p className="text-xs text-neutral-400 mb-8 font-mono">
                Ref: {txRef}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/training"
                className="inline-flex items-center gap-2 bg-accent-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-accent-600 transition-colors"
              >
                Try Again
              </Link>
              <a
                href="mailto:support@absplatform.com"
                className="inline-flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-6 py-3 rounded-xl font-medium hover:border-neutral-400 transition-colors"
              >
                Contact Support
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="text-primary-900/40 text-sm">Loading...</div>
        </div>
      }
    >
      <PaymentConfirmContent />
    </Suspense>
  );
}
