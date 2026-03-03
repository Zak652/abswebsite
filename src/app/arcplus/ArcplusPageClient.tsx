"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  X,
  ChevronDown,
  Shield,
  Activity,
  RefreshCw,
  Layers,
  Database,
  Truck,
  Wrench,
  Trash2,
} from "lucide-react";
import { TrialSignupModal } from "@/components/subscriptions/TrialSignupModal";

// --- Data Models ---

const modules = [
  {
    id: "register",
    name: "Register",
    icon: Database,
    color: "bg-blue-50 text-blue-600",
    capability: "Centralized asset database to log and identify every piece of equipment.",
    detail: "Create digital twins of physical assets. Standardize naming conventions, assign unique identifiers (barcodes/RFID), and categorize equipment instantly.",
  },
  {
    id: "operations",
    name: "Operations",
    icon: Activity,
    color: "bg-green-50 text-green-600",
    capability: "Track assignments, locations, and utilization in real-time.",
    detail: "Know exactly who has what and where. Manage check-in/check-out processes, perform audits, and locate missing equipment efficiently.",
  },
  {
    id: "depreciation",
    name: "Depreciation",
    icon: Layers,
    color: "bg-purple-50 text-purple-600",
    capability: "Automated calculations for straight-line and declining balance.",
    detail: "Keep finance aligned with operations. Automatically calculate monthly and annual depreciation values for accurate financial reporting.",
  },
  {
    id: "disposal",
    name: "Disposal",
    icon: Trash2,
    color: "bg-red-50 text-red-600",
    capability: "Secure end-of-life workflows and compliance proof.",
    detail: "Retire assets cleanly. Generate disposal certificates, manage e-waste compliance, and remove written-off assets from active registers.",
  },
  {
    id: "aacsm",
    name: "AACSM",
    icon: Shield,
    color: "bg-indigo-50 text-indigo-600",
    capability: "Asset Acquisition & Construction Supervision Module.",
    detail: "Track capital projects from procurement to commissioning. Monitor construction milestones and automatically register newly completed assets.",
  },
  {
    id: "stock",
    name: "Stock",
    icon: BoxIcon,
    color: "bg-orange-50 text-orange-600",
    capability: "Inventory and consumable management directly tied to assets.",
    detail: "Track spare parts and consumables. Set minimum viable stock levels and automate reorder alerts for critical components.",
  },
  {
    id: "fleet",
    name: "Fleet",
    icon: Truck,
    color: "bg-slate-50 text-slate-800",
    capability: "Vehicle tracking, licensing, and compliance tracking.",
    detail: "Manage your vehicle fleet. Track MOT dates, tax renewals, fuel consumption, and driver assignments in one place.",
  },
  {
    id: "maintenance",
    name: "Maintenance",
    icon: Wrench,
    color: "bg-rose-50 text-rose-600",
    capability: "Preventive schedules and reactive work orders.",
    detail: "Minimize downtime. Schedule routine maintenance, assign work orders, and track repair costs against asset value.",
  },
];

function BoxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

const lifecycleSteps = ["Register", "Operate", "Maintain", "Depreciate", "Dispose"];

const pricingPlans = [
  {
    name: "Starter",
    plan: "starter" as const,
    assets: "Up to 1,000",
    priceAnnual: 4500,
    priceMonthly: Math.round(4500 / 12 / 0.85),
    recommended: false,
    features: ["Core asset register", "Mobile scanning app", "Standard reporting", "Email support", "1 user seat", "Basic import/export"],
  },
  {
    name: "Growth",
    plan: "growth" as const,
    assets: "1,001–5,000",
    priceAnnual: 7500,
    priceMonthly: Math.round(7500 / 12 / 0.85),
    recommended: true,
    features: ["Everything in Starter", "Maintenance module", "API Access", "Priority support", "Custom fields", "5 user seats", "Audit trails"],
  },
  {
    name: "Professional",
    plan: "professional" as const,
    assets: "5,001–20,000",
    priceAnnual: 12500,
    priceMonthly: Math.round(12500 / 12 / 0.85),
    recommended: false,
    features: ["Everything in Growth", "Depreciation module", "Fleet tracking", "SSO integration", "Dedicated success manager", "Unlimited seats", "Webhooks"],
  },
  {
    name: "Enterprise",
    plan: "enterprise" as const,
    assets: "Unlimited",
    priceAnnual: null,
    priceMonthly: null,
    recommended: false,
    features: ["Everything in Professional", "On-premise option", "Custom ERP integration", "White labeling", "24/7 SLA", "Custom training", "Data residency"],
  },
];

const featureComparison = [
  { feature: "Asset Register", starter: true, growth: true, pro: true, enterprise: true },
  { feature: "Mobile App", starter: true, growth: true, pro: true, enterprise: true },
  { feature: "Barcode Scanning", starter: true, growth: true, pro: true, enterprise: true },
  { feature: "RFID Support", starter: false, growth: true, pro: true, enterprise: true },
  { feature: "Maintenance Module", starter: false, growth: true, pro: true, enterprise: true },
  { feature: "API Access", starter: false, growth: true, pro: true, enterprise: true },
  { feature: "Depreciation Module", starter: false, growth: false, pro: true, enterprise: true },
  { feature: "Fleet Tracking", starter: false, growth: false, pro: true, enterprise: true },
  { feature: "SSO Integration", starter: false, growth: false, pro: true, enterprise: true },
  { feature: "On-Premise Deployment", starter: false, growth: false, pro: false, enterprise: true },
  { feature: "Custom ERP Integration", starter: false, growth: false, pro: false, enterprise: true },
  { feature: "White Labeling", starter: false, growth: false, pro: false, enterprise: true },
  { feature: "24/7 SLA", starter: false, growth: false, pro: false, enterprise: true },
];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export function ArcplusPageClient() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [billingAnnual, setBillingAnnual] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [showFeatureComparison, setShowFeatureComparison] = useState(false);
  const [trialModal, setTrialModal] = useState<{
    open: boolean;
    plan: "starter" | "growth" | "professional" | "enterprise";
  }>({ open: false, plan: "growth" });

  const nextStep = () => setActiveStep((prev) => (prev + 1) % lifecycleSteps.length);

  const openTrialModal = (plan: typeof trialModal.plan = "growth") => {
    setTrialModal({ open: true, plan });
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface overflow-x-hidden">
      {/* 1. HERO & PLATFORM INTRO */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-7xl font-heading font-bold text-primary-900 tracking-tight mb-6"
        >
          Arcplus Platform
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xl text-primary-900/60 max-w-3xl mx-auto mb-16"
        >
          The enterprise nervous system for your physical assets. Eight powerful
          modules working in perfect sync to digitize every stage of the
          lifecycle.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <button
            onClick={() => openTrialModal("growth")}
            className="bg-accent-500 text-white px-8 py-4 rounded-full font-medium hover:bg-accent-600 transition-colors"
          >
            Start Free Trial
          </button>
          <Link
            href="/rfq"
            className="bg-transparent border border-primary-900/20 text-primary-900 px-8 py-4 rounded-full font-medium hover:border-primary-900/40 transition-colors"
          >
            Get Quote
          </Link>
        </motion.div>

        <motion.div
          className="mt-16 w-full max-w-5xl mx-auto rounded-[2rem] overflow-hidden shadow-2xl relative h-[400px] md:h-[600px] border border-neutral-200"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Image
            src="/images/arcplus_hero.png"
            alt="Arcplus Enterprise Dashboard on Laptop"
            fill
            className="object-cover"
            priority
          />
        </motion.div>
      </section>

      {/* 2. MODULES SHOWCASE */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative"
      >
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {modules.map((mod) => (
            <motion.div
              key={mod.id}
              variants={fadeInUp}
              onClick={() =>
                setActiveModule(activeModule === mod.id ? null : mod.id)
              }
              className={`cursor-pointer group relative bg-white p-6 rounded-3xl border border-neutral-100 hover:border-accent-500 transition-colors shadow-sm hover:shadow-md overflow-hidden h-48 flex flex-col justify-center items-center text-center ${activeModule === mod.id ? "ring-2 ring-accent-500" : ""
                }`}
              whileHover={{ y: -4 }}
            >
              <div className={`p-4 rounded-full mb-4 ${mod.color}`}>
                <mod.icon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold font-heading text-primary-900">
                {mod.name}
              </h3>

              <div className="absolute inset-0 bg-primary-900 p-6 text-left opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center">
                <h3 className="text-sm font-bold font-mono text-accent-500 mb-2">
                  {mod.name}
                </h3>
                <p className="text-white text-sm">{mod.capability}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {activeModule && (
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, height: 0, marginTop: 24 }}
              animate={{ opacity: 1, height: "auto", marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="bg-primary-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden"
            >
              <button
                onClick={() => setActiveModule(null)}
                className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close details"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 rounded-2xl bg-white/10">
                  {(() => {
                    const ModIcon =
                      modules.find((m) => m.id === activeModule)?.icon ||
                      Database;
                    return <ModIcon className="w-8 h-8 text-accent-500" />;
                  })()}
                </div>
                <h3 className="text-3xl font-heading font-bold">
                  {modules.find((m) => m.id === activeModule)?.name}
                </h3>
              </div>

              <p className="text-xl text-white/80 max-w-3xl leading-relaxed">
                {modules.find((m) => m.id === activeModule)?.detail}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* 3. DASHBOARD PREVIEW & LIFECYCLE FLOW */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="py-32 bg-primary-900 text-white mt-16 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeInUp}>
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                Visual Lifecycle Management
              </h2>
              <p className="text-xl text-white/70 mb-12">
                See exactly where your assets are in their lifecycle context.
                The Arcplus dashboard acts as a single pane of glass.
              </p>

              <div className="space-y-6">
                {lifecycleSteps.map((step, idx) => (
                  <button
                    key={step}
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 flex items-center justify-between ${activeStep === idx
                        ? "bg-accent-500/10 border-accent-500 text-white"
                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                      }`}
                  >
                    <span className="text-xl font-medium">{step}</span>
                    {activeStep === idx && (
                      <ArrowRight className="w-5 h-5 text-accent-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="relative aspect-[4/3] bg-[#0f172a] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-[#1e293b] p-4 flex items-center space-x-4 border-b border-white/10">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="text-xs font-mono text-white/50">
                  Arcplus Dashboard Overview
                </div>
              </div>

              <div className="flex-1 p-8 flex items-center justify-center relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                    className="text-center"
                  >
                    <div className="w-32 h-32 mx-auto mb-6 bg-accent-500/20 rounded-full flex items-center justify-center border border-accent-500/50 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                      <RefreshCw
                        className={`w-12 h-12 text-accent-500 ${activeStep % 2 === 0
                            ? "animate-spin-slow"
                            : "animate-bounce"
                          }`}
                        style={{ animationDuration: "3s" }}
                      />
                    </div>
                    <h3 className="text-3xl font-heading font-bold text-white mb-2">
                      {lifecycleSteps[activeStep]} Workflow
                    </h3>
                    <p className="text-white/50 font-mono">
                      Running logic systems...
                    </p>
                  </motion.div>
                </AnimatePresence>

                <button
                  onClick={nextStep}
                  className="absolute bottom-4 right-4 text-xs font-mono text-white/30 hover:text-accent-500 transition-colors"
                  aria-label="Next lifecycle step"
                >
                  NEXT FRAME →
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 4. PRICING SYSTEM */}
      <motion.section
        id="pricing"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary-900 mb-6">
            Simple, scale-based pricing.
          </h2>

          <div className="inline-flex items-center bg-neutral-100 p-1.5 rounded-full relative">
            <button
              className={`relative z-10 px-8 py-3 text-sm font-medium rounded-full transition-colors ${!billingAnnual
                  ? "text-white"
                  : "text-primary-900/60 hover:text-primary-900"
                }`}
              onClick={() => setBillingAnnual(false)}
            >
              Monthly
            </button>
            <button
              className={`relative z-10 px-8 py-3 text-sm font-medium rounded-full transition-colors ${billingAnnual
                  ? "text-white"
                  : "text-primary-900/60 hover:text-primary-900"
                }`}
              onClick={() => setBillingAnnual(true)}
            >
              Annual{" "}
              <span className="text-accent-500 ml-1">(Save 15%)</span>
            </button>
            <motion.div
              className="absolute top-1.5 bottom-1.5 bg-primary-900 rounded-full shadow z-0"
              initial={false}
              animate={{
                left: billingAnnual ? "50%" : "6px",
                right: billingAnnual ? "6px" : "50%",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </motion.div>

        <motion.div
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch pt-4"
        >
          {pricingPlans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeInUp}
              className={`relative bg-white rounded-3xl p-8 flex flex-col ${plan.recommended
                  ? "border-2 border-accent-500 shadow-xl scale-105 z-10"
                  : "border border-neutral-100 shadow-sm hover:shadow-md"
                } transition-shadow`}
            >
              {plan.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Recommended
                </div>
              )}

              <h3 className="text-2xl font-bold font-heading text-primary-900 mb-2">
                {plan.name}
              </h3>
              <p className="text-primary-900/60 text-sm mb-6">{plan.assets} assets</p>

              <div className="mb-8">
                {plan.priceAnnual === null ? (
                  <div className="text-4xl font-bold text-primary-900">Custom</div>
                ) : (
                  <div className="flex items-baseline text-primary-900">
                    <span className="text-4xl font-bold font-mono tracking-tight text-primary-900">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={billingAnnual ? "annual" : "monthly"}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                        >
                          $
                          {(billingAnnual
                            ? plan.priceAnnual
                            : plan.priceMonthly
                          )?.toLocaleString()}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    <span className="ml-2 text-primary-900/60">
                      /{billingAnnual ? "year" : "month"}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => openTrialModal(plan.plan)}
                className={`w-full py-3.5 rounded-full font-medium transition-colors mb-8 ${plan.recommended
                    ? "bg-accent-500 text-white hover:bg-accent-600"
                    : "bg-neutral-100 text-primary-900 hover:bg-neutral-200"
                  }`}
              >
                {plan.name === "Enterprise" ? "Contact Sales" : "Start Trial"}
              </button>

              <div className="flex-1">
                <p className="text-xs font-bold text-primary-900/50 uppercase tracking-wider mb-4">
                  Features included:
                </p>
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-accent-500 mr-3 shrink-0" />
                      <span className="text-primary-900/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Expandable Feature Comparison */}
        <div className="mt-16 text-center">
          <button
            onClick={() => setShowFeatureComparison(!showFeatureComparison)}
            className="inline-flex items-center text-lg font-medium text-primary-900 hover:text-accent-500 transition-colors"
          >
            {showFeatureComparison ? "Hide" : "Show"} full feature comparison
            <ChevronDown
              className={`w-5 h-5 ml-2 transition-transform duration-300 ${showFeatureComparison ? "rotate-180" : ""
                }`}
            />
          </button>
        </div>

        <AnimatePresence>
          {showFeatureComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-8"
            >
              <div className="bg-white rounded-3xl border border-neutral-100 shadow-xl overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr>
                      <th className="p-6 bg-neutral-50 border-b border-r border-neutral-100 text-sm font-bold text-primary-900/40 uppercase tracking-widest">
                        Feature
                      </th>
                      <th className="p-6 border-b border-r border-neutral-100 text-center text-sm font-bold text-primary-900">
                        Starter
                      </th>
                      <th className="p-6 border-b border-r border-neutral-100 text-center text-sm font-bold text-accent-500 bg-accent-500/5">
                        Growth
                      </th>
                      <th className="p-6 border-b border-r border-neutral-100 text-center text-sm font-bold text-primary-900">
                        Professional
                      </th>
                      <th className="p-6 border-b border-neutral-100 text-center text-sm font-bold text-primary-900">
                        Enterprise
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureComparison.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-neutral-50 transition-colors"
                      >
                        <td className="p-4 border-b border-r border-neutral-100 font-medium text-primary-900 text-sm">
                          {row.feature}
                        </td>
                        {[row.starter, row.growth, row.pro, row.enterprise].map(
                          (val, i) => (
                            <td
                              key={i}
                              className={`p-4 border-b border-neutral-100 text-center ${i < 3 ? "border-r" : ""
                                } ${i === 1 ? "bg-accent-500/5" : ""}`}
                            >
                              {val ? (
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <span className="w-5 h-5 text-gray-300 mx-auto block">
                                  —
                                </span>
                              )}
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Conversion CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="py-32 bg-primary-900 text-center"
      >
        <div className="max-w-4xl mx-auto px-4">
          <motion.h2
            variants={fadeInUp}
            className="text-5xl font-heading font-bold text-white mb-8"
          >
            Transform your asset lifecycle.
          </motion.h2>
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <button
              onClick={() => openTrialModal("growth")}
              className="bg-accent-500 text-white px-10 py-5 rounded-full text-xl font-medium hover:bg-accent-600 transition-colors"
            >
              Start Free Trial
            </button>
            <Link
              href="/rfq"
              className="bg-transparent text-white border-2 border-white/20 px-10 py-5 rounded-full text-xl font-medium hover:border-white/40 transition-colors"
            >
              Get Quote
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Trial Signup Modal */}
      <TrialSignupModal
        isOpen={trialModal.open}
        onClose={() => setTrialModal((s) => ({ ...s, open: false }))}
        defaultPlan={trialModal.plan}
      />
    </div>
  );
}
