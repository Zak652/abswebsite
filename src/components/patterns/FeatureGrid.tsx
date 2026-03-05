"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode, ElementType } from "react";

type GridVariant = "light-on-dark" | "dark-on-light" | "card";
type Columns = 2 | 3 | 4;

export interface FeatureItem {
  icon?: ElementType;
  eyebrow?: string;
  title: string;
  description: string;
  badge?: string;
}

interface FeatureGridProps {
  variant?: GridVariant;
  columns?: Columns;
  eyebrow?: string;
  heading?: ReactNode;
  subheading?: string;
  features: FeatureItem[];
  className?: string;
}

const colClasses: Record<Columns, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

function FeatureCard({
  item,
  variant,
}: {
  item: FeatureItem;
  variant: GridVariant;
}) {
  const prefersReducedMotion = useReducedMotion();
  const Icon = item.icon;
  const isDark = variant === "light-on-dark";
  const isCard = variant === "card";

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.55, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={fadeInUp}
      className={`relative flex flex-col ${isCard
          ? "bg-white rounded-3xl p-8 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow"
          : "p-6"
        }`}
    >
      {item.badge && (
        <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isDark ? "bg-accent-500/20 text-accent-400" : "bg-accent-500/10 text-accent-500"
          }`}>
          {item.badge}
        </span>
      )}
      {Icon && (
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${isDark ? "bg-white/10 text-accent-400" : isCard ? "bg-primary-50 text-primary-500" : "bg-accent-100 text-accent-500"
          }`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
      {item.eyebrow && (
        <p className={`text-xs font-bold font-mono uppercase tracking-widest mb-2 ${isDark ? "text-accent-400" : "text-accent-500"
          }`}>
          {item.eyebrow}
        </p>
      )}
      <h3 className={`text-lg font-bold font-heading mb-3 ${isDark ? "text-white" : "text-primary-900"
        }`}>
        {item.title}
      </h3>
      <p className={`text-sm leading-relaxed ${isDark ? "text-white/60" : "text-primary-900/60"
        }`}>
        {item.description}
      </p>
    </motion.div>
  );
}

export function FeatureGrid({
  variant = "card",
  columns = 3,
  eyebrow,
  heading,
  subheading,
  features,
  className = "",
}: FeatureGridProps) {
  const isDark = variant === "light-on-dark";
  const prefersReducedMotion = useReducedMotion();

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.55, ease: "easeOut" },
    },
  };

  const stagger = {
    hidden: {},
    visible: {
      transition: { staggerChildren: prefersReducedMotion ? 0 : 0.08 },
    },
  };

  return (
    <section className={`py-24 ${isDark ? "bg-primary-900" : "bg-surface"} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(eyebrow || heading || subheading) && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            {eyebrow && (
              <p className={`text-xs font-bold font-mono uppercase tracking-widest mb-4 ${isDark ? "text-accent-400" : "text-accent-500"
                }`}>
                {eyebrow}
              </p>
            )}
            {heading && (
              <h2 className={`text-4xl md:text-5xl font-heading font-bold mb-6 ${isDark ? "text-white" : "text-primary-900"
                }`}>
                {heading}
              </h2>
            )}
            {subheading && (
              <p className={`text-lg leading-relaxed ${isDark ? "text-white/60" : "text-primary-900/60"
                }`}>
                {subheading}
              </p>
            )}
          </motion.div>
        )}

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className={`grid gap-6 ${colClasses[columns]}`}
        >
          {features.map((item, i) => (
            <FeatureCard key={i} item={item} variant={variant} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
