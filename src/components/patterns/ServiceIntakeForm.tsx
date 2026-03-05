"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import { useSubmitServiceRequest } from "@/lib/hooks/useServices";
import type { ServiceType, ServiceUrgency } from "@/types/services";

// ── Step definitions per service type ──────────────────────────────

const SERVICE_LABELS: Record<ServiceType, string> = {
  asset_register: "Asset Register Build",
  verification: "Asset Verification",
  disposal: "Asset Disposal",
  training_outsource: "Training Outsource",
  full_outsource: "Full Asset Management Outsource",
};

const SERVICE_QUESTIONS: Record<ServiceType, Array<{ id: string; label: string; type: "text" | "select" | "number"; options?: string[] }>> = {
  asset_register: [
    { id: "current_system", label: "Current tracking system (if any)", type: "text" },
    { id: "asset_types", label: "Primary asset types (e.g. IT, fleet, equipment)", type: "text" },
    { id: "locations", label: "Number of locations / sites", type: "number" },
  ],
  verification: [
    { id: "last_audit", label: "When was the last physical audit?", type: "select", options: ["Never", "Within 6 months", "1-2 years ago", "3+ years ago"] },
    { id: "discrepancy_level", label: "Estimated discrepancy level", type: "select", options: ["Unknown", "Low (<5%)", "Medium (5-20%)", "High (>20%)"] },
    { id: "compliance_std", label: "Required compliance standard (if any)", type: "text" },
  ],
  disposal: [
    { id: "disposal_method", label: "Preferred disposal method", type: "select", options: ["Auction", "Scrap", "Donation", "Certified destruction", "Unsure"] },
    { id: "asset_condition", label: "General asset condition", type: "select", options: ["Working", "Partially working", "Non-functional", "Mixed"] },
    { id: "compliance_required", label: "Environmental or regulatory compliance needed?", type: "select", options: ["Yes", "No", "Not sure"] },
  ],
  training_outsource: [
    { id: "training_scope", label: "Training scope (e.g. Arcplus users, field teams)", type: "text" },
    { id: "participants", label: "Number of participants", type: "number" },
    { id: "preferred_format", label: "Preferred format", type: "select", options: ["In-person", "Virtual", "Blended", "Either"] },
  ],
  full_outsource: [
    { id: "current_headcount", label: "Current asset management headcount", type: "number" },
    { id: "pain_points", label: "Top 3 pain points with current approach", type: "text" },
    { id: "integration_needs", label: "Key systems to integrate with (ERP, CMMS, etc.)", type: "text" },
  ],
};

const ASSET_RANGES = ["Under 500", "500 – 2,000", "2,000 – 10,000", "10,000 – 50,000", "50,000+"];
const URGENCY_OPTIONS: { value: ServiceUrgency; label: string; desc: string }[] = [
  { value: "urgent", label: "Urgent", desc: "Need to start within 2 weeks" },
  { value: "standard", label: "Standard", desc: "Within 4-8 weeks" },
  { value: "flexible", label: "Flexible", desc: "Planned for next quarter or beyond" },
];

// ── Component ───────────────────────────────────────────────────────

interface ServiceIntakeFormProps {
  serviceType: ServiceType;
  onSuccess?: () => void;
  className?: string;
}

type Step = "scale" | "service" | "contact" | "done";

export function ServiceIntakeForm({ serviceType, onSuccess, className = "" }: ServiceIntakeFormProps) {
  const [step, setStep] = useState<Step>("scale");
  const [assetRange, setAssetRange] = useState("");
  const [serviceAnswers, setServiceAnswers] = useState<Record<string, string>>({});
  const [urgency, setUrgency] = useState<ServiceUrgency>("standard");
  const [contact, setContact] = useState({ full_name: "", email: "", company_name: "", phone: "" });

  const submitMutation = useSubmitServiceRequest();
  const questions = SERVICE_QUESTIONS[serviceType];

  const handleServiceAnswer = (id: string, value: string) => {
    setServiceAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleContactChange = (field: keyof typeof contact, value: string) => {
    setContact((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!contact.full_name || !contact.email || !contact.company_name) return;

    try {
      await submitMutation.mutateAsync({
        service_type: serviceType,
        urgency,
        company_name: contact.company_name,
        full_name: contact.full_name,
        email: contact.email,
        phone: contact.phone,
        intake_data: {
          asset_range: assetRange,
          ...serviceAnswers,
        },
      });
      setStep("done");
      onSuccess?.();
    } catch {
      // error handled by mutation state
    }
  };

  const canProceedFromScale = !!assetRange;
  const canProceedFromService = questions.every((q) => !!serviceAnswers[q.id]);
  const canSubmit =
    !!contact.full_name && !!contact.email && !!contact.company_name;

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-primary-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors";
  const labelClass = "block text-sm font-medium text-primary-900/80 mb-2";

  return (
    <div className={`bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-primary-900 px-8 py-6">
        <p className="text-xs font-mono text-accent-500 uppercase tracking-widest mb-1">Service Enquiry</p>
        <h3 className="text-2xl font-heading font-bold text-white">{SERVICE_LABELS[serviceType]}</h3>
      </div>

      {/* Step Indicators */}
      {step !== "done" && (
        <div className="flex border-b border-neutral-100">
          {(["scale", "service", "contact"] as Step[]).map((s, idx) => {
            const stepLabels = ["Scale", "Details", "Contact"];
            const isActive = step === s;
            const isDone =
              (s === "scale" && (step === "service" || step === "contact")) ||
              (s === "service" && step === "contact");
            return (
              <div
                key={s}
                className={`flex-1 py-3 text-center text-xs font-medium border-b-2 transition-colors ${isActive
                    ? "text-primary-900 border-accent-500"
                    : isDone
                      ? "text-accent-500 border-accent-500/40"
                      : "text-primary-900/40 border-transparent"
                  }`}
              >
                {isDone && <Check className="w-3 h-3 inline mr-1" />}
                {stepLabels[idx]}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="p-8"
        >
          {/* Step 1: Scale */}
          {step === "scale" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-heading font-bold text-primary-900 mb-2">How large is your asset estate?</h4>
                <p className="text-sm text-primary-900/60">This helps us scope the right team size and timeline for your project.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ASSET_RANGES.map((range) => (
                  <button
                    key={range}
                    onClick={() => setAssetRange(range)}
                    className={`px-5 py-3 rounded-2xl text-sm font-medium border-2 transition-all text-left ${assetRange === range
                        ? "bg-primary-900 text-white border-primary-900"
                        : "bg-white text-primary-900 border-neutral-200 hover:border-primary-900/30"
                      }`}
                  >
                    {range} assets
                  </button>
                ))}
              </div>
              <div>
                <p className={labelClass}>Timeline urgency</p>
                <div className="space-y-2">
                  {URGENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setUrgency(opt.value)}
                      className={`w-full px-5 py-3 rounded-2xl text-sm border-2 transition-all text-left flex items-center justify-between ${urgency === opt.value
                          ? "bg-primary-900 text-white border-primary-900"
                          : "bg-white text-primary-900 border-neutral-200 hover:border-primary-900/30"
                        }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                      <span className={`text-xs ${urgency === opt.value ? "text-white/60" : "text-primary-900/50"}`}>{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setStep("service")}
                disabled={!canProceedFromScale}
                className="w-full py-4 bg-primary-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Service-specific */}
          {step === "service" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-heading font-bold text-primary-900 mb-2">Tell us more about your needs</h4>
                <p className="text-sm text-primary-900/60">Specific details help us prepare an accurate scope of work.</p>
              </div>
              <div className="space-y-5">
                {questions.map((q) => (
                  <div key={q.id}>
                    <label className={labelClass}>{q.label}</label>
                    {q.type === "select" && q.options ? (
                      <select
                        className={inputClass}
                        value={serviceAnswers[q.id] ?? ""}
                        onChange={(e) => handleServiceAnswer(q.id, e.target.value)}
                      >
                        <option value="">Select an option...</option>
                        {q.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={q.type}
                        className={inputClass}
                        value={serviceAnswers[q.id] ?? ""}
                        onChange={(e) => handleServiceAnswer(q.id, e.target.value)}
                        placeholder={q.type === "number" ? "0" : "Your answer..."}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("scale")}
                  className="px-6 py-3 text-sm text-primary-900/60 hover:text-primary-900 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("contact")}
                  disabled={!canProceedFromService}
                  className="flex-1 py-4 bg-primary-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {step === "contact" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-heading font-bold text-primary-900 mb-2">Your contact details</h4>
                <p className="text-sm text-primary-900/60">We&apos;ll use these to send your scope proposal and schedule a discovery call.</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Full name <span className="text-error">*</span></label>
                    <input type="text" className={inputClass} value={contact.full_name} onChange={(e) => handleContactChange("full_name", e.target.value)} placeholder="Jane Smith" />
                  </div>
                  <div>
                    <label className={labelClass}>Company <span className="text-error">*</span></label>
                    <input type="text" className={inputClass} value={contact.company_name} onChange={(e) => handleContactChange("company_name", e.target.value)} placeholder="Acme Corp" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Work email <span className="text-error">*</span></label>
                  <input type="email" className={inputClass} value={contact.email} onChange={(e) => handleContactChange("email", e.target.value)} placeholder="jane@acme.com" />
                </div>
                <div>
                  <label className={labelClass}>Phone (optional)</label>
                  <input type="tel" className={inputClass} value={contact.phone} onChange={(e) => handleContactChange("phone", e.target.value)} placeholder="+1 555 000 0000" />
                </div>
              </div>
              {submitMutation.isError && (
                <p className="text-sm text-error bg-error-light px-4 py-3 rounded-xl">
                  Something went wrong. Please try again or email us directly.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("service")}
                  className="px-6 py-3 text-sm text-primary-900/60 hover:text-primary-900 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitMutation.isPending}
                  className="flex-1 py-4 bg-accent-500 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-accent-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    <>Submit Enquiry <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h4 className="text-2xl font-heading font-bold text-primary-900 mb-3">Enquiry received</h4>
              <p className="text-primary-900/60 mb-2">
                Thank you. We&apos;ll review your requirements and send you a detailed scope proposal within 2 business days.
              </p>
              <p className="text-sm text-primary-900/40">
                Check your inbox for a confirmation email.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
