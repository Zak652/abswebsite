"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Check, Minus } from "lucide-react";
import Image from "next/image";

type Category = "scanners" | "tags" | "arcplus";

const scannersData = {
    features: ["Form Factor", "Environment", "Max Read Range", "RFID Capability", "Drop Spec", "Battery Life", "Operating System"],
    products: [
        {
            name: "Series 700 Imager",
            recommended: false,
            image: "/images/barcode_scanner_1772490256748.png",
            specs: ["Handheld", "Indoor / Warehouse", "45 ft", false, "6 ft to concrete", "14 Hours", "Android 11"],
        },
        {
            name: "Pro 900 RFID",
            recommended: true,
            image: "/images/barcode_scanner_1772490256748.png",
            specs: ["Gun Grip", "Industrial / Yard", "60 ft", true, "8 ft to concrete", "Hot-swappable", "Android 12"],
        },
        {
            name: "Ring Scanner Mini",
            recommended: false,
            image: "/images/barcode_scanner_1772490256748.png",
            specs: ["Wearable", "Logistics / Picking", "3 ft", false, "4 ft to tile", "8 Hours", "Proprietary"],
        }
    ]
};

const tagsData = {
    features: ["Technology", "Surface Compatibility", "Read Range", "Temperature Range", "Memory", "Lifespan", "IP Rating"],
    products: [
        {
            name: "Metal Mount UHF",
            recommended: false,
            image: "/images/rfid_tag_1772490270592.png",
            specs: ["RFID UHF", "Metal surfaces", "12m", "-40°C to 85°C", "96-bit EPC", "12+ years", "IP68"],
        },
        {
            name: "Industrial Rugged",
            recommended: true,
            image: "/images/rfid_tag_1772490270592.png",
            specs: ["RFID UHF", "Any surface", "15m", "-40°C to 230°C", "512-bit User", "15+ years", "IP69K"],
        },
        {
            name: "Polyester Barcode",
            recommended: false,
            image: "/images/rfid_tag_1772490270592.png",
            specs: ["1D/2D Barcode", "Smooth surfaces", "Line of sight", "-20°C to 60°C", "N/A", "5+ years", "IP65"],
        }
    ]
};

const arcplusData = {
    features: ["Asset Limit", "User Seats", "Maintenance Module", "RFID Support", "API Access", "Depreciation", "SSO", "Custom Integrations", "SLA"],
    products: [
        {
            name: "Starter",
            recommended: false,
            image: "/images/hardware_software_hero_1772490241653.png",
            specs: ["1,000", "1", false, false, false, false, false, false, "Email"],
        },
        {
            name: "Growth",
            recommended: true,
            image: "/images/hardware_software_hero_1772490241653.png",
            specs: ["5,000", "5", true, true, true, false, false, false, "Priority"],
        },
        {
            name: "Professional",
            recommended: false,
            image: "/images/hardware_software_hero_1772490241653.png",
            specs: ["20,000", "Unlimited", true, true, true, true, true, false, "Dedicated"],
        }
    ]
};

const dataMap = { scanners: scannersData, tags: tagsData, arcplus: arcplusData };

export function ComparePageClient() {
    const [activeCategory, setActiveCategory] = useState<Category>("scanners");

    const categories = [
        { id: "scanners" as Category, label: "Hardware Scanners" },
        { id: "tags" as Category, label: "RFID & Barcode Tags" },
        { id: "arcplus" as Category, label: "Arcplus Software Tiers" },
    ];

    const currentData = dataMap[activeCategory];

    return (
        <div className="min-h-screen bg-surface pt-24 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <Link href="/" className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Link>

                <div className="mb-16">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-900 mb-6">Compare Solutions</h1>
                    <p className="text-xl text-primary-900/60 max-w-2xl">Find the exact match for your operational environment.</p>
                </div>

                {/* Category Tabs */}
                <div className="flex overflow-x-auto hide-scrollbar space-x-4 mb-12 border-b border-neutral-100 pb-1">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`whitespace-nowrap pb-4 px-2 text-lg font-medium transition-colors relative ${activeCategory === cat.id ? "text-primary-900" : "text-primary-900/40 hover:text-primary-900/70"
                                }`}
                        >
                            {cat.label}
                            {activeCategory === cat.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-accent-500 rounded-t-full"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Comparison Table */}
                <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-3xl border border-neutral-100 shadow-xl overflow-hidden overflow-x-auto"
                >
                    <table className="w-full min-w-[800px] text-left">
                        <thead>
                            <tr>
                                <th className="p-8 w-1/4 bg-neutral-50 border-b border-r border-neutral-100">
                                    <span className="text-sm font-bold text-primary-900/40 uppercase tracking-widest">Features</span>
                                </th>
                                {currentData.products.map((p, idx) => (
                                    <th key={idx} className={`p-8 w-1/4 border-b border-neutral-100 text-center relative ${idx < 2 ? 'border-r' : ''}`}>
                                        {p.recommended && (
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-accent-500" />
                                        )}
                                        <div className="flex flex-col items-center">
                                            <div className="relative w-24 h-24 mb-4">
                                                <Image src={p.image} alt={p.name} fill className="object-contain" sizes="96px" />
                                            </div>
                                            <h3 className="text-lg font-bold font-heading text-primary-900 mb-1">{p.name}</h3>
                                            {p.recommended && (
                                                <span className="text-[10px] font-bold text-accent-500 uppercase tracking-wider bg-accent-500/10 px-2 py-1 rounded-full mb-4">
                                                    Recommended
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.features.map((feature, featureIdx) => (
                                <tr key={featureIdx} className="hover:bg-neutral-50 transition-colors">
                                    <td className="p-6 border-b border-r border-neutral-100 font-medium text-primary-900">
                                        {feature}
                                    </td>
                                    {currentData.products.map((p, idx) => (
                                        <td key={idx} className={`p-6 border-b border-neutral-100 text-center text-primary-900/70 ${idx < 2 ? 'border-r' : ''}`}>
                                            {typeof p.specs[featureIdx] === 'boolean' ? (
                                                p.specs[featureIdx] ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <Minus className="w-5 h-5 text-gray-300 mx-auto" />
                                            ) : (
                                                p.specs[featureIdx]
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="p-8 bg-neutral-50 border-r border-neutral-100"></td>
                                {currentData.products.map((p, idx) => (
                                    <td key={idx} className={`p-8 text-center ${idx < 2 ? 'border-r border-neutral-100' : ''}`}>
                                        <Link href="/configurator" className={`inline-block w-full py-3 rounded-full font-medium transition-colors ${p.recommended ? 'bg-accent-500 text-white hover:bg-accent-600' : 'bg-neutral-100 text-primary-900 hover:bg-neutral-200'
                                            }`}>
                                            Configure
                                        </Link>
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </motion.div>

                {/* Bottom CTA */}
                <div className="mt-16 text-center">
                    <p className="text-primary-900/60 mb-6">Need a tailored solution? Our engineers can help.</p>
                    <Link href="/rfq" className="inline-block bg-primary-900 text-white px-10 py-5 rounded-full text-lg font-medium hover:bg-accent-500 transition-colors">
                        Get Custom Quote
                    </Link>
                </div>

            </div>
        </div>
    );
}
