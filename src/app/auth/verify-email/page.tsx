import type { Metadata } from "next";
import Link from "next/link";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";

export const metadata: Metadata = {
  title: "Resend verification email",
  description:
    "Request a new email verification link for your ABS Platform account.",
};

export default function ResendVerificationPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold font-heading text-primary-900 tracking-tight">
              ABS
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-primary-900 font-heading">
            Resend verification email
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            We&apos;ll send a fresh link to the address on your account.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-neutral-100 p-8">
          <ResendVerificationForm />
        </div>
      </div>
    </div>
  );
}
