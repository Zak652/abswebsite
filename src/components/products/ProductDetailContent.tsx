"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Download, Settings, ArrowRight, Package } from "lucide-react";
import { useProduct, useProductConfig } from "@/lib/hooks/useProducts";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// Skeleton loader
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-neutral-200 rounded-xl ${className}`} />
  );
}

interface ProductDetailContentProps {
  slug: string;
}

export function ProductDetailContent({ slug }: ProductDetailContentProps) {
  const { data: product, isLoading, isError } = useProduct(slug);
  const { data: configSections } = useProductConfig(slug);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-surface pt-20">
        {/* Hero skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
              <div className="flex gap-4 pt-4">
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-36" />
              </div>
            </div>
            <Skeleton className="aspect-square rounded-3xl" />
          </div>
        </div>
        {/* Specs skeleton */}
        <div className="bg-white py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-10 w-48 mb-12" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
        <Package className="w-16 h-16 text-neutral-300 mb-4" />
        <h1 className="text-2xl font-heading font-bold text-primary-900 mb-2">Product not found</h1>
        <p className="text-primary-900/60 mb-6">This product may have been removed or is unavailable.</p>
        <Link href="/scanners" className="text-accent-500 font-medium hover:text-accent-600 transition-colors">
          Browse all scanners →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* 1. HERO */}
      <section className="pt-24 pb-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-xs font-bold font-mono text-accent-500 uppercase tracking-widest mb-4">
                {product.category.name}
              </p>
              {product.is_recommended && (
                <span className="inline-block bg-accent-500/10 text-accent-500 border border-accent-500/20 px-3 py-1 rounded-full text-xs font-bold mb-4">
                  Recommended
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-900 tracking-tight mb-6 leading-tight">
                {product.name}
              </h1>
              <p className="text-lg text-primary-900/60 mb-10 max-w-lg leading-relaxed">
                {product.short_description}
              </p>
              <div className="flex flex-wrap gap-4">
                {product.is_configurable && (
                  <Link
                    href={`/configurator?product=${product.slug}`}
                    className="inline-flex items-center gap-2 bg-accent-500 text-white px-6 py-3.5 rounded-full font-medium hover:bg-accent-600 transition-colors shadow-sm hover:shadow-md"
                  >
                    <Settings className="w-4 h-4" /> Configure & Quote
                  </Link>
                )}
                <Link
                  href="/rfq"
                  className="inline-flex items-center gap-2 bg-primary-900 text-white px-6 py-3.5 rounded-full font-medium hover:bg-primary-800 transition-colors"
                >
                  Request Quote <ArrowRight className="w-4 h-4" />
                </Link>
                {product.datasheet_url && (
                  <a
                    href={product.datasheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-neutral-100 text-primary-900 px-6 py-3.5 rounded-full font-medium hover:bg-neutral-200 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Datasheet
                  </a>
                )}
              </div>
            </motion.div>

            {product.image_hero && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="relative aspect-square rounded-3xl overflow-hidden bg-neutral-100 shadow-lg border border-neutral-200"
              >
                <Image
                  src={product.image_hero}
                  alt={product.name}
                  fill
                  className="object-contain p-8"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* 2. CONTEXT */}
      {product.image_context && (
        <section className="py-20 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-md border border-neutral-200"
              >
                <Image
                  src={product.image_context}
                  alt={`${product.name} in use`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-900 mb-6">
                  Built for demanding environments
                </h2>
                <p className="text-lg text-primary-900/60 leading-relaxed">{product.full_description}</p>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* 3. TECHNICAL SPECIFICATIONS */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="py-24 bg-neutral-50"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeInUp} className="mb-12">
              <p className="text-xs font-bold font-mono text-accent-500 uppercase tracking-widest mb-3">Technical</p>
              <h2 className="text-3xl font-heading font-bold text-primary-900">Specifications</h2>
            </motion.div>

            <motion.div variants={stagger} className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
              {Object.entries(product.specifications).map(([key, value], idx, arr) => (
                <motion.div
                  key={key}
                  variants={fadeInUp}
                  className={`grid grid-cols-2 px-6 py-4 ${idx < arr.length - 1 ? "border-b border-neutral-100" : ""} ${idx % 2 === 0 ? "bg-white" : "bg-neutral-50/50"}`}
                >
                  <span className="text-sm font-medium text-primary-900/60">{key}</span>
                  <span className="text-sm text-primary-900">{value}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* 4. CONFIGURATOR CTA */}
      {product.is_configurable && configSections && configSections.length > 0 && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="py-20 bg-primary-900 text-center"
        >
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-xs font-bold font-mono text-accent-400 uppercase tracking-widest mb-4">
              Build Your Configuration
            </p>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
              {configSections.length} configurable modules
            </h2>
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              Customize the {product.name} exactly to your operational environment. Our configurator builds your quote in real time.
            </p>
            <Link
              href={`/configurator?product=${product.slug}`}
              className="inline-flex items-center gap-3 bg-accent-500 text-white px-10 py-5 rounded-full text-lg font-medium hover:bg-accent-600 transition-colors shadow-lg hover:shadow-xl"
            >
              <Settings className="w-5 h-5" /> Open Configurator
            </Link>
          </div>
        </motion.section>
      )}
    </div>
  );
}
