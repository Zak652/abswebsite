import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LifeBuoy, Mail, MessageSquare, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Support | ABS Platform",
  description:
    "Get help with Arcplus, hardware, or field services. Our support team is here to assist you.",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-surface pt-24 pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>

        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 rounded-2xl bg-accent-100">
            <LifeBuoy className="w-6 h-6 text-accent-500" />
          </div>
          <div>
            <h1 className="text-4xl font-heading font-bold text-primary-900">
              Support
            </h1>
            <p className="text-primary-900/60 mt-1">
              We&apos;re here to help
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <a
            href="mailto:support@absplatform.com"
            className="bg-white rounded-2xl border border-neutral-100 p-6 hover:border-accent-500 transition-colors group shadow-sm"
          >
            <Mail className="w-6 h-6 text-accent-500 mb-4" />
            <p className="font-semibold text-primary-900 mb-1 group-hover:text-accent-500 transition-colors">
              Email Support
            </p>
            <p className="text-sm text-primary-900/60">
              support@absplatform.com
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Response within 4 business hours
            </p>
          </a>

          <a
            href="mailto:sales@absplatform.com"
            className="bg-white rounded-2xl border border-neutral-100 p-6 hover:border-accent-500 transition-colors group shadow-sm"
          >
            <MessageSquare className="w-6 h-6 text-primary-500 mb-4" />
            <p className="font-semibold text-primary-900 mb-1 group-hover:text-accent-500 transition-colors">
              Sales Enquiries
            </p>
            <p className="text-sm text-primary-900/60">
              sales@absplatform.com
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              For quotes and commercial questions
            </p>
          </a>

          <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
            <Phone className="w-6 h-6 text-[var(--color-success)] mb-4" />
            <p className="font-semibold text-primary-900 mb-1">
              Phone Support
            </p>
            <p className="text-sm text-primary-900/60">
              Available to Enterprise plan customers
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Contact your account manager for number
            </p>
          </div>
        </div>

        <div className="bg-primary-900 rounded-3xl p-8 text-center">
          <p className="text-xl font-heading font-bold text-white mb-3">
            Need urgent help?
          </p>
          <p className="text-white/70 mb-6 max-w-md mx-auto">
            For critical production issues, include &ldquo;URGENT&rdquo; in
            your email subject line and we will prioritize your ticket.
          </p>
          <a
            href="mailto:support@absplatform.com?subject=URGENT: "
            className="inline-flex items-center gap-2 bg-accent-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-accent-600 transition-colors"
          >
            Send Urgent Request
          </a>
        </div>
      </div>
    </div>
  );
}
