import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Building2, Plane, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Case Studies | ABS Platform",
  description:
    "See how enterprises across Africa have transformed their asset management with ABS solutions.",
};

const CASE_STUDIES = [
  {
    id: "lamu-county",
    organisation: "Lamu County Government",
    country: "Kenya",
    heroMetric: "100%",
    heroLabel: "Asset visibility across 47 departments",
    quote:
      "Achieved 100% asset visibility across 47 departments",
    sector: "Government",
    sectorIcon: Building2,
    sectorColor: "bg-[var(--color-info-light)] text-primary-500",
    assets: "12,400",
    challenge:
      "Manual spreadsheets and disconnected registers were causing recurring audit failures. Ghost assets inflated the county balance sheet by an estimated KES 2.4M, and annual stock-takes took six weeks to complete.",
    solution:
      "Full Arcplus platform deployment combined with ABS Asset Verification Service. All departments onboarded simultaneously using phased data migration from legacy Excel registers.",
    results: [
      { metric: "68%", label: "reduction in ghost assets" },
      { metric: "14 days", label: "to full compliance" },
      { metric: "KES 2.4M", label: "recovered in written-off assets" },
    ],
    accentColor: "bg-primary-500",
    delay: "0ms",
  },
  {
    id: "pan-african-airways",
    organisation: "Pan African Airways",
    country: "Uganda",
    heroMetric: "40%",
    heroLabel: "Reduction in equipment downtime",
    quote:
      "Reduced equipment downtime by 40% with predictive maintenance",
    sector: "Aviation MRO",
    sectorIcon: Plane,
    sectorColor: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
    assets: "8,200",
    challenge:
      "Ground support equipment was untracked between flights, leading to last-minute scrambles that caused an average of 11 delay events per month. Maintenance schedules were paper-based and not linked to actual asset usage.",
    solution:
      "RFID UHF tagging of all ground support equipment combined with the Arcplus Operations module. Real-time location tracking integrated with the flight operations scheduling system.",
    results: [
      { metric: "40%", label: "less equipment downtime" },
      { metric: "Real-time", label: "location tracking across apron" },
      { metric: "ISO 55001", label: "certified post-deployment" },
    ],
    accentColor: "bg-accent-500",
    delay: "120ms",
  },
  {
    id: "nairobi-metro",
    organisation: "Nairobi Metropolitan Services",
    country: "Kenya",
    heroMetric: "28K",
    heroLabel: "Assets digitized in 3 weeks",
    quote:
      "Digitized 28,000 assets in 3 weeks",
    sector: "Public Utilities",
    sectorIcon: Zap,
    sectorColor: "bg-[var(--color-success-light)] text-[var(--color-success)]",
    assets: "28,000",
    challenge:
      "No centralized asset register existed. Infrastructure assets — spanning roads, water networks, and municipal buildings — were aging with no lifecycle visibility. Capital budget decisions were made on incomplete data.",
    solution:
      "ABS Asset Register Build service combined with Arcplus Starter plan. Field teams used mobile barcode scanning for rapid data capture; QA pipeline validated asset records in real time.",
    results: [
      { metric: "28K", label: "assets registered at launch" },
      { metric: "3 weeks", label: "full deployment timeline" },
      { metric: "72%", label: "cost reduction vs manual audit" },
    ],
    accentColor: "bg-[var(--color-success)]",
    delay: "240ms",
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-surface pt-24 pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-2xl bg-[var(--color-info-light)]">
            <BookOpen className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h1 className="text-4xl font-heading font-bold text-primary-900">
              Case Studies
            </h1>
            <p className="text-primary-900/60 mt-1">
              Real-world results from ABS customers across Africa
            </p>
          </div>
        </div>

        <p className="text-primary-900/60 max-w-2xl mb-14 ml-0">
          From county governments to aviation MROs, organisations across the
          continent are using Arcplus and ABS services to transform how they
          manage physical assets.
        </p>

        {/* Case Study Cards */}
        <div className="space-y-8">
          {CASE_STUDIES.map((cs, index) => {
            const SectorIcon = cs.sectorIcon;
            return (
              <div
                key={cs.id}
                className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden"
                style={{
                  animationName: "fadeInUp",
                  animationDuration: "0.55s",
                  animationTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
                  animationFillMode: "both",
                  animationDelay: cs.delay,
                }}
              >
                {/* Card top accent bar */}
                <div className={`h-1 w-full ${cs.accentColor}`} />

                <div className="p-8">
                  {/* Card Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                    <div>
                      {/* Sector badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-3 ${cs.sectorColor}`}
                      >
                        <SectorIcon className="w-3.5 h-3.5" />
                        {cs.sector}
                      </span>
                      <h2 className="text-2xl font-heading font-bold text-primary-900">
                        {cs.organisation}
                      </h2>
                      <p className="text-sm text-primary-900/50 mt-0.5">
                        {cs.country} &middot; {cs.assets} assets managed
                      </p>
                    </div>

                    {/* Hero Metric */}
                    <div className="sm:text-right shrink-0">
                      <p className="text-5xl font-heading font-bold text-accent-500 leading-none">
                        {cs.heroMetric}
                      </p>
                      <p className="text-sm text-primary-900/60 mt-1 max-w-[200px] sm:ml-auto">
                        {cs.heroLabel}
                      </p>
                    </div>
                  </div>

                  {/* Challenge + Solution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                        Challenge
                      </p>
                      <p className="text-sm text-primary-900/70 leading-relaxed">
                        {cs.challenge}
                      </p>
                    </div>
                    <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                        Solution
                      </p>
                      <p className="text-sm text-primary-900/70 leading-relaxed">
                        {cs.solution}
                      </p>
                    </div>
                  </div>

                  {/* Results Row */}
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {cs.results.map((result) => (
                      <div
                        key={result.label}
                        className="bg-surface rounded-2xl border border-neutral-100 p-4 text-center"
                      >
                        <p className="text-xl font-heading font-bold text-primary-900">
                          {result.metric}
                        </p>
                        <p className="text-xs text-primary-900/55 mt-1 leading-snug">
                          {result.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-primary-900/40 italic">
                      &ldquo;{cs.quote}&rdquo;
                    </p>
                    <Link
                      href="/rfq"
                      className="shrink-0 ml-4 inline-flex items-center gap-2 bg-primary-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-accent-500 transition-colors"
                    >
                      Read full story
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-primary-900 rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-heading font-bold text-white mb-3">
            Ready to transform your asset management?
          </h2>
          <p className="text-primary-100/70 max-w-xl mx-auto mb-8 text-sm leading-relaxed">
            Join organisations across Kenya, Uganda, and beyond that are using
            Arcplus to gain full asset visibility, reduce waste, and meet
            compliance requirements faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/rfq"
              className="inline-flex items-center justify-center gap-2 bg-accent-500 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-accent-600 transition-colors"
            >
              Request a Quote
            </Link>
            <Link
              href="/arcplus"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 px-7 py-3.5 rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Explore Arcplus
            </Link>
          </div>
        </div>

      </div>

      {/* Keyframe animation defined inline so it works without globals.css edits */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
