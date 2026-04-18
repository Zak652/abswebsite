"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { HeroSectionData } from "@/types/cms";

interface ScannersPageClientProps {
    hero: HeroSectionData | null;
}

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
    visible: { transition: { staggerChildren: 0.12 } },
};

const DEFAULT_HEADLINE = "Capture data at the source.";
const DEFAULT_SUBHEADLINE = "Industrial-grade barcode and RFID readers designed specifically for harsh environments and high-volume operations.";

export function ScannersPageClient({ hero }: ScannersPageClientProps) {
    const headline = hero?.headline ?? DEFAULT_HEADLINE;
    const subheadline = hero?.subheadline ?? DEFAULT_SUBHEADLINE;
    const heroImage = hero?.background_image?.file ?? "/images/barcode_scanner_1772490256748.png";
    const ctaText = hero?.cta_primary_text ?? "Configure Hardware";
    const ctaUrl = hero?.cta_primary_link ?? "/configurator";
    const secondaryCtaText = hero?.cta_secondary_text ?? "Get Quote";
    const secondaryCtaUrl = hero?.cta_secondary_link ?? "/rfq";
    return (
        <div className="min-h-screen bg-surface">

            {/* 1. HERO IMAGE — clean isolated product, light background */}
            <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 pr-0 md:pr-12 mb-12 md:mb-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-heading font-bold text-primary-900 mb-6 tracking-tight">
                            {headline}
                        </h1>
                        <p className="text-xl text-primary-900/60 mb-8 max-w-lg">
                            {subheadline}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href={ctaUrl} className="bg-accent-500 text-white px-8 py-4 rounded-full font-medium hover:bg-accent-600 transition-colors flex items-center">
                                {ctaText} <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                            <Link href={secondaryCtaUrl} className="bg-transparent border border-primary-900/20 text-primary-900 px-8 py-4 rounded-full font-medium hover:border-primary-900/40 transition-colors">
                                {secondaryCtaText}
                            </Link>
                        </div>
                    </motion.div>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="md:w-1/2 relative h-[500px] w-full bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden"
                >
                    <Image
                        src={heroImage}
                        alt="ABS Industrial Handheld Scanner — clean isolated product shot"
                        fill
                        className="object-contain p-8 hover:scale-105 transition-transform duration-700"
                        priority
                    />
                </motion.div>
            </section>

            {/* 2. CONTEXT IMAGE — product in real environment */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={stagger}
                className="py-24 bg-primary-900 text-white overflow-hidden"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                        <motion.div variants={fadeInUp} className="md:w-1/2">
                            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">Built for the frontline.</h2>
                            <p className="text-white/70 text-lg mb-8">
                                Equipment doesn&apos;t matter if it can&apos;t survive the environment. Our scanners are deployable in freezers, foundries, and flight lines. Drop-tested to concrete, sealed against dust and water.
                            </p>
                            <ul className="space-y-4 font-mono text-sm text-accent-500">
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3" /> IP65 / IP67 Sealing Options</li>
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3" /> 8ft (2.4m) Concrete Drop Spec</li>
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3" /> Extreme Temp Operations (-20°C to 50°C)</li>
                            </ul>
                        </motion.div>
                        <motion.div variants={fadeInUp} className="md:w-1/2 relative h-[600px] w-full rounded-3xl overflow-hidden">
                            <Image
                                src="/images/scanner_context.png"
                                alt="Scanner deployed in warehouse environment"
                                fill
                                className="object-cover"
                            />
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* 3. DETAIL IMAGE — close-up materials */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={stagger}
                className="py-32"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeInUp} className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-4xl font-heading font-bold text-primary-900 mb-6">Engineered precision.</h2>
                        <p className="text-lg text-primary-900/60">Every material choice serves a functional purpose, from the high-friction grips to the chemically resistant plastics.</p>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="relative h-[70vh] w-full rounded-[2rem] overflow-hidden shadow-2xl">
                        <Image
                            src="/images/scanner_detail.png"
                            alt="Macro detail of scanner grip and trigger"
                            fill
                            className="object-cover"
                        />
                        {/* Hotspots overlay */}
                        <div className="absolute top-1/4 left-1/3 flex flex-col items-center">
                            <div className="w-4 h-4 bg-accent-500 rounded-full ring-4 ring-white/50 animate-pulse"></div>
                            <div className="mt-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-sm font-bold text-primary-900">
                                Tactile scan trigger rated for 5M presses
                            </div>
                        </div>
                        <div className="absolute bottom-1/3 right-1/4 flex flex-col items-center">
                            <div className="w-4 h-4 bg-accent-500 rounded-full ring-4 ring-white/50 animate-pulse"></div>
                            <div className="mt-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-sm font-bold text-primary-900">
                                Gorilla Glass display rated IP67
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* 4. USE CASE IMAGE — real workflow */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={stagger}
                className="py-24 bg-neutral-100"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <motion.div variants={fadeInUp} className="md:w-1/2">
                            <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary-900 mb-6">Instant data validation.</h2>
                            <p className="text-primary-900/70 text-lg mb-8">
                                Reading the barcode is only half the job. Real-time visual, haptic, and audio feedback ensure operators know immediately if a scan was successful or if an anomaly was detected.
                            </p>
                        </motion.div>
                        <motion.div variants={fadeInUp} className="md:w-1/2 relative h-[500px] w-full rounded-3xl overflow-hidden shadow-lg">
                            <Image
                                src="/images/scanner_usecase.png"
                                alt="Worker scanning a pallet with green successful beam overlay"
                                fill
                                className="object-cover"
                            />
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* 5. CONFIGURATION VISUAL — diagram/UI overlay */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={stagger}
                className="py-32 bg-white"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeInUp} className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-sm font-bold font-mono text-accent-500 uppercase tracking-widest mb-4">Build your ideal unit</h2>
                        <h3 className="text-4xl md:text-5xl font-heading font-bold text-primary-900 mb-6">Configure for your operation.</h3>
                        <p className="text-lg text-primary-900/60">Select scan engines, battery tiers, and environmental protection levels to match your exact workflow.</p>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="bg-surface rounded-[2rem] border border-neutral-200 p-8 md:p-16">
                        <div className="grid md:grid-cols-4 gap-8">
                            {[
                                { step: "01", label: "Base Model", desc: "Standard Wi-Fi or Professional LTE" },
                                { step: "02", label: "Scan Engine", desc: "1D/2D imager, long-range, or RFID" },
                                { step: "03", label: "Battery", desc: "Standard, extended, or hot-swap" },
                                { step: "04", label: "Protection", desc: "Standard IP65, rugged boot, or ATEX" },
                            ].map((item) => (
                                <div key={item.step} className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-primary-900 rounded-2xl flex items-center justify-center text-white font-mono font-bold text-xl">
                                        {item.step}
                                    </div>
                                    <h4 className="font-bold font-heading text-primary-900 mb-2">{item.label}</h4>
                                    <p className="text-sm text-primary-900/60">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-12 text-center">
                            <Link href="/configurator" className="inline-block bg-accent-500 text-white px-10 py-5 rounded-full text-lg font-medium hover:bg-accent-600 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1 transform duration-200">
                                Open Hardware Configurator
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Bottom CTA */}
            <section className="py-24 bg-primary-900 text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-8">
                        Need help choosing?
                    </h2>
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <Link href="/compare" className="bg-accent-500 text-white px-10 py-5 rounded-full text-lg font-medium hover:bg-accent-600 transition-colors">
                            Compare Models
                        </Link>
                        <Link href="/rfq" className="bg-transparent text-white border-2 border-white/20 px-10 py-5 rounded-full text-lg font-medium hover:border-white/40 transition-colors">
                            Get Quote
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
}
