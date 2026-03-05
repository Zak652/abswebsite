"use client";

import { useState } from "react";
import { ArrowLeft, Check, Copy, Code2 } from "lucide-react";
import Link from "next/link";

const ENDPOINTS = [
  {
    group: "Products",
    badgeClass: "bg-[var(--color-info-light)] text-primary-500",
    endpoints: [
      { method: "GET",   path: "/products",         description: "List all asset products in your catalogue" },
      { method: "GET",   path: "/products/{id}",    description: "Retrieve a single product record by ID" },
      { method: "POST",  path: "/products",         description: "Create a new product entry" },
      { method: "PATCH", path: "/products/{id}",    description: "Update product details or availability status" },
    ],
  },
  {
    group: "Services",
    badgeClass: "bg-[var(--color-success-light)] text-[var(--color-success)]",
    endpoints: [
      { method: "GET",   path: "/services",              description: "List all active service packages" },
      { method: "GET",   path: "/services/{id}",         description: "Get service details and SLA terms" },
      { method: "POST",  path: "/services/quote",        description: "Request a service quotation" },
      { method: "PATCH", path: "/services/{id}/status",  description: "Update a service engagement status" },
    ],
  },
  {
    group: "Training",
    badgeClass: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
    endpoints: [
      { method: "GET",  path: "/training/courses",               description: "List all available training modules" },
      { method: "GET",  path: "/training/enrollments",           description: "List enrollments for your organisation" },
      { method: "POST", path: "/training/enroll",                description: "Enroll one or more users in a course" },
      { method: "GET",  path: "/training/certificates/{userId}", description: "Fetch issued certificates for a user" },
    ],
  },
  {
    group: "Admin",
    badgeClass: "bg-[var(--color-error-light)] text-[var(--color-error)]",
    endpoints: [
      { method: "GET",   path: "/admin/users",            description: "List all users in your organisation" },
      { method: "POST",  path: "/admin/users/invite",     description: "Invite a new user to the platform" },
      { method: "PATCH", path: "/admin/users/{id}/role",  description: "Update a user'\''s platform role" },
      { method: "GET",   path: "/admin/audit-log",        description: "Retrieve the full platform audit log" },
    ],
  },
  {
    group: "Subscriptions",
    badgeClass: "bg-[#F5F3FF] text-[#7C3AED]",
    endpoints: [
      { method: "GET",  path: "/subscriptions/current",   description: "Get current plan details and usage data" },
      { method: "GET",  path: "/subscriptions/invoices",  description: "List all billing invoices" },
      { method: "POST", path: "/subscriptions/upgrade",   description: "Initiate a plan upgrade request" },
      { method: "GET",  path: "/subscriptions/usage",     description: "Retrieve API call usage statistics" },
    ],
  },
];

const METHOD_STYLES: Record<string, string> = {
  GET:    "bg-[var(--color-success-light)] text-[var(--color-success)]",
  POST:   "bg-[var(--color-info-light)] text-primary-500",
  PATCH:  "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
  DELETE: "bg-[var(--color-error-light)] text-[var(--color-error)]",
};

const FETCH_EXAMPLE = `const response = await fetch(
  "https://api.absplatform.com/v1/products",
  {
    method: "GET",
    headers: {
      "Authorization": "Bearer YOUR_API_TOKEN",
      "Content-Type": "application/json",
      "X-Org-ID": "your-organisation-id",
    },
  }
);

const data = await response.json();
// { products: [...], total: 142, page: 1 }
console.log(data.products);`;

function CopyButton({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
        copied
          ? "bg-[var(--color-success-light)] text-[var(--color-success)]"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      } ${className}`}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          Copy
        </>
      )}
    </button>
  );
}

export default function ApiReferencePage() {
  const [codeBlockCopied, setCodeBlockCopied] = useState(false);

  const handleCopyCodeBlock = async () => {
    await navigator.clipboard.writeText(FETCH_EXAMPLE);
    setCodeBlockCopied(true);
    setTimeout(() => setCodeBlockCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-surface pt-24 pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 rounded-2xl bg-[#F5F3FF]">
            <Code2 className="w-6 h-6 text-[#7C3AED]" />
          </div>
          <div>
            <h1 className="text-4xl font-heading font-bold text-primary-900">
              API Reference
            </h1>
            <p className="text-primary-900/60 mt-1">
              REST API for Arcplus &amp; hardware platform
            </p>
          </div>
        </div>

        {/* Auth Overview */}
        <div className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm mb-6">
          <h2 className="text-lg font-heading font-semibold text-primary-900 mb-1">
            Authentication
          </h2>
          <p className="text-sm text-primary-900/60 mb-5">
            All requests require a{" "}
            <code className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
              Bearer
            </code>{" "}
            token issued from your Arcplus admin console. Tokens are scoped per
            organisation and can be revoked at any time from Settings.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1 bg-neutral-50 border border-neutral-100 rounded-2xl p-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                Base URL
              </p>
              <code className="font-mono text-sm text-primary-900">
                https://api.absplatform.com/v1
              </code>
            </div>
            <div className="flex-1 bg-neutral-50 border border-neutral-100 rounded-2xl p-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                Auth Type
              </p>
              <code className="font-mono text-sm text-primary-900">
                Bearer Token (JWT)
              </code>
            </div>
            <div className="flex-1 bg-neutral-50 border border-neutral-100 rounded-2xl p-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                Rate Limit
              </p>
              <code className="font-mono text-sm text-primary-900">
                1,000 req / min
              </code>
            </div>
          </div>

          <div className="bg-primary-900 rounded-2xl p-5 overflow-x-auto">
            <p className="text-xs font-medium text-neutral-400 mb-3 uppercase tracking-widest">
              Request Header
            </p>
            <pre className="font-mono text-sm text-neutral-100 whitespace-pre leading-relaxed">{`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Org-ID:       org_01HXMK3N7VPQ8WBDCFZGT5YRE2
Content-Type:   application/json`}</pre>
          </div>
        </div>

        {/* Endpoint Groups */}
        <div className="space-y-5 mb-6">
          {ENDPOINTS.map((group) => (
            <div
              key={group.group}
              className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-neutral-100">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${group.badgeClass}`}
                >
                  {group.group}
                </span>
              </div>

              <div className="divide-y divide-neutral-100">
                {group.endpoints.map((ep) => (
                  <div
                    key={ep.path}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-neutral-50 transition-colors"
                  >
                    <span
                      className={`shrink-0 text-[11px] font-bold font-mono px-2.5 py-1 rounded-lg min-w-[52px] text-center ${
                        METHOD_STYLES[ep.method]
                      }`}
                    >
                      {ep.method}
                    </span>
                    <code className="font-mono text-sm text-primary-900 w-64 shrink-0 truncate">
                      {ep.path}
                    </code>
                    <p className="text-sm text-primary-900/60 flex-1 hidden md:block truncate">
                      {ep.description}
                    </p>
                    <CopyButton
                      text={`https://api.absplatform.com/v1${ep.path}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Code Example */}
        <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-heading font-semibold text-primary-900">
              Code Example
            </h2>
            <button
              onClick={handleCopyCodeBlock}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                codeBlockCopied
                  ? "bg-[var(--color-success-light)] text-[var(--color-success)]"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {codeBlockCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-primary-900/60 mb-4">
            Fetching all products using the JavaScript{" "}
            <code className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
              fetch()
            </code>{" "}
            API.
          </p>
          <div className="bg-primary-900 rounded-2xl p-5 overflow-x-auto">
            <pre className="font-mono text-sm text-neutral-100 whitespace-pre leading-relaxed">
              {FETCH_EXAMPLE}
            </pre>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-[#F5F3FF] rounded-3xl border border-[#EDE9FE] p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-heading font-semibold text-primary-900">
              Growth plan and above required for API access
            </p>
            <p className="text-sm text-primary-900/60 mt-1">
              API tokens are available on Growth and Enterprise tiers. Upgrade
              your plan to unlock programmatic access to Arcplus.
            </p>
          </div>
          <Link
            href="/arcplus#pricing"
            className="shrink-0 inline-flex items-center gap-2 bg-accent-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-accent-600 transition-colors text-sm"
          >
            View Pricing
          </Link>
        </div>

      </div>
    </div>
  );
}
