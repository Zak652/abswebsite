"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function Stepper({ currentStep, totalSteps, className = "" }: StepperProps) {
  const progressPercent =
    totalSteps > 1 ? ((currentStep - 1) / (totalSteps - 1)) * 100 : 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono transition-colors duration-300 ${currentStep >= i
                  ? "bg-accent-500 text-white"
                  : "bg-neutral-200 text-neutral-400"
                }`}
            >
              {currentStep > i ? <Check className="w-5 h-5" /> : i}
            </div>
          </div>
        ))}
      </div>
      <div className="relative h-1 bg-neutral-200 mt-[-24px] z-[-1] mx-8">
        <motion.div
          className="absolute top-0 left-0 h-1 bg-accent-500"
          initial={{ width: "0%" }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
