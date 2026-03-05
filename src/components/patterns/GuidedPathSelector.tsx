"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export interface GuidedPath {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
}

interface GuidedPathSelectorProps {
  heading?: string;
  subheading?: string;
  paths: GuidedPath[];
  className?: string;
}

export function GuidedPathSelector({
  heading = "What do you need to achieve?",
  subheading = "We build solutions aligned to your operational goals.",
  paths,
  className = "",
}: GuidedPathSelectorProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={stagger}
      className={`py-24 bg-white ${className}`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-heading font-bold text-primary-900">
            {heading}
          </h2>
          <p className="text-xl text-primary-900/60 mt-6 font-medium">{subheading}</p>
        </motion.div>

        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paths.map((item) => (
            <motion.div key={item.href} variants={fadeInUp}>
              <Link href={item.href} className="group block">
                <div className="bg-neutral-100 p-10 rounded-3xl h-full flex items-start space-x-6 hover:bg-primary-900 transition-colors duration-300">
                  <div className="bg-white p-4 rounded-2xl shadow-sm text-primary-900 group-hover:text-accent-500 transition-colors flex-shrink-0">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-heading text-primary-900 group-hover:text-white transition-colors mb-3">
                      {item.title}
                    </h3>
                    <p className="text-primary-900/60 group-hover:text-white/70 transition-colors mb-6 text-lg">
                      {item.description}
                    </p>
                    <span className="inline-flex items-center font-medium text-accent-500 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                      {item.ctaLabel} <ArrowRight className="w-5 h-5 ml-2" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
