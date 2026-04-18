"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Check, Minus, Settings } from "lucide-react";
import Image from "next/image";
import { useProductsByCategory } from "@/lib/hooks/useProducts";
import type { Product } from "@/types/products";
import type { PricingPlanData } from "@/types/cms";

type Category = "scanners" | "tags" | "arcplus";

interface ComparePageClientProps {
    cmsPricingPlans: PricingPlanData[];
}

// ── Static Arcplus fallback data ─────────────────────────────────────
const FALLBACK_ARCPLUS = {
    features: [
        "Asset Limit",
        "User Seats",
        "Maintenance Module",
        "RFID Support",
        "API Access",
        "Depreciation",
        "SSO",
        "Custom Integrations",
        "SLA",
    ],
    products: [
        {
            name: "Starter",
            recommended: false,
            image: "/images/hardware_software_hero_1772490241653.png",
            specs: ["1,000", "1", false, false, false, false, false, false, "Email"] as (string | boolean)[],
        },
        {
            name: "Growth",
            recommended: true,
            image: "/images/hardware_software_hero_1772490241653.png",
            specs: ["5,000", "5", true, true, true, false, false, false, "Priority"] as (string | boolean)[],
        },
        {
            name: "Professional",
            recommended: false,
            image: "/images/hardware_software_hero_1772490241653.png",
            specs: ["20,000", "Unlimited", true, true, true, true, true, false, "Dedicated"] as (string | boolean)[],
        },
    ],
};

function buildArcplusFromCms(plans: PricingPlanData[]): typeof FALLBACK_ARCPLUS {
    if (plans.length === 0) return FALLBACK_ARCPLUS;

    const featureNames = [...new Set(plans.flatMap((p) => p.feature_values.map((fv) => fv.feature_name)))];
    const products = plans.map((plan) => {
        const specs: (string | boolean)[] = featureNames.map((name) => {
            const fv = plan.feature_values.find((f) => f.feature_name === name);
            if (!fv) return false;
            if (fv.value === "true") return true;
            if (fv.value === "false") return false;
            return fv.value;
        });
        return {
            name: plan.name,
            recommended: plan.is_recommended,
            image: "/images/hardware_software_hero_1772490241653.png",
            specs,
        };
    });
    return { features: featureNames, products };
}

// ── Skeleton helper ──────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-neutral-200 rounded-xl ${className}`} />
    );
}

// ── Build a unified comparison matrix from Product[] ─────────────────
function buildMatrix(products: Product[]) {
    // Collect all unique spec keys across all products
    const keySet = new Set<string>();
    for (const p of products) {
        if (p.specifications) {
            Object.keys(p.specifications).forEach((k) => keySet.add(k));
        }
    }
    const features = Array.from(keySet);
    return { features, products };
}

// ── Product comparison table (for API-backed tabs) ───────────────────
function ProductCompareTable({
    category,
    fallbackImage,
}: {
    category: "scanners" | "tags";
    fallbackImage: string;
}) {
    const { data: products, isLoading } = useProductsByCategory(category);

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-xl overflow-hidden">
                <div className="p-8 grid grid-cols-4 gap-6">
                    <Skeleton className="h-6 w-24" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-4 flex flex-col items-center">
                            <Skeleton className="w-24 h-24 rounded-2xl" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                    ))}
                </div>
                <div className="space-y-1 px-8 pb-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-xl p-16 text-center text-primary-900/40">
                No products available.
            </div>
        );
    }

    const { features } = buildMatrix(products);

    // Limit to 4 products for layout
    const displayProducts = products.slice(0, 4);

    return (
        <div className="bg-white rounded-3xl border border-neutral-100 shadow-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: `${200 + displayProducts.length * 200}px` }}>
                <thead>
                    <tr>
                        <th className="p-8 w-48 bg-neutral-50 border-b border-r border-neutral-100">
                            <span className="text-sm font-bold text-primary-900/40 uppercase tracking-widest">
                                Features
                            </span>
                        </th>
                        {displayProducts.map((p, idx) => (
                            <th
                                key={p.id}
                                className={`p-8 border-b border-neutral-100 text-center relative ${idx < displayProducts.length - 1 ? "border-r" : ""
                                    }`}
                            >
                                {p.is_recommended && (
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-accent-500" />
                                )}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-24 h-24 mb-4">
                                        <Image
                                            src={p.image_hero ?? fallbackImage}
                                            alt={p.name}
                                            fill
                                            className="object-contain"
                                            sizes="96px"
                                        />
                                    </div>
                                    <h3 className="text-base font-bold font-heading text-primary-900 mb-1">
                                        {p.name}
                                    </h3>
                                    {p.is_recommended && (
                                        <span className="text-[10px] font-bold text-accent-500 uppercase tracking-wider bg-accent-500/10 px-2 py-1 rounded-full mb-2">
                                            Recommended
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {features.map((feature, featureIdx) => (
                        <tr
                            key={featureIdx}
                            className="hover:bg-neutral-50 transition-colors"
                        >
                            <td className="p-5 border-b border-r border-neutral-100 font-medium text-primary-900 text-sm">
                                {feature}
                            </td>
                            {displayProducts.map((p, idx) => (
                                <td
                                    key={p.id}
                                    className={`p-5 border-b border-neutral-100 text-center text-primary-900/70 text-sm ${idx < displayProducts.length - 1 ? "border-r" : ""
                                        }`}
                                >
                                    {p.specifications?.[feature] ?? (
                                        <Minus className="w-4 h-4 text-neutral-300 mx-auto" />
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td className="p-8 bg-neutral-50 border-r border-neutral-100" />
                        {displayProducts.map((p, idx) => (
                            <td
                                key={p.id}
                                className={`p-6 text-center ${idx < displayProducts.length - 1
                                    ? "border-r border-neutral-100"
                                    : ""
                                    }`}
                            >
                                {p.is_configurable ? (
                                    <Link
                                        href={`/configurator?product=${p.slug}`}
                                        className={`inline-flex items-center gap-2 w-full justify-center py-3 rounded-full font-medium transition-colors ${p.is_recommended
                                            ? "bg-accent-500 text-white hover:bg-accent-600"
                                            : "bg-neutral-100 text-primary-900 hover:bg-neutral-200"
                                            }`}
                                    >
                                        <Settings className="w-4 h-4" /> Configure
                                    </Link>
                                ) : (
                                    <Link
                                        href={`/${category}/${p.slug}`}
                                        className={`inline-block w-full py-3 rounded-full font-medium transition-colors ${p.is_recommended
                                            ? "bg-accent-500 text-white hover:bg-accent-600"
                                            : "bg-neutral-100 text-primary-900 hover:bg-neutral-200"
                                            }`}
                                    >
                                        View Product
                                    </Link>
                                )}
                            </td>
                        ))}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

// ── Static Arcplus comparison table ─────────────────────────────────
function ArcplusCompareTable({ data }: { data: typeof FALLBACK_ARCPLUS }) {
    return (
        <div className="bg-white rounded-3xl border border-neutral-100 shadow-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
                <thead>
                    <tr>
                        <th className="p-8 w-1/4 bg-neutral-50 border-b border-r border-neutral-100">
                            <span className="text-sm font-bold text-primary-900/40 uppercase tracking-widest">
                                Features
                            </span>
                        </th>
                        {data.products.map((p, idx) => (
                            <th
                                key={idx}
                                className={`p-8 w-1/4 border-b border-neutral-100 text-center relative ${idx < data.products.length - 1 ? "border-r" : ""
                                    }`}
                            >
                                {p.recommended && (
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-accent-500" />
                                )}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-24 h-24 mb-4">
                                        <Image
                                            src={p.image}
                                            alt={p.name}
                                            fill
                                            className="object-contain"
                                            sizes="96px"
                                        />
                                    </div>
                                    <h3 className="text-lg font-bold font-heading text-primary-900 mb-1">
                                        {p.name}
                                    </h3>
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
                    {data.features.map((feature, featureIdx) => (
                        <tr key={featureIdx} className="hover:bg-neutral-50 transition-colors">
                            <td className="p-6 border-b border-r border-neutral-100 font-medium text-primary-900">
                                {feature}
                            </td>
                            {data.products.map((p, idx) => (
                                <td
                                    key={idx}
                                    className={`p-6 border-b border-neutral-100 text-center text-primary-900/70 ${idx < data.products.length - 1 ? "border-r" : ""
                                        }`}
                                >
                                    {typeof p.specs[featureIdx] === "boolean" ? (
                                        p.specs[featureIdx] ? (
                                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                                        ) : (
                                            <Minus className="w-5 h-5 text-gray-300 mx-auto" />
                                        )
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
                        <td className="p-8 bg-neutral-50 border-r border-neutral-100" />
                        {data.products.map((p, idx) => (
                            <td
                                key={idx}
                                className={`p-8 text-center ${idx < data.products.length - 1
                                    ? "border-r border-neutral-100"
                                    : ""
                                    }`}
                            >
                                <Link
                                    href="/arcplus#pricing"
                                    className={`inline-block w-full py-3 rounded-full font-medium transition-colors ${p.recommended
                                        ? "bg-accent-500 text-white hover:bg-accent-600"
                                        : "bg-neutral-100 text-primary-900 hover:bg-neutral-200"
                                        }`}
                                >
                                    Get Started
                                </Link>
                            </td>
                        ))}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

// ── Page component ───────────────────────────────────────────────────
export function ComparePageClient({ cmsPricingPlans }: ComparePageClientProps) {
    const [activeCategory, setActiveCategory] = useState<Category>("scanners");
    const arcplusData = buildArcplusFromCms(cmsPricingPlans);

    const categories = [
        { id: "scanners" as Category, label: "Hardware Scanners" },
        { id: "tags" as Category, label: "RFID & Barcode Tags" },
        { id: "arcplus" as Category, label: "Arcplus Software Tiers" },
    ];

    return (
        <div className="min-h-screen bg-surface pt-24 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Link>

                <div className="mb-16">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-900 mb-6">
                        Compare Solutions
                    </h1>
                    <p className="text-xl text-primary-900/60 max-w-2xl">
                        Find the exact match for your operational environment.
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex overflow-x-auto hide-scrollbar space-x-4 mb-12 border-b border-neutral-100 pb-1">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`whitespace-nowrap pb-4 px-2 text-lg font-medium transition-colors relative ${activeCategory === cat.id
                                ? "text-primary-900"
                                : "text-primary-900/40 hover:text-primary-900/70"
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
                >
                    {activeCategory === "scanners" && (
                        <ProductCompareTable
                            category="scanners"
                            fallbackImage="/images/barcode_scanner_1772490256748.png"
                        />
                    )}
                    {activeCategory === "tags" && (
                        <ProductCompareTable
                            category="tags"
                            fallbackImage="/images/rfid_tag_1772490270592.png"
                        />
                    )}
                    {activeCategory === "arcplus" && <ArcplusCompareTable data={arcplusData} />}
                </motion.div>

                {/* Bottom CTA */}
                <div className="mt-16 text-center">
                    <p className="text-primary-900/60 mb-6">
                        Need a tailored solution? Our engineers can help.
                    </p>
                    <Link
                        href="/rfq"
                        className="inline-block bg-primary-900 text-white px-10 py-5 rounded-full text-lg font-medium hover:bg-accent-500 transition-colors"
                    >
                        Get Custom Quote
                    </Link>
                </div>
            </div>
        </div>
    );
}
