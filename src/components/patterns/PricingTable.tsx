"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Check } from "lucide-react";

type Currency = "USD" | "UGX" | "KES";

const DEFAULT_RATES: Record<"UGX" | "KES", number> = {
  UGX: 3700,
  KES: 130,
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  UGX: "UGX ",
  KES: "KES ",
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export interface PricingPlan {
  name: string;
  plan: string;
  assets: string;
  priceAnnual: number | null;
  priceMonthly: number | null;
  recommended?: boolean;
  features: string[];
}

interface PricingTableProps {
  plans: PricingPlan[];
  onSelectPlan?: (plan: string, billing: "annual" | "monthly", currency: Currency) => void;
  onCurrencyChange?: (currency: Currency) => void;
  defaultCurrency?: Currency;
  rates?: { UGX: number; KES: number };
  className?: string;
}

function formatPrice(
  priceUsd: number,
  currency: Currency,
  rates: { UGX: number; KES: number }
): string {
  if (currency === "USD") {
    return `$${priceUsd.toLocaleString()}`;
  }
  const rate = rates[currency];
  const converted = Math.round(priceUsd * rate);
  const sym = CURRENCY_SYMBOLS[currency];
  return `${sym}${converted.toLocaleString()}`;
}

export function PricingTable({
  plans,
  onSelectPlan,
  onCurrencyChange,
  defaultCurrency = "USD",
  rates = DEFAULT_RATES,
  className = "",
}: PricingTableProps) {
  const [billingAnnual, setBillingAnnual] = useState(true);
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);

  const handleCurrencyChange = (c: Currency) => {
    setCurrency(c);
    onCurrencyChange?.(c);
  };

  const handleSelect = (plan: string) => {
    onSelectPlan?.(plan, billingAnnual ? "annual" : "monthly", currency);
  };

  return (
    <div className={className}>
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-neutral-100 p-1.5 rounded-full relative">
          <button
            className={`relative z-10 px-6 py-2.5 text-sm font-medium rounded-full transition-colors ${!billingAnnual ? "text-white" : "text-primary-900/60 hover:text-primary-900"
              }`}
            onClick={() => setBillingAnnual(false)}
          >
            Monthly
          </button>
          <button
            className={`relative z-10 px-6 py-2.5 text-sm font-medium rounded-full transition-colors ${billingAnnual ? "text-white" : "text-primary-900/60 hover:text-primary-900"
              }`}
            onClick={() => setBillingAnnual(true)}
          >
            Annual <span className="text-accent-500 ml-1">(Save 15%)</span>
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

        {/* Currency Toggle */}
        <div className="inline-flex items-center bg-neutral-100 p-1.5 rounded-full gap-1">
          {(["USD", "UGX", "KES"] as Currency[]).map((c) => (
            <button
              key={c}
              onClick={() => handleCurrencyChange(c)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${currency === c
                  ? "bg-primary-900 text-white shadow"
                  : "text-primary-900/60 hover:text-primary-900"
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch"
      >
        {plans.map((plan) => {
          const price = billingAnnual ? plan.priceAnnual : plan.priceMonthly;
          const period = billingAnnual ? "/year" : "/month";

          return (
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

              <h3 className="text-2xl font-bold font-heading text-primary-900 mb-1">
                {plan.name}
              </h3>
              <p className="text-primary-900/60 text-sm mb-6">{plan.assets} assets</p>

              <div className="mb-8">
                {price === null ? (
                  <div className="text-4xl font-bold text-primary-900">Custom</div>
                ) : (
                  <div className="flex items-baseline text-primary-900">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${billingAnnual}-${currency}`}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="text-4xl font-bold font-mono tracking-tight"
                      >
                        {formatPrice(price, currency, rates)}
                      </motion.span>
                    </AnimatePresence>
                    <span className="ml-2 text-primary-900/60 text-sm">{period}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSelect(plan.plan)}
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
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-accent-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-primary-900/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
