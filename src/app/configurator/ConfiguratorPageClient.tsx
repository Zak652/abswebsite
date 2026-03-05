"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
    ArrowLeft,
    Check,
    Tag,
    Shield,
    Zap,
    Battery,
    Package,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { useProduct, useProductConfig } from "@/lib/hooks/useProducts";
import type { ProductConfigOption, ProductConfigSection } from "@/types/products";

// ── Icon string → component map ─────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
    Tag,
    Shield,
    Zap,
    Battery,
    Package,
};

// ── Skeleton helper ──────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-neutral-200 rounded-xl ${className}`} />
    );
}

// ── Option Button ────────────────────────────────────────────────────
function OptionButton({
    opt,
    selected,
    onSelect,
}: {
    opt: ProductConfigOption;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 relative ${selected
                ? "border-accent-500 bg-accent-500/5"
                : "border-neutral-200 hover:border-primary-900/20"
                }`}
        >
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-primary-900">{opt.name}</span>
                    {opt.badge && (
                        <span className="text-[10px] font-bold text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded-full uppercase">
                            {opt.badge}
                        </span>
                    )}
                </div>
                <span className="font-mono text-primary-900/60 text-sm">
                    {!opt.price_usd || parseFloat(opt.price_usd) === 0
                        ? "Included"
                        : `+$${opt.price_usd}`}
                </span>
            </div>
            {opt.description && (
                <p className="text-sm text-primary-900/60 pr-8">{opt.description}</p>
            )}
            {selected && (
                <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-500 w-5 h-5" />
            )}
        </button>
    );
}

// ── Skeleton panes ───────────────────────────────────────────────────
function VisualSkeleton() {
    return (
        <div className="w-full max-w-md aspect-square flex items-center justify-center">
            <Skeleton className="w-72 h-72 rounded-3xl" />
        </div>
    );
}

function OptionsSkeleton() {
    return (
        <div className="space-y-10 max-w-xl mx-auto">
            <Skeleton className="h-9 w-64" />
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ))}
        </div>
    );
}

// ── Main configurator ────────────────────────────────────────────────
function ConfiguratorContent() {
    const searchParams = useSearchParams();
    const productSlug = searchParams.get("product");

    const { data: product, isLoading: productLoading } = useProduct(
        productSlug ?? ""
    );
    const { data: configSections, isLoading: configLoading } = useProductConfig(
        productSlug ?? ""
    );

    const isLoading = productLoading || configLoading;

    const [selections, setSelections] = useState<
        Record<string, ProductConfigOption>
    >({});
    const [quantity, setQuantity] = useState(1);

    // Set defaults once config sections load
    useEffect(() => {
        if (configSections && configSections.length > 0) {
            const defaults: Record<string, ProductConfigOption> = {};
            for (const section of configSections) {
                const defaultOpt =
                    section.options.find((o) => o.is_default) ?? section.options[0];
                if (defaultOpt) defaults[String(section.id)] = defaultOpt;
            }
            setSelections(defaults);
        }
    }, [configSections]);

    const totalPrice =
        Object.values(selections).reduce(
            (sum, opt) => sum + parseFloat(opt.price_usd || "0"),
            0
        ) * quantity;

    const activeOverlays = Object.values(selections).filter(
        (opt) => opt.overlay_label
    );

    const visualKey = Object.values(selections)
        .map((o) => o.option_id)
        .join("-");

    // Encode config for the RFQ page
    const encodedConfig = (() => {
        try {
            return btoa(
                JSON.stringify({
                    product: productSlug,
                    sections: Object.fromEntries(
                        Object.entries(selections).map(([sectionId, opt]) => [
                            sectionId,
                            opt.option_id,
                        ])
                    ),
                    quantity,
                })
            );
        } catch {
            return "";
        }
    })();

    const rfqHref =
        productSlug && encodedConfig ? `/rfq?config=${encodedConfig}` : "/rfq";

    const productImage =
        product?.image_hero ?? "/images/barcode_scanner_1772490256748.png";
    const productName = product?.name ?? "Configure Product";
    const backHref = productSlug ? `/scanners/${productSlug}` : "/scanners";

    // No product selected
    if (!productSlug) {
        return (
            <div className="flex flex-col min-h-screen bg-white">
                <div className="pt-24 px-4 sm:px-6 lg:px-8 border-b border-neutral-100 pb-4">
                    <Link
                        href="/scanners"
                        className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Scanners
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary-900">
                        Configurator
                    </h1>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center py-32 text-center px-4">
                    <Package className="w-16 h-16 text-neutral-300 mb-6" />
                    <h2 className="text-2xl font-heading font-bold text-primary-900 mb-3">
                        No product selected
                    </h2>
                    <p className="text-primary-900/60 mb-8 max-w-md">
                        Select a configurable scanner or tag from the product catalogue to
                        build your custom configuration.
                    </p>
                    <Link
                        href="/scanners"
                        className="bg-accent-500 text-white px-8 py-4 rounded-full font-medium hover:bg-accent-600 transition-colors"
                    >
                        Browse Scanners
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Header */}
            <div className="pt-24 px-4 sm:px-6 lg:px-8 border-b border-neutral-100 pb-4 bg-white z-20">
                <Link
                    href={backHref}
                    className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Link>
                {isLoading ? (
                    <Skeleton className="h-9 w-72" />
                ) : (
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary-900">
                        Configure {productName}
                    </h1>
                )}
            </div>

            {/* Main Layout: Visuals (Left) & Options (Right) */}
            <div className="flex-1 flex flex-col lg:flex-row pb-24 lg:pb-0">
                {/* LEFT: Sticky product visual */}
                <div className="w-full lg:w-1/2 bg-surface relative lg:sticky lg:top-36 lg:h-[calc(100vh-144px)] flex items-center justify-center p-8 lg:p-16 border-r border-neutral-100">
                    {isLoading ? (
                        <VisualSkeleton />
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={visualKey}
                                initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 1.05, filter: "blur(4px)" }}
                                transition={{ duration: 0.4 }}
                                className="relative w-full max-w-md aspect-square"
                            >
                                <Image
                                    src={productImage}
                                    alt={`${productName} configuration preview`}
                                    fill
                                    className="object-contain drop-shadow-2xl"
                                    priority
                                />

                                {activeOverlays.map((opt, idx) => {
                                    const IconComponent =
                                        (opt.overlay_icon && ICON_MAP[opt.overlay_icon]) || Tag;
                                    return (
                                        <motion.div
                                            key={`${opt.overlay_label}-${idx}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`absolute ${opt.overlay_position ?? "top-10 right-10"} ${opt.overlay_color ?? "bg-accent-500 text-white"} text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg`}
                                        >
                                            <IconComponent className="w-3.5 h-3.5 mr-1.5" />
                                            {opt.overlay_label}
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* RIGHT: Options selector */}
                <div className="w-full lg:w-1/2 p-4 sm:p-8 lg:p-16 overflow-y-auto lg:h-[calc(100vh-144px)] mb-32 lg:mb-0 pb-40">
                    {isLoading ? (
                        <OptionsSkeleton />
                    ) : configSections && configSections.length > 0 ? (
                        <div className="space-y-12 max-w-xl mx-auto">
                            {configSections.map((section: ProductConfigSection, idx: number) => (
                                <section key={section.id}>
                                    <h2 className="text-xl font-heading font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">
                                        {idx + 1}. {section.name}
                                    </h2>
                                    <div className="space-y-3">
                                        {section.options.map((opt) => (
                                            <OptionButton
                                                key={opt.id}
                                                opt={opt}
                                                selected={
                                                    selections[String(section.id)]?.id === opt.id
                                                }
                                                onSelect={() =>
                                                    setSelections((prev) => ({
                                                        ...prev,
                                                        [String(section.id)]: opt,
                                                    }))
                                                }
                                            />
                                        ))}
                                    </div>
                                </section>
                            ))}

                            {/* Quantity */}
                            <section>
                                <h2 className="text-xl font-heading font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">
                                    {(configSections?.length ?? 0) + 1}. Quantity
                                </h2>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        className="w-12 h-12 rounded-xl border-2 border-neutral-200 flex items-center justify-center text-xl font-bold text-primary-900 hover:border-primary-900/30 transition-colors"
                                        aria-label="Decrease quantity"
                                    >
                                        −
                                    </button>
                                    <motion.span
                                        key={quantity}
                                        initial={{ scale: 1.2 }}
                                        animate={{ scale: 1 }}
                                        className="text-3xl font-mono font-bold text-primary-900 w-16 text-center"
                                    >
                                        {quantity}
                                    </motion.span>
                                    <button
                                        onClick={() => setQuantity((q) => q + 1)}
                                        className="w-12 h-12 rounded-xl border-2 border-neutral-200 flex items-center justify-center text-xl font-bold text-primary-900 hover:border-primary-900/30 transition-colors"
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                            <Package className="w-12 h-12 text-neutral-300 mb-4" />
                            <p className="text-primary-900/60">
                                No configuration options available for this product.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Summary Bar */}
            {!isLoading && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                        <div className="hidden sm:block">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                                Summary
                            </h4>
                            <div className="flex flex-wrap gap-x-2 text-sm font-medium text-primary-900 mt-1 max-w-md">
                                {Object.values(selections)
                                    .slice(0, 3)
                                    .map((opt, i, arr) => (
                                        <span key={opt.id} className="flex items-center gap-2">
                                            {opt.name}
                                            {i < arr.length - 1 && (
                                                <span className="text-gray-300">|</span>
                                            )}
                                        </span>
                                    ))}
                                {Object.values(selections).length > 3 && (
                                    <span className="text-primary-900/40">
                                        +{Object.values(selections).length - 3} more
                                    </span>
                                )}
                                {Object.values(selections).length > 0 && (
                                    <>
                                        <span className="text-gray-300">|</span>
                                        <span>×{quantity}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-left sm:text-right">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                    {totalPrice > 0 ? "Estimated Price" : "Price on Request"}
                                </div>
                                {totalPrice > 0 && (
                                    <motion.div
                                        key={totalPrice}
                                        initial={{ scale: 1.1, color: "#F97316" }}
                                        animate={{ scale: 1, color: "#0A192F" }}
                                        className="text-3xl font-mono font-bold"
                                    >
                                        ${totalPrice.toLocaleString()}
                                    </motion.div>
                                )}
                            </div>

                            <Link
                                href={rfqHref}
                                className="bg-primary-900 text-white px-8 py-4 rounded-full font-medium hover:bg-accent-500 transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
                            >
                                Add to Quote
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Export wrapped in Suspense (required for useSearchParams) ─────────
export function ConfiguratorPageClient() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
                </div>
            }
        >
            <ConfiguratorContent />
        </Suspense>
    );
}
