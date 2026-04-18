"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type HeroVariant = "overlay" | "split";

interface HeroBadge {
  text: string;
  variant?: "default" | "accent" | "outline";
}

interface HeroCTA {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
}

interface HeroSectionProps {
  variant?: HeroVariant;
  eyebrow?: string;
  heading: ReactNode;
  subheading?: string;
  badges?: HeroBadge[];
  ctas?: HeroCTA[];
  imageSrc?: string;
  imageAlt?: string;
  overlay?: boolean;
  className?: string;
  minHeight?: string;
}

const badgeClasses = {
  default: "bg-neutral-100 text-primary-900",
  accent: "bg-accent-500/10 text-accent-500 border border-accent-500/20",
  outline: "border border-white/30 text-white",
};

const ctaClasses = {
  primary: "bg-accent-500 text-white hover:bg-accent-600 shadow-sm hover:shadow-md",
  secondary: "bg-primary-900 text-white hover:bg-primary-800 shadow-sm",
  ghost: "bg-white/10 backdrop-blur-md text-white border border-white/30 hover:bg-white/20",
};

export function HeroSection({
  variant = "overlay",
  eyebrow,
  heading,
  subheading,
  badges,
  ctas,
  imageSrc,
  imageAlt = "Hero image",
  overlay = true,
  className = "",
  minHeight = "70vh",
}: HeroSectionProps) {
  if (variant === "split") {
    return (
      <section className={`relative py-24 bg-surface overflow-hidden ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {eyebrow && (
                <p className="text-xs font-bold font-mono text-accent-500 uppercase tracking-widest mb-4">
                  {eyebrow}
                </p>
              )}
              {badges && badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {badges.map((badge, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClasses[badge.variant ?? "default"]}`}
                    >
                      {badge.text}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-900 tracking-tight mb-6 leading-tight">
                {heading}
              </h1>
              {subheading && (
                <p className="text-lg md:text-xl text-primary-900/60 mb-10 max-w-lg">
                  {subheading}
                </p>
              )}
              {ctas && ctas.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {ctas.map((cta, i) => (
                    <Link
                      key={i}
                      href={cta.href}
                      className={`px-8 py-4 rounded-full text-sm font-medium transition-all ${ctaClasses[cta.variant ?? "primary"]}`}
                    >
                      {cta.label}
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Image */}
            {imageSrc && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-neutral-200"
              >
                <Image src={imageSrc} alt={imageAlt} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
              </motion.div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Overlay variant
  return (
    <section
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ minHeight }}
    >
      {imageSrc && (
        <div className="absolute inset-0 z-0">
          <Image src={imageSrc} alt={imageAlt} fill className="object-cover object-center" priority sizes="100vw" />
          {overlay && (
            <>
              <div className="absolute inset-0 bg-primary-900/60 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-primary-900/40" />
            </>
          )}
        </div>
      )}

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {eyebrow && (
            <p className="text-xs font-bold font-mono text-accent-400 uppercase tracking-widest mb-6">
              {eyebrow}
            </p>
          )}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {badges.map((badge, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClasses[badge.variant ?? "outline"]}`}
                >
                  {badge.text}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-heading font-bold tracking-tight mb-6 leading-tight"
        >
          {heading}
        </motion.h1>

        {subheading && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl font-medium text-white/80 max-w-2xl mx-auto mb-10"
          >
            {subheading}
          </motion.p>
        )}

        {ctas && ctas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {ctas.map((cta, i) => (
              <Link
                key={i}
                href={cta.href}
                className={`w-full sm:w-auto px-8 py-4 rounded-full text-sm font-medium transition-all ${ctaClasses[cta.variant ?? "primary"]}`}
              >
                {cta.label}
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
