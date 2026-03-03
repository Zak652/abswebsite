import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Case Studies | ABS Platform",
  description:
    "See how enterprises across Africa have transformed their asset management with ABS solutions.",
};

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-surface pt-24 pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-[var(--color-info-light)]">
            <BookOpen className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h1 className="text-4xl font-heading font-bold text-primary-900">
              Case Studies
            </h1>
            <p className="text-primary-900/60 mt-1">
              Real-world results from ABS customers
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-neutral-100 p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-primary-900 mb-4">
            Coming Soon
          </p>
          <p className="text-primary-900/60 max-w-md mx-auto mb-8">
            We&apos;re documenting our customer success stories. Check back
            soon for detailed case studies on how organizations are using ABS
            to manage their assets.
          </p>
          <Link
            href="/rfq"
            className="inline-flex items-center gap-2 bg-accent-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-accent-600 transition-colors"
          >
            Talk to Sales
          </Link>
        </div>
      </div>
    </div>
  );
}
