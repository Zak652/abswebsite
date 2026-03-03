import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your ABS Platform account to manage quotes, subscriptions, and training registrations.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold font-heading text-primary-900 tracking-tight">
              ABS
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-primary-900 font-heading">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Sign in to your ABS account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-neutral-100 p-8">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          By signing in you agree to ABS&apos;s{" "}
          <a href="#" className="underline hover:text-neutral-500">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-neutral-500">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
