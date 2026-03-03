"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import { useRegisterForTraining } from "@/lib/hooks/useTraining";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { TrainingSession } from "@/types/training";

interface TrainingRegistrationModalProps {
  session: TrainingSession | null;
  onClose: () => void;
}

export function TrainingRegistrationModal({
  session,
  onClose,
}: TrainingRegistrationModalProps) {
  const isOpen = session !== null;
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company_name: "",
    phone: "",
    team_size: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registerForTraining = useRegisterForTraining();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.full_name.trim()) e.full_name = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = "Enter a valid email address";
    if (!formData.company_name.trim()) e.company_name = "Company name is required";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    registerForTraining.mutate({
      session: session.id,
      email: formData.email,
      company_name: formData.company_name,
      full_name: formData.full_name,
      phone: formData.phone || undefined,
      team_size: formData.team_size > 1 ? formData.team_size : undefined,
    });
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setFormData({ full_name: "", email: "", company_name: "", phone: "", team_size: 1 });
      setErrors({});
    }, 300);
  };

  const sessionDate = session
    ? new Date(session.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "";

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
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-heading font-bold text-primary-900">
                  Register for Session
                </h3>
                {session && (
                  <div className="mt-1">
                    <p className="text-sm font-medium text-accent-500">
                      {session.title}
                    </p>
                    <p className="text-xs text-primary-900/60">
                      {sessionDate} — ${Number(session.price_usd).toLocaleString()} USD
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-primary-900/60" />
              </button>
            </div>

            {registerForTraining.isError && (
              <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-error)] bg-red-50 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Registration failed. Please try again.
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
                    setFormData((s) => ({ ...s, full_name: e.target.value }))
                  }
                  placeholder="Jane Smith"
                  className={`w-full bg-surface border rounded-xl px-4 py-3 text-primary-900 focus:outline-none transition-colors ${errors.full_name ? "border-[var(--color-error)]" : "border-neutral-200 focus:border-accent-500"
                    }`}
                />
                {errors.full_name && (
                  <p className="text-xs text-[var(--color-error)] mt-1">{errors.full_name}</p>
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
                  className={`w-full bg-surface border rounded-xl px-4 py-3 text-primary-900 focus:outline-none transition-colors ${errors.email ? "border-[var(--color-error)]" : "border-neutral-200 focus:border-accent-500"
                    }`}
                />
                {errors.email && (
                  <p className="text-xs text-[var(--color-error)] mt-1">{errors.email}</p>
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
                    setFormData((s) => ({ ...s, company_name: e.target.value }))
                  }
                  placeholder="ACME Corp"
                  className={`w-full bg-surface border rounded-xl px-4 py-3 text-primary-900 focus:outline-none transition-colors ${errors.company_name ? "border-[var(--color-error)]" : "border-neutral-200 focus:border-accent-500"
                    }`}
                />
                {errors.company_name && (
                  <p className="text-xs text-[var(--color-error)] mt-1">{errors.company_name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.team_size}
                    onChange={(e) =>
                      setFormData((s) => ({
                        ...s,
                        team_size: Math.max(1, parseInt(e.target.value) || 1),
                      }))
                    }
                    className="w-full bg-surface border border-neutral-200 rounded-xl px-4 py-3 text-primary-900 focus:outline-none focus:border-accent-500 transition-colors"
                  />
                </div>
              </div>

              <div className="bg-neutral-50 rounded-xl p-4 text-xs text-neutral-500">
                You will be redirected to a secure payment page to complete your
                registration. Your seat is confirmed once payment is processed.
              </div>

              <button
                type="submit"
                disabled={registerForTraining.isPending}
                className="w-full py-4 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {registerForTraining.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Processing…
                  </>
                ) : (
                  `Proceed to Payment — $${session ? Number(session.price_usd).toLocaleString() : "—"} USD`
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
