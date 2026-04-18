"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, Users, Database, BarChart3, Warehouse, HardDrive } from "lucide-react";
import type { HeroSectionData, ServiceOfferingData } from "@/types/cms";

interface ServicesPageClientProps {
    hero: HeroSectionData | null;
    cmsServices: ServiceOfferingData[];
}

const ICON_MAP: Record<string, typeof ClipboardList> = {
    ClipboardList, Database, BarChart3, HardDrive, Users, Warehouse,
};

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
    visible: { transition: { staggerChildren: 0.12 } },
};

const services = [
    {
        id: "pav",
        title: "Physical Asset Verification",
        icon: ClipboardList,
        problem: "Ghost assets distort financial records, insurance premiums are paid on retired equipment, and teams waste hours searching for missing tools.",
        process: "Our certified field teams deploy to your facilities. We locate, identify, and permanently affix industrial-grade RFID/barcode tags to every asset.",
        deliverables: ["Clean structured database", "Normalized asset descriptions", "Precise GPS locations", "Photographic evidence of each tagged item", "Reconciliation report"],
        result: "Immediate operational control. Accurate depreciation schedules, reduced tax liabilities, and a foundation for automated lifecycle management.",
    },
    {
        id: "register",
        title: "Asset Register Construction",
        icon: Database,
        problem: "Spreadsheets and siloed systems cannot scale. Data inconsistency across locations makes enterprise reporting impossible.",
        process: "We design a standardized data schema tailored to your industry, then populate it with verified field data and integrate it with your ERP/financial system.",
        deliverables: ["Custom data schema", "ERP integration mapping", "Hierarchical asset tree", "Depreciation schedule setup", "Staff training materials"],
        result: "A single source of truth for your entire fixed asset portfolio, ready for audits, compliance, and strategic planning.",
    },
    {
        id: "consulting",
        title: "Lifecycle Consulting",
        icon: BarChart3,
        problem: "Organizations lack a coherent strategy for managing assets from acquisition through disposal, leading to unplanned costs and compliance gaps.",
        process: "Senior consultants assess your current maturity, benchmark against industry standards, and design a phased improvement roadmap.",
        deliverables: ["Maturity assessment report", "Gap analysis document", "Phased implementation roadmap", "ROI projections", "Change management plan"],
        result: "A clear, actionable plan to move from reactive asset management to proactive lifecycle optimization.",
    },
    {
        id: "deployment",
        title: "Hardware Deployment",
        icon: HardDrive,
        problem: "Rolling out scanners and readers across multiple sites is complex — firmware versions, network configs, and user training create friction.",
        process: "Our engineers pre-configure all hardware, deploy on-site, integrate with your network, and deliver operator training.",
        deliverables: ["Pre-configured hardware fleet", "Network integration documentation", "Operator training sessions", "Warranty registration", "Support hotline access"],
        result: "Day-one operational readiness. Your teams scan assets within hours of deployment, not weeks.",
    },
    {
        id: "staffing",
        title: "Managed Field Teams",
        icon: Users,
        problem: "Large-scale inventory projects require temporary skilled labor that understands asset management methodology.",
        process: "We provide trained, background-checked teams who follow standardized procedures to verify assets across any number of sites simultaneously.",
        deliverables: ["Trained field operators", "Standardized operating procedures", "Daily progress reports", "Quality audit checkpoints", "Final sign-off per site"],
        result: "Scalable execution without permanent headcount. Complete multi-site projects in weeks, not months.",
    },
    {
        id: "warehousing",
        title: "Warehouse Optimization",
        icon: Warehouse,
        problem: "Poor warehouse layout and lack of real-time inventory visibility lead to picking errors, stock-outs, and wasted movement.",
        process: "We map your current flows, implement zone-based RFID tracking, and redesign layouts for optimal throughput.",
        deliverables: ["Current-state flow analysis", "Optimized zone layout plan", "RFID infrastructure blueprint", "KPI dashboard setup", "Operator retraining"],
        result: "Measurable improvements in pick accuracy, throughput speed, and space utilization.",
    },
];

export function ServicesPageClient({ hero, cmsServices }: ServicesPageClientProps) {
    /* Resolve CMS hero or fallback */
    const h = hero ?? {
        headline: "Expert Services",
        subheadline: "We don\u2019t just sell products. We deploy, verify, and optimize your entire asset ecosystem.",
        background_image: null,
    };

    /* Resolve CMS services or fallback to hardcoded */
    const resolvedServices =
        cmsServices.length > 0
            ? cmsServices.map((s) => ({
                id: s.slug,
                title: s.title,
                icon: ICON_MAP[s.icon] ?? ClipboardList,
                problem: s.problem,
                process: s.process,
                deliverables: s.deliverables,
                result: s.result,
                image: s.image,
            }))
            : services;

    return (
        <div className="min-h-screen bg-surface">

            {/* Hero */}
            <section className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-primary-900 mb-6">{h.headline}</h1>
                    <p className="text-xl text-primary-900/60 max-w-3xl mx-auto">{h.subheadline}</p>
                </motion.div>

                <motion.div
                    className="w-full rounded-[2rem] overflow-hidden shadow-xl relative h-[300px] md:h-[500px]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Image
                        src="/images/services_hero.png"
                        alt="Field service team performing asset verification"
                        fill
                        className="object-cover object-top"
                        priority
                    />
                </motion.div>
            </section>

            {/* Service Cards — Outcome-Based */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={stagger}
                className="py-24 bg-white"
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeInUp} className="text-center mb-20">
                        <h2 className="text-sm font-bold font-mono text-accent-500 uppercase tracking-widest mb-4">Outcome-Based Delivery</h2>
                        <h3 className="text-3xl md:text-5xl font-heading font-bold text-primary-900">Problem → Process → Result</h3>
                    </motion.div>

                    <div className="space-y-20">
                        {resolvedServices.map((service, idx) => (
                            <motion.div
                                key={service.id}
                                variants={fadeInUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-50px" }}
                                className="bg-surface rounded-3xl border border-neutral-200 overflow-hidden"
                            >
                                {/* Service Header */}
                                <div className="bg-primary-900 p-8 md:p-10 flex items-center space-x-4">
                                    <div className="p-3 bg-white/10 rounded-2xl">
                                        <service.icon className="w-8 h-8 text-accent-500" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-mono text-accent-500 uppercase tracking-wider">Service {String(idx + 1).padStart(2, '0')}</span>
                                        <h3 className="text-2xl md:text-3xl font-heading font-bold text-white">{service.title}</h3>
                                    </div>
                                </div>

                                {/* 4-Phase Layout */}
                                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
                                    {/* Problem */}
                                    <div className="p-8 md:p-10">
                                        <span className="inline-block px-3 py-1 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider rounded-full mb-4">The Problem</span>
                                        <p className="text-primary-900/70 text-lg leading-relaxed">{service.problem}</p>
                                    </div>

                                    {/* Process */}
                                    <div className="p-8 md:p-10">
                                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-full mb-4">Our Process</span>
                                        <p className="text-primary-900/70 text-lg leading-relaxed">{service.process}</p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 border-t border-neutral-200">
                                    {/* Deliverables */}
                                    <div className="p-8 md:p-10">
                                        <span className="inline-block px-3 py-1 bg-green-50 text-green-600 text-xs font-bold uppercase tracking-wider rounded-full mb-4">Deliverables</span>
                                        <ul className="space-y-3">
                                            {service.deliverables.map((d, i) => (
                                                <li key={i} className="flex items-start">
                                                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                                                    <span className="text-primary-900/70">{d}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Result */}
                                    <div className="p-8 md:p-10 bg-neutral-100">
                                        <span className="inline-block px-3 py-1 bg-accent-500/10 text-accent-500 text-xs font-bold uppercase tracking-wider rounded-full mb-4">The Result</span>
                                        <p className="text-primary-900 text-lg font-medium leading-relaxed">{service.result}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Global CTA */}
            <section className="py-32 bg-primary-900 text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-8">Ready to deploy expert services?</h2>
                    <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">Our specialized teams operate globally. Tell us your requirements and we&apos;ll scope a custom engagement.</p>
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <Link href="/rfq" className="bg-accent-500 text-white px-10 py-5 rounded-full text-lg font-medium hover:bg-accent-600 transition-colors flex items-center">
                            Request Consultation <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                        <Link href="/arcplus#pricing" className="bg-transparent text-white border-2 border-white/20 px-10 py-5 rounded-full text-lg font-medium hover:border-white/40 transition-colors">
                            Start Free Trial
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
}
