"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle } from "lucide-react";
import { useSubmitTrialSignup } from "@/lib/hooks/useSubscription";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface TrialSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: "starter" | "growth" | "professional" | "enterprise";
}

const planOptions = [
  { value: "starter", label: "Starter — up to 1,000 assets" },
  { value: "growth", label: "Growth — 1,001–5,000 assets" },
  { value: "professional", label: "Professional — 5,001–20,000 assets" },
  { value: "enterprise", label: "Enterprise — unlimited assets" },
] as const;

export function TrialSignupModal({
  isOpen,
  onClose,
  defaultPlan = "growth",
}: TrialSignupModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company_name: "",
    phone: "",
    plan: defaultPlan,
    asset_count_estimate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submitTrial = useSubmitTrialSignup();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.full_name.trim()) e.full_name = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = "Enter a valid work email";
    if (!formData.company_name.trim()) e.company_name = "Company name is required";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    submitTrial.mutate(formData, {
      onSuccess: () => setSubmitted(true),
    });
  };

  const handleClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        full_name: "",
        email: "",
        company_name: "",
        phone: "",
        plan: defaultPlan,
        asset_count_estimate: "",
      });
      setErrors({});
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-8 md:p-12 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-primary-900 mb-3">
                  Request Received!
                </h3>
                <p className="text-primary-900/60 mb-6">
                  Our team will provision your Arcplus trial environment within
                  1–2 business days and send your credentials by email.
                </p>
                <button
                  onClick={handleClose}
                  className="w-full py-3.5 bg-primary-900 text-white rounded-xl font-medium hover:bg-accent-500 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-heading font-bold text-primary-900">
                      Start Your Free Trial
                    </h3>
                    <p className="text-primary-900/60 mt-1 text-sm">
                      Our team provisions your environment within 1–2 business
                      days.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-primary-900/60" />
                  </button>
                </div>

                {submitTrial.isError && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-error)] bg-red-50 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Something went wrong. Please try again.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Full Name <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData((s) => ({
                          ...s,
                          full_name: e.target.value,
                        }))
                      }
                      placeholder="Jane Smith"
                      className={`w-full bg-surface border rounded-xl px-4 py-3 text-primary-900 focus:outline-none transition-colors ${errors.full_name
                          ? "border-[var(--color-error)]"
                          : "border-neutral-200 focus:border-accent-500"
                        }`}
                    />
                    {errors.full_name && (
                      <p className="text-xs text-[var(--color-error)] mt-1">
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Work Email <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((s) => ({ ...s, email: e.target.value }))
                      }
                      placeholder="jane@company.com"
                      className={`w-full bg-surface border rounded-xl px-4 py-3 text-primary-900 focus:outline-none transition-colors ${errors.email
                          ? "border-[var(--color-error)]"
                          : "border-neutral-200 focus:border-accent-500"
                        }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-[var(--color-error)] mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Company Name <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData((s) => ({
                          ...s,
                          company_name: e.target.value,
                        }))
                      }
                      placeholder="ACME Corp"
                      className={`w-full bg-surface border rounded-xl px-4 py-3 text-primary-900 focus:outline-none transition-colors ${errors.company_name
                          ? "border-[var(--color-error)]"
                          : "border-neutral-200 focus:border-accent-500"
                        }`}
                    />
                    {errors.company_name && (
                      <p className="text-xs text-[var(--color-error)] mt-1">
                        {errors.company_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((s) => ({ ...s, phone: e.target.value }))
                      }
                      placeholder="+1 555 000 0000"
                      className="w-full bg-surface border border-neutral-200 rounded-xl px-4 py-3 text-primary-900 focus:outline-none focus:border-accent-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Plan
                    </label>
                    <select
                      value={formData.plan}
                      onChange={(e) =>
                        setFormData((s) => ({
                          ...s,
                          plan: e.target.value as typeof formData.plan,
                        }))
                      }
                      className="w-full bg-surface border border-neutral-200 rounded-xl px-4 py-3 text-primary-900 focus:outline-none focus:border-accent-500 appearance-none transition-colors"
                    >
                      {planOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitTrial.isPending}
                    className="w-full py-4 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitTrial.isPending ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Submitting…
                      </>
                    ) : (
                      "Request Trial Access"
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
