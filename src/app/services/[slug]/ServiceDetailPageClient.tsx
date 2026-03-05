"use client";

import { motion, type Variants } from "framer-motion";
import {
  ClipboardList,
  Search,
  Trash2,
  GraduationCap,
  Building2,
  CheckCircle,
  ArrowRight,
  Clock,
  Users,
  FileCheck,
  BarChart3,
} from "lucide-react";
import { ServiceIntakeForm } from "@/components/patterns/ServiceIntakeForm";
import type { ServiceType } from "@/types/services";

// ── Service Content Data ──────────────────────────────────────────

interface ServiceContent {
  eyebrow: string;
  heading: string;
  subheading: string;
  problemStatement: string;
  steps: { icon: React.ElementType; title: string; description: string }[];
  deliverables: string[];
  outcome: { metric: string; label: string };
}

const SERVICE_CONTENT: Record<string, ServiceContent> = {
  "asset-register": {
    eyebrow: "Asset Register Build",
    heading: "Your assets are somewhere. We'll find them all.",
    subheading:
      "Most organizations have 15-30% of their fixed assets unaccounted for. Our field teams tag, barcode, and register every item — giving you a verified, audit-ready asset database.",
    problemStatement:
      "Manual spreadsheets and annual guesswork leave your register inaccurate, your audits painful, and your finance team flying blind.",
    steps: [
      { icon: Users, title: "Site Survey", description: "Our team conducts a walkthrough of all locations to scope asset types, volumes, and access." },
      { icon: ClipboardList, title: "Tagging & Capture", description: "Each item is physically tagged with RFID or barcode, photographed, and recorded with condition notes." },
      { icon: FileCheck, title: "Data Validation", description: "Every scan is reconciled against existing records and discrepancies are flagged for review." },
      { icon: BarChart3, title: "Handover", description: "You receive a clean CSV/Excel export plus optional Arcplus import — fully audit-ready on day one." },
    ],
    deliverables: [
      "Verified asset register (CSV/Excel/Arcplus format)",
      "Barcode or RFID tags applied to all assets",
      "Condition ratings for each asset",
      "Discrepancy report vs. existing records",
      "Asset location map by floor/room",
      "Handover documentation",
    ],
    outcome: { metric: "99.7%", label: "average inventory accuracy post-register build" },
  },
  verification: {
    eyebrow: "Asset Verification",
    heading: "Trust your numbers again.",
    subheading:
      "An unverified register is a liability risk. Our verification service physically confirms every asset on your books is where it should be.",
    problemStatement:
      "Finance teams preparing for audits often discover significant gaps between what's recorded and what's actually on-site. That gap costs money and credibility.",
    steps: [
      { icon: Search, title: "Register Review", description: "We analyze your existing asset data and flag high-risk discrepancies before the field visit." },
      { icon: Users, title: "Physical Scan", description: "Field teams scan every asset using RFID or barcode readers, capturing current location and condition." },
      { icon: FileCheck, title: "Reconciliation", description: "Each record is matched to its physical counterpart. Missing, found, and misallocated assets are categorized." },
      { icon: BarChart3, title: "Certification Report", description: "You receive a signed verification report suitable for auditors, insurers, and regulators." },
    ],
    deliverables: [
      "Verification report with full reconciliation",
      "List of found assets not on register",
      "List of registered assets not found",
      "Location corrections for misallocated assets",
      "Condition updates on all assets",
      "Auditor-ready signoff documentation",
    ],
    outcome: { metric: "2 days", label: "typical turnaround for a 2,000-asset verification" },
  },
  disposal: {
    eyebrow: "Asset Disposal",
    heading: "Retire assets cleanly. No liability left behind.",
    subheading:
      "End-of-life assets create regulatory and environmental exposure if handled incorrectly. We manage the whole process — from data erasure to certified destruction.",
    problemStatement:
      "Improperly disposed assets can expose your organization to data breaches, environmental fines, and audit failures.",
    steps: [
      { icon: ClipboardList, title: "Asset Audit", description: "We catalogue all items for disposal, categorizing by type, condition, and applicable regulations." },
      { icon: FileCheck, title: "Data Erasure", description: "IT assets undergo certified data wiping with full chain of custody documentation." },
      { icon: Trash2, title: "Physical Disposal", description: "Assets are removed via auction, scrap, recycling, or certified destruction depending on type." },
      { icon: BarChart3, title: "Compliance Pack", description: "You receive a disposal certificate, erasure certificates, and e-waste compliance documentation." },
    ],
    deliverables: [
      "Complete disposal manifest",
      "Data erasure certificates (if applicable)",
      "E-waste compliance documentation",
      "Chain of custody records",
      "Disposal certificates for audit trail",
      "Register updates — assets removed from active books",
    ],
    outcome: { metric: "Zero", label: "compliance incidents across 200+ disposal projects" },
  },
  training: {
    eyebrow: "Training Programs",
    heading: "Your team, fully equipped to run Arcplus.",
    subheading:
      "Software only delivers value when your people know how to use it. Our trainers deliver hands-on, role-specific Arcplus training that sticks.",
    problemStatement:
      "Most software rollout failures aren't technology problems — they're adoption problems. Untrained users create workarounds that undermine the entire system.",
    steps: [
      { icon: Users, title: "Needs Assessment", description: "We interview key stakeholders to understand roles, current workflows, and training priorities." },
      { icon: ClipboardList, title: "Custom Curriculum", description: "Training is tailored to your Arcplus configuration, your asset types, and your team's skill levels." },
      { icon: GraduationCap, title: "Delivery", description: "In-person or virtual sessions for end-users, super-users, and administrators — at your pace." },
      { icon: FileCheck, title: "Certification", description: "Participants receive ABS Arcplus User Certification upon completion." },
    ],
    deliverables: [
      "Training needs assessment report",
      "Custom training curriculum",
      "Recorded session videos (virtual delivery)",
      "Quick-reference cards for each role",
      "ABS Arcplus User Certificates",
      "90-day post-training support access",
    ],
    outcome: { metric: "4.8/5", label: "average participant satisfaction rating" },
  },
  outsourcing: {
    eyebrow: "Full Asset Management Outsource",
    heading: "Hand over the headache. Keep the visibility.",
    subheading:
      "Not every organization needs an in-house asset management team. ABS manages your physical assets end-to-end while you retain full visibility through Arcplus.",
    problemStatement:
      "Building and retaining internal asset management expertise is expensive and slow. Outsourcing to ABS means instant access to field-tested processes and trained personnel.",
    steps: [
      { icon: ClipboardList, title: "Transition Planning", description: "We map your current processes, document the handover, and identify quick wins in the first 30 days." },
      { icon: Users, title: "Embedded Team", description: "ABS field engineers and analysts work on-site or remotely as an extension of your operations team." },
      { icon: BarChart3, title: "Ongoing Operations", description: "Regular audits, tag replacements, condition monitoring, and register maintenance on your schedule." },
      { icon: ArrowRight, title: "Reporting & Review", description: "Monthly KPI dashboards, quarterly reviews, and SLA-backed response times." },
    ],
    deliverables: [
      "Transition plan with 30/60/90-day milestones",
      "Dedicated ABS account manager + field team",
      "Monthly operational reports",
      "Arcplus platform management",
      "Annual physical verification included",
      "SLA: 98% register accuracy maintained",
    ],
    outcome: { metric: "40%", label: "average reduction in asset management cost vs. in-house" },
  },
};

const SERVICE_ICONS: Record<string, React.ElementType> = {
  "asset-register": ClipboardList,
  verification: Search,
  disposal: Trash2,
  training: GraduationCap,
  outsourcing: Building2,
};

// ── Animations ────────────────────────────────────────────────────

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ── Component ─────────────────────────────────────────────────────

interface ServiceDetailPageClientProps {
  slug: string;
  serviceType: ServiceType;
}

export function ServiceDetailPageClient({ slug, serviceType }: ServiceDetailPageClientProps) {
  const content = SERVICE_CONTENT[slug];
  const Icon = SERVICE_ICONS[slug] ?? ClipboardList;

  if (!content) return null;

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* 1. HERO */}
      <section className="pt-32 pb-20 bg-primary-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full bg-accent-500 blur-3xl -top-20 -right-20" />
          <div className="absolute w-64 h-64 rounded-full bg-primary-400 blur-3xl bottom-0 left-20" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-accent-500/20">
                <Icon className="w-6 h-6 text-accent-400" />
              </div>
              <span className="text-xs font-bold font-mono text-accent-400 uppercase tracking-widest">
                {content.eyebrow}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight mb-6 max-w-3xl">
              {content.heading}
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mb-8">{content.subheading}</p>
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
              <Clock className="w-4 h-4 text-accent-400 flex-shrink-0" />
              <p className="text-sm text-white/60">{content.problemStatement}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. PROCESS TIMELINE */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="py-24 bg-white"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="mb-16">
            <p className="text-xs font-bold font-mono text-accent-500 uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-900">
              Four steps to a verified result
            </h2>
          </motion.div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-200 hidden md:block" />

            <div className="space-y-8">
              {content.steps.map((step, idx) => (
                <motion.div key={idx} variants={fadeInUp} className="flex gap-8 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-900 text-white flex items-center justify-center font-bold font-mono text-sm relative z-10">
                    {idx + 1}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className="w-5 h-5 text-accent-500" />
                      <h3 className="text-lg font-bold font-heading text-primary-900">{step.title}</h3>
                    </div>
                    <p className="text-primary-900/60">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. DELIVERABLES */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="py-24 bg-neutral-50"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="mb-12">
            <p className="text-xs font-bold font-mono text-accent-500 uppercase tracking-widest mb-3">What You Get</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-900">
              Deliverables included in every engagement
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {content.deliverables.map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="flex items-start gap-4 bg-white rounded-2xl px-6 py-4 border border-neutral-200 shadow-sm"
              >
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-primary-900">{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* 4. OUTCOME */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="py-20 bg-primary-900 text-center"
      >
        <div className="max-w-xl mx-auto px-4">
          <p className="text-xs font-bold font-mono text-accent-400 uppercase tracking-widest mb-4">Proven Results</p>
          <div className="text-7xl md:text-8xl font-mono font-bold text-white mb-4">
            {content.outcome.metric}
          </div>
          <p className="text-xl text-white/70">{content.outcome.label}</p>
        </div>
      </motion.section>

      {/* 5. SERVICE INTAKE FORM */}
      <section className="py-24 bg-surface">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold font-mono text-accent-500 uppercase tracking-widest mb-3">Get Started</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-900">
              Tell us about your project
            </h2>
            <p className="text-primary-900/60 mt-4">
              We&apos;ll review your requirements and send a detailed scope proposal within 2 business days.
            </p>
          </div>
          <ServiceIntakeForm serviceType={serviceType} />
        </div>
      </section>
    </div>
  );
}
