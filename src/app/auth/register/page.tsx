import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your ABS Platform account to track quotes, manage your Arcplus subscription, and register for training.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold font-heading text-primary-900 tracking-tight">
              ABS
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-primary-900 font-heading">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Track quotes, manage subscriptions, and register for training
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-neutral-100 p-8">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          By creating an account you agree to ABS&apos;s{" "}
          <a href="#" className="underline hover:text-neutral-500">
            Terms of Service
          </a>
          .
        </p>
      </div>
    </div>
  );
}
