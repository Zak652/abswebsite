"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowRight, RefreshCw } from "lucide-react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export interface WorkflowStep {
  label: string;
  description?: string;
}

interface WorkflowVisualizerProps {
  steps: WorkflowStep[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export function WorkflowVisualizer({
  steps,
  title = "Visual Lifecycle Management",
  subtitle = "See exactly where your assets are in their lifecycle context.",
  className = "",
}: WorkflowVisualizerProps) {
  const [activeStep, setActiveStep] = useState(0);

  const nextStep = () => setActiveStep((prev) => (prev + 1) % steps.length);

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={stagger}
      className={`py-32 bg-primary-900 text-white relative overflow-hidden ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Steps List */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              {title}
            </h2>
            <p className="text-xl text-white/70 mb-12">{subtitle}</p>

            <div className="space-y-4">
              {steps.map((step, idx) => (
                <button
                  key={step.label}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 flex items-center justify-between ${activeStep === idx
                      ? "bg-accent-500/10 border-accent-500 text-white"
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                    }`}
                >
                  <span className="text-xl font-medium">{step.label}</span>
                  {activeStep === idx && (
                    <ArrowRight className="w-5 h-5 text-accent-500" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Dashboard Preview */}
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
                Arcplus Dashboard
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
                      className={`w-12 h-12 text-accent-500 ${activeStep % 2 === 0 ? "animate-spin-slow" : "animate-bounce"
                        }`}
                      style={{ animationDuration: "3s" }}
                    />
                  </div>
                  <h3 className="text-3xl font-heading font-bold text-white mb-2">
                    {steps[activeStep].label} Workflow
                  </h3>
                  <p className="text-white/50 font-mono text-sm">
                    {steps[activeStep].description ?? "Running logic systems..."}
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
  );
}
