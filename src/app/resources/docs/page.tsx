import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation | ABS Platform",
  description:
    "Technical documentation for Arcplus — setup guides, user manuals, and integration references.",
};

export default function DocsPage() {
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
          <div className="p-3 rounded-2xl bg-[var(--color-success-light)]">
            <FileText className="w-6 h-6 text-[var(--color-success)]" />
          </div>
          <div>
            <h1 className="text-4xl font-heading font-bold text-primary-900">
              Documentation
            </h1>
            <p className="text-primary-900/60 mt-1">
              Guides, references, and tutorials
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-neutral-100 p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-primary-900 mb-4">
            Docs Portal Coming Soon
          </p>
          <p className="text-primary-900/60 max-w-md mx-auto mb-8">
            The Arcplus documentation portal is under construction. In the
            meantime, your account manager can provide onboarding materials and
            user guides.
          </p>
          <a
            href="mailto:support@absplatform.com"
            className="inline-flex items-center gap-2 bg-primary-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-accent-500 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
