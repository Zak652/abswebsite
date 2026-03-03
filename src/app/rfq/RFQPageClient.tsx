"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Check, ArrowRight, AlertCircle } from "lucide-react";
import { useSubmitRFQ } from "@/lib/hooks/useRFQ";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Stepper } from "@/components/ui/Stepper";

export function RFQPageClient() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    hardware: false,
    software: false,
    services: false,
    assetCount: "",
    locations: "",
    email: "",
    company: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const submitRFQ = useSubmitRFQ();

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!formData.hardware && !formData.software && !formData.services) {
        return "Please select at least one item to quote.";
      }
    }
    if (step === 2) {
      if (!formData.assetCount) return "Please select an estimated asset count.";
    }
    if (step === 3) {
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        return "Please enter a valid work email address.";
      }
      if (!formData.company || formData.company.trim().length < 2) {
        return "Please enter your company name.";
      }
    }
    return null;
  };

  const nextStep = () => {
    const error = validateStep();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);

    if (step === 3) {
      submitRFQ.mutate(
        {
          email: formData.email,
          company_name: formData.company,
          needs_hardware: formData.hardware,
          needs_software: formData.software,
          needs_services: formData.services,
          asset_count_range: formData.assetCount,
          location_count: formData.locations,
        },
        {
          onSuccess: () => {
            setStep(4);
            setValidationError(null);
          },
          onError: () => {
            setValidationError(
              "Something went wrong submitting your request. Please try again."
            );
          },
        }
      );
      return;
    }

    setStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => {
    setValidationError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  return (
    <div className="min-h-screen bg-surface pt-24 pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Cancel Quote Builder
        </Link>

        {/* Progress Stepper */}
        <Stepper currentStep={step} totalSteps={3} className="mb-12" />

        {/* Form Steps */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-neutral-100 relative overflow-hidden min-h-[400px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h2 className="text-3xl font-heading font-bold text-primary-900">
                  What do you need a quote for?
                </h2>
                <p className="text-primary-900/60">
                  Select all that apply to your project.
                </p>

                <div className="space-y-4">
                  {[
                    {
                      id: "software",
                      label: "Arcplus Management Software",
                      desc: "SaaS licensing & implementation",
                    },
                    {
                      id: "hardware",
                      label: "Hardware & Tags",
                      desc: "Scanners, RFID readers, and industrial tags",
                    },
                    {
                      id: "services",
                      label: "Field Services",
                      desc: "Physical tagging and register building",
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        setFormData((s) => ({
                          ...s,
                          [item.id]: !s[item.id as keyof typeof s],
                        }))
                      }
                      className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between ${formData[item.id as keyof typeof formData]
                          ? "border-primary-900 bg-primary-900 text-white"
                          : "border-neutral-200 hover:border-primary-900/30 text-primary-900"
                        }`}
                    >
                      <div>
                        <div className="font-bold text-lg mb-1">
                          {item.label}
                        </div>
                        <div
                          className={
                            formData[item.id as keyof typeof formData]
                              ? "text-white/70"
                              : "text-primary-900/60"
                          }
                        >
                          {item.desc}
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData[item.id as keyof typeof formData]
                            ? "border-white bg-accent-500"
                            : "border-gray-300"
                          }`}
                      >
                        {formData[item.id as keyof typeof formData] && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h2 className="text-3xl font-heading font-bold text-primary-900">
                  Tell us about your scale
                </h2>
                <p className="text-primary-900/60">
                  This helps our engineers determine the right hardware types
                  and software tiers.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-primary-900 uppercase tracking-wider mb-2">
                      Estimated number of assets
                    </label>
                    <select
                      value={formData.assetCount}
                      onChange={(e) =>
                        setFormData((s) => ({
                          ...s,
                          assetCount: e.target.value,
                        }))
                      }
                      className="w-full bg-surface border border-neutral-200 rounded-xl px-4 py-4 text-primary-900 focus:outline-none focus:border-accent-500 appearance-none"
                    >
                      <option value="">Select range...</option>
                      <option value="1-1000">1 - 1,000</option>
                      <option value="1001-5000">1,001 - 5,000</option>
                      <option value="5001-20000">5,001 - 20,000</option>
                      <option value="20000+">20,000+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary-900 uppercase tracking-wider mb-2">
                      Number of locations
                    </label>
                    <select
                      value={formData.locations}
                      onChange={(e) =>
                        setFormData((s) => ({
                          ...s,
                          locations: e.target.value,
                        }))
                      }
                      className="w-full bg-surface border border-neutral-200 rounded-xl px-4 py-4 text-primary-900 focus:outline-none focus:border-accent-500 appearance-none"
                    >
                      <option value="">Select range...</option>
                      <option value="1">1 Facility</option>
                      <option value="2-5">2 - 5 Facilities</option>
                      <option value="6-20">6 - 20 Facilities</option>
                      <option value="21+">21+ Facilities / Global</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h2 className="text-3xl font-heading font-bold text-primary-900">
                  Where should we send the quote?
                </h2>
                <p className="text-primary-900/60">
                  Our solution architects typically respond within 2 hours
                  during business hours.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-primary-900 uppercase tracking-wider mb-2">
                      Work Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((s) => ({ ...s, email: e.target.value }))
                      }
                      className="w-full bg-surface border border-neutral-200 rounded-xl px-4 py-4 text-primary-900 focus:outline-none focus:border-accent-500"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary-900 uppercase tracking-wider mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData((s) => ({ ...s, company: e.target.value }))
                      }
                      className="w-full bg-surface border border-neutral-200 rounded-xl px-4 py-4 text-primary-900 focus:outline-none focus:border-accent-500"
                      placeholder="ACME Corp"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-heading font-bold text-primary-900 mb-4">
                  Request Received
                </h2>
                <p className="text-primary-900/60 max-w-sm mb-8">
                  Our team is reviewing your requirements and will send a
                  detailed quote shortly.
                </p>
                <Link
                  href="/"
                  className="bg-primary-900 text-white px-8 py-4 rounded-full font-medium hover:bg-accent-500 transition-colors"
                >
                  Return Home
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Validation Error */}
          {validationError && step < 4 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-error)] bg-red-50 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {validationError}
            </div>
          )}

          {/* Navigation Buttons (Hidden on success) */}
          {step < 4 && (
            <div
              className={`mt-12 pt-6 border-t border-neutral-100 flex ${step > 1 ? "justify-between" : "justify-end"
                }`}
            >
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="px-6 py-3 font-medium text-primary-900/60 hover:text-primary-900 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={nextStep}
                disabled={submitRFQ.isPending}
                className="flex items-center gap-2 bg-accent-500 text-white px-8 py-3 rounded-full font-medium hover:bg-accent-600 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitRFQ.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Submitting…
                  </>
                ) : (
                  <>
                    {step === 3 ? "Submit Request" : "Continue"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
