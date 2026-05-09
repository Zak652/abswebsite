import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Choose a new password for your ABS Platform account.",
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

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
            Choose a new password
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Make it at least 8 characters and easy for you to remember.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-neutral-100 p-8">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
