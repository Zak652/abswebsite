import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Code2 } from "lucide-react";

export const metadata: Metadata = {
  title: "API Reference | ABS Platform",
  description:
    "REST API documentation for Arcplus — endpoints, authentication, webhooks, and integration guides.",
};

export default function ApiReferencePage() {
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
          <div className="p-3 rounded-2xl bg-[#F5F3FF]">
            <Code2 className="w-6 h-6 text-[#7C3AED]" />
          </div>
          <div>
            <h1 className="text-4xl font-heading font-bold text-primary-900">
              API Reference
            </h1>
            <p className="text-primary-900/60 mt-1">
              Integrate Arcplus with your systems
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-neutral-100 p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-primary-900 mb-4">
            API Docs Coming Soon
          </p>
          <p className="text-primary-900/60 max-w-md mx-auto mb-8">
            Arcplus API documentation is available to Growth plan and above
            subscribers. Contact your account manager to get early API access.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/arcplus#pricing"
              className="inline-flex items-center gap-2 bg-accent-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-accent-600 transition-colors"
            >
              View Plans
            </Link>
            <a
              href="mailto:support@absplatform.com"
              className="inline-flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-6 py-3 rounded-xl font-medium hover:border-neutral-400 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
