"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Waves, ShieldCheck, Cog, Thermometer, Radio, MapPin } from "lucide-react";

type FilterKey = "all" | "environment" | "range" | "application";

const tagCategories = [
    {
        name: "Metal Mount RFID",
        environment: "Metal / Industrial",
        range: "Long",
        application: "Heavy Equipment",
        desc: "Specialized RFID tags with isolators that prevent signal bounce on steel containers and heavy equipment.",
        icon: Cog,
    },
    {
        name: "Long Range UHF",
        environment: "Outdoor / Yard",
        range: "Long",
        application: "Yard Management",
        desc: "Up to 20m read range for yard management and open-area asset tracking.",
        icon: Radio,
    },
    {
        name: "Industrial Harsh",
        environment: "Chemical / Extreme Temp",
        range: "Medium",
        application: "Manufacturing",
        desc: "Teflon and ceramic-encased tags designed for caustic washdowns and extreme temperatures.",
        icon: Thermometer,
    },
    {
        name: "Tamper Proof",
        environment: "Indoor / Office",
        range: "Short",
        application: "IT Assets",
        desc: "Destructible antennas and brittle face-stocks prevent unauthorized tag transfers on high-value IT assets.",
        icon: ShieldCheck,
    },
    {
        name: "Fleet GPS",
        environment: "Outdoor / Mobile",
        range: "GPS",
        application: "Fleet Management",
        desc: "Real-time GPS tracking for vehicles and high-value mobile assets.",
        icon: MapPin,
    },
    {
        name: "Chemical Resistant",
        environment: "Chemical / Extreme Temp",
        range: "Medium",
        application: "Manufacturing",
        desc: "Resistant to oceanic submersion, salt spray, and caustic chemical exposure.",
        icon: Waves,
    },
];

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
    visible: { transition: { staggerChildren: 0.1 } },
};

export function TagsPageClient() {
    const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
    const [filterValue, setFilterValue] = useState<string>("all");

    const filters: { key: FilterKey; label: string; options: string[] }[] = [
        { key: "all", label: "All Tags", options: [] },
        { key: "environment", label: "By Environment", options: ["Metal / Industrial", "Outdoor / Yard", "Chemical / Extreme Temp", "Indoor / Office", "Outdoor / Mobile"] },
        { key: "range", label: "By Range", options: ["Short", "Medium", "Long", "GPS"] },
        { key: "application", label: "By Application", options: ["Heavy Equipment", "Yard Management", "Manufacturing", "IT Assets", "Fleet Management"] },
    ];

    const filteredTags = tagCategories.filter((tag) => {
        if (activeFilter === "all" || filterValue === "all") return true;
        return tag[activeFilter as keyof typeof tag] === filterValue;
    });

    return (
        <div className="min-h-screen bg-surface">

            {/* 1. HERO IMAGE — clean isolated product */}
            <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center border-b border-neutral-200">
                <div className="md:w-1/2 pr-0 md:pr-12 mb-12 md:mb-0">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-heading font-bold text-primary-900 mb-6 tracking-tight">
                            A digital identity for physical assets.
                        </h1>
                        <p className="text-xl text-primary-900/60 mb-8 max-w-lg">
                            Industrial RFID, Barcode, and GPS tags engineered to survive the lifecycle of the assets they track.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/configurator" className="bg-primary-900 text-white px-8 py-4 rounded-full font-medium hover:bg-accent-500 transition-colors flex items-center">
                                Configure Tags <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                            <Link href="/rfq" className="bg-transparent border border-primary-900/20 text-primary-900 px-8 py-4 rounded-full font-medium hover:border-primary-900/40 transition-colors">
                                Get Quote
                            </Link>
                        </div>
                    </motion.div>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="md:w-1/2 relative h-[400px] w-full bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden"
                >
                    <Image
                        src="/images/rfid_tag_1772490270592.png"
                        alt="ABS Industrial RFID Tag — clean isolated product shot"
                        fill
                        className="object-contain p-12 hover:scale-105 transition-transform duration-700"
                        priority
                    />
                </motion.div>
            </section>

            {/* 2. CONTEXT IMAGE — deployed in environment + Interactive Filters */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={stagger}
                className="py-24 bg-primary-900 text-white overflow-hidden"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeInUp} className="mb-16 md:w-2/3">
                        <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">Track anything, anywhere.</h2>
                        <p className="text-white/70 text-lg">
                            Our tag portfolio covers simple IT asset inventory to global fleet tracking. Filter by environment, range, or application to find the right match.
                        </p>
                    </motion.div>

                    {/* Interactive Filter Tabs */}
                    <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 mb-12">
                        {filters.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => { setActiveFilter(f.key); setFilterValue("all"); }}
                                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${activeFilter === f.key ? 'bg-accent-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </motion.div>

                    {/* Sub-filter chips */}
                    {activeFilter !== "all" && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap gap-2 mb-12"
                        >
                            <button
                                onClick={() => setFilterValue("all")}
                                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${filterValue === "all" ? 'bg-white text-primary-900' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                            >
                                Show All
                            </button>
                            {filters.find(f => f.key === activeFilter)?.options.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setFilterValue(opt)}
                                    className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${filterValue === opt ? 'bg-white text-primary-900' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </motion.div>
                    )}

                    {/* Tag Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTags.map((tag) => (
                            <motion.div
                                key={tag.name}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex items-center mb-4">
                                    <tag.icon className="w-8 h-8 text-accent-500 mr-4" />
                                    <h3 className="text-xl font-bold font-heading">{tag.name}</h3>
                                </div>
                                <p className="text-white/60 mb-4">{tag.desc}</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/50">{tag.environment}</span>
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/50">{tag.range} range</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {filteredTags.length === 0 && (
                        <div className="text-center py-12 text-white/40">
                            No tags match this filter. Try a different combination.
                        </div>
                    )}
                </div>
            </motion.section>

            {/* 3. DETAIL IMAGE — close-up materials */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={stagger}
                className="py-24 bg-neutral-100"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <motion.div variants={fadeInUp} className="md:w-1/2 order-2 md:order-1 relative h-[500px] w-full rounded-[2rem] border border-neutral-200 overflow-hidden shadow-lg bg-white">
                            <Image
                                src="/images/tag_detail.png"
                                alt="Macro detail of an industrial RFID tag"
                                fill
                                className="object-cover"
                            />
                        </motion.div>
                        <motion.div variants={fadeInUp} className="md:w-1/2 order-1 md:order-2">
                            <h2 className="text-sm font-bold font-mono text-accent-500 uppercase tracking-widest mb-4">Construction</h2>
                            <h3 className="text-4xl font-heading font-bold text-primary-900 mb-6">Built to last.</h3>
                            <p className="text-lg text-primary-900/70 mb-8">
                                The face stock, adhesive layer, core inlay, and encapsulation are manufactured as a unified block, preventing delamination over decade-long lifespans.
                            </p>
                            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-200">
                                <div>
                                    <div className="font-bold font-mono text-primary-900 text-2xl mb-2">12+</div>
                                    <div className="text-primary-900/60 text-sm">Year Antenna Lifespan</div>
                                </div>
                                <div>
                                    <div className="font-bold font-mono text-primary-900 text-2xl mb-2">UHF</div>
                                    <div className="text-primary-900/60 text-sm">Gen2 V2 standard</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* 4. USE CASE IMAGE — real workflow */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={stagger}
                className="py-32 bg-white"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeInUp} className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary-900 mb-6">Invisible automation.</h2>
                        <p className="text-lg text-primary-900/60">When deployed strategically with fixed readers, our tags capture movement data without requiring human intervention.</p>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="relative h-[600px] w-full rounded-3xl overflow-hidden shadow-2xl group">
                        <Image
                            src="/images/tag_usecase.png"
                            alt="Fixed readers automatically detecting tagged assets passing through dock door"
                            fill
                            className="object-cover group-hover:scale-[1.02] transition-transform duration-1000"
                        />
                    </motion.div>
                </div>
            </motion.section>

            {/* 5. CONFIGURATION VISUAL */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={stagger}
                className="py-32 bg-surface"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeInUp} className="text-center mb-16">
                        <h2 className="text-sm font-bold font-mono text-accent-500 uppercase tracking-widest mb-4">Tag Selection Flow</h2>
                        <h3 className="text-4xl md:text-5xl font-heading font-bold text-primary-900 mb-6">Select the right identity layer.</h3>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="bg-white rounded-[2rem] border border-neutral-200 p-8 md:p-16">
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { step: "01", label: "Material", desc: "Polyester, aluminum, ceramic, or Teflon based on surface and exposure" },
                                { step: "02", label: "Technology", desc: "RFID UHF, barcode, dual-technology, or GPS based on workflow" },
                                { step: "03", label: "Encoding", desc: "Pre-encoded, blank, or custom data structures for your ERP" },
                            ].map((item) => (
                                <div key={item.step} className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-primary-900 rounded-2xl flex items-center justify-center text-white font-mono font-bold text-xl">
                                        {item.step}
                                    </div>
                                    <h4 className="font-bold font-heading text-primary-900 mb-2 text-lg">{item.label}</h4>
                                    <p className="text-sm text-primary-900/60">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-12 text-center">
                            <Link href="/compare" className="inline-block bg-white text-primary-900 border-2 border-primary-900 px-10 py-5 rounded-full text-lg font-bold hover:bg-primary-900 hover:text-white transition-colors">
                                Compare Tag Specs
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Bottom CTA */}
            <section className="py-24 bg-primary-900 text-center border-t border-white/10">
                <div className="max-w-4xl mx-auto px-4">
                    <h3 className="text-3xl md:text-5xl font-heading font-bold text-white mb-8">
                        Ready to tag your assets?
                    </h3>
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <Link href="/configurator" className="bg-accent-500 text-white px-10 py-5 rounded-full text-lg font-medium hover:bg-accent-600 transition-colors">
                            Configure Tags
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
