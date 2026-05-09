import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description:
    "Reset your ABS Platform password via the email address on your account.",
};

export default function ForgotPasswordPage() {
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
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            We&apos;ll email you a link to set a new one.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-neutral-100 p-8">
          <ForgotPasswordForm />
        </div>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Remembered it?{" "}
          <Link
            href="/auth/login"
            className="text-primary-500 font-medium hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
