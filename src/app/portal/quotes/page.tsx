"use client";

import { useMyRFQs } from "@/lib/hooks/useRFQ";
import { QuoteCard } from "@/components/portal/QuoteCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FileText } from "lucide-react";
import Link from "next/link";

export default function PortalQuotesPage() {
  const { data: rfqs, isLoading } = useMyRFQs();

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 font-heading">
            My Quotes
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track the status of your RFQ submissions
          </p>
        </div>
        <Link
          href="/rfq"
          className="text-sm font-medium text-primary-500 hover:text-primary-900 transition-colors"
        >
          + New Quote
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : !rfqs || rfqs.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-neutral-100">
              <FileText className="w-6 h-6 text-neutral-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-neutral-700 mb-1">
            No quotes yet
          </p>
          <p className="text-xs text-neutral-400 mb-4">
            Submit an RFQ and our team will get back to you with a tailored
            proposal.
          </p>
          <Link
            href="/rfq"
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-900 rounded-xl px-5 py-2.5 transition-colors"
          >
            Submit RFQ
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rfqs.map((rfq) => (
            <QuoteCard key={rfq.id} rfq={rfq} />
          ))}
        </div>
      )}
    </div>
  );
}
