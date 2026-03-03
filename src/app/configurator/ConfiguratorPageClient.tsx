"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Check, Tag, Shield, Zap, Battery } from "lucide-react";
import Link from "next/link";

// --- Configuration Data ---
const configOptions = {
    models: [
        { id: "std", name: "Standard (Wi-Fi Only)", price: 850, desc: "Perfect for indoor warehouse operations.", badge: null },
        { id: "pro", name: "Professional (LTE + Wi-Fi)", price: 1150, desc: "For field service and yard management.", badge: "Popular" },
    ],
    engines: [
        { id: "2d", name: "1D/2D Imager", price: 0, desc: "Standard range scanning." },
        { id: "lr", name: "Long-Range Imager", price: 200, desc: "Scan barcodes up to 45 ft away." },
        { id: "rfid", name: "RFID UHF Module", price: 500, desc: "Bulk capture of hundreds of tags instantly." },
    ],
    batteries: [
        { id: "std_bat", name: "Standard 4000mAh", price: 0, desc: "Up to 8 hours of continuous use." },
        { id: "ext_bat", name: "Extended 6000mAh", price: 75, desc: "Up to 14 hours of continuous use." },
        { id: "hot_swap", name: "Hot-Swap System", price: 150, desc: "Zero downtime battery replacement." },
    ],
    protection: [
        { id: "none", name: "Standard Casing", price: 0, desc: "IP65 rated against dust and water." },
        { id: "boot", name: "Rugged Boot", price: 85, desc: "Added drop protection up to 6ft." },
        { id: "ex", name: "Full ATEX / Ex-Proof", price: 800, desc: "Intrinsically safe for hazardous areas." },
    ]
};

// Badge icons for visual overlay
const overlayConfig: Record<string, { icon: typeof Tag; label: string; color: string; position: string }[]> = {
    rfid: [{ icon: Tag, label: "RFID Ready", color: "bg-accent-500 text-white", position: "top-10 right-10" }],
    lr: [{ icon: Zap, label: "Long Range", color: "bg-blue-500 text-white", position: "top-10 right-10" }],
    ex: [{ icon: Shield, label: "ATEX Ex-Proof", color: "bg-yellow-400 text-black", position: "bottom-10 left-10" }],
    boot: [{ icon: Shield, label: "Rugged Boot", color: "bg-green-500 text-white", position: "bottom-10 left-10" }],
    pro: [{ icon: Zap, label: "LTE Enabled", color: "bg-purple-500 text-white", position: "top-10 left-10" }],
    ext_bat: [{ icon: Battery, label: "Extended Battery", color: "bg-emerald-500 text-white", position: "bottom-10 right-10" }],
    hot_swap: [{ icon: Battery, label: "Hot-Swap", color: "bg-emerald-600 text-white", position: "bottom-10 right-10" }],
};

export function ConfiguratorPageClient() {
    const [selections, setSelections] = useState({
        model: configOptions.models[0],
        engine: configOptions.engines[0],
        battery: configOptions.batteries[0],
        protection: configOptions.protection[0],
    });
    const [quantity, setQuantity] = useState(1);

    const totalPrice = (selections.model.price + selections.engine.price + selections.battery.price + selections.protection.price) * quantity;

    // Collect all active overlays
    const activeOverlays = [
        ...(overlayConfig[selections.engine.id] || []),
        ...(overlayConfig[selections.protection.id] || []),
        ...(overlayConfig[selections.model.id] || []),
        ...(overlayConfig[selections.battery.id] || []),
    ];

    // Generate a composite key for visual transitions
    const visualKey = `${selections.model.id}-${selections.engine.id}-${selections.battery.id}-${selections.protection.id}`;

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Header */}
            <div className="pt-24 px-4 sm:px-6 lg:px-8 border-b border-neutral-100 pb-4 bg-white z-20">
                <Link href="/scanners" className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Scanners
                </Link>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary-900">Configure Handheld Scanner</h1>
            </div>

            {/* Main Layout: Visuals (Left) & Options (Right) */}
            <div className="flex-1 flex flex-col lg:flex-row pb-24 lg:pb-0">

                {/* LEFT: Visuals (Sticky on desktop) */}
                <div className="w-full lg:w-1/2 bg-surface relative lg:sticky lg:top-36 lg:h-[calc(100vh-144px)] flex items-center justify-center p-8 lg:p-16 border-r border-neutral-100">
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
                                src="/images/barcode_scanner_1772490256748.png"
                                alt="Scanner configuration preview"
                                fill
                                className="object-contain drop-shadow-2xl"
                                priority
                            />

                            {/* Dynamic overlays for ALL option changes */}
                            {activeOverlays.map((overlay, idx) => (
                                <motion.div
                                    key={`${overlay.label}-${idx}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`absolute ${overlay.position} ${overlay.color} text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg`}
                                >
                                    <overlay.icon className="w-3.5 h-3.5 mr-1.5" /> {overlay.label}
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* RIGHT: Options Selector */}
                <div className="w-full lg:w-1/2 p-4 sm:p-8 lg:p-16 overflow-y-auto lg:h-[calc(100vh-144px)] mb-32 lg:mb-0 pb-40">

                    <div className="space-y-12 max-w-xl mx-auto">

                        {/* Model Section */}
                        <section>
                            <h2 className="text-xl font-heading font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">1. Base Model</h2>
                            <div className="space-y-3">
                                {configOptions.models.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSelections(s => ({ ...s, model: opt }))}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 relative ${selections.model.id === opt.id
                                            ? 'border-accent-500 bg-accent-500/5'
                                            : 'border-neutral-200 hover:border-primary-900/20'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center">
                                                <span className="font-bold text-primary-900">{opt.name}</span>
                                                {opt.badge && (
                                                    <span className="ml-2 text-[10px] font-bold text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded-full uppercase">{opt.badge}</span>
                                                )}
                                            </div>
                                            <span className="font-mono text-primary-900/60">${opt.price}</span>
                                        </div>
                                        <p className="text-sm text-primary-900/60 pr-8">{opt.desc}</p>
                                        {selections.model.id === opt.id && <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-500 w-5 h-5" />}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Engine Section */}
                        <section>
                            <h2 className="text-xl font-heading font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">2. Scanning Engine</h2>
                            <div className="space-y-3">
                                {configOptions.engines.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSelections(s => ({ ...s, engine: opt }))}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 relative ${selections.engine.id === opt.id
                                            ? 'border-accent-500 bg-accent-500/5'
                                            : 'border-neutral-200 hover:border-primary-900/20'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-primary-900">{opt.name}</span>
                                            <span className="font-mono text-primary-900/60">{opt.price === 0 ? 'Included' : `+$${opt.price}`}</span>
                                        </div>
                                        <p className="text-sm text-primary-900/60 pr-8">{opt.desc}</p>
                                        {selections.engine.id === opt.id && <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-500 w-5 h-5" />}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Battery Section */}
                        <section>
                            <h2 className="text-xl font-heading font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">3. Battery Setup</h2>
                            <div className="space-y-3">
                                {configOptions.batteries.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSelections(s => ({ ...s, battery: opt }))}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 relative ${selections.battery.id === opt.id
                                            ? 'border-accent-500 bg-accent-500/5'
                                            : 'border-neutral-200 hover:border-primary-900/20'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-primary-900">{opt.name}</span>
                                            <span className="font-mono text-primary-900/60">{opt.price === 0 ? 'Included' : `+$${opt.price}`}</span>
                                        </div>
                                        <p className="text-sm text-primary-900/60 pr-8">{opt.desc}</p>
                                        {selections.battery.id === opt.id && <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-500 w-5 h-5" />}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Protection Section */}
                        <section>
                            <h2 className="text-xl font-heading font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">4. Protection</h2>
                            <div className="space-y-3">
                                {configOptions.protection.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSelections(s => ({ ...s, protection: opt }))}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 relative ${selections.protection.id === opt.id
                                            ? 'border-accent-500 bg-accent-500/5'
                                            : 'border-neutral-200 hover:border-primary-900/20'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-primary-900">{opt.name}</span>
                                            <span className="font-mono text-primary-900/60">{opt.price === 0 ? 'Included' : `+$${opt.price}`}</span>
                                        </div>
                                        <p className="text-sm text-primary-900/60 pr-8">{opt.desc}</p>
                                        {selections.protection.id === opt.id && <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-500 w-5 h-5" />}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Quantity */}
                        <section>
                            <h2 className="text-xl font-heading font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">5. Quantity</h2>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
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
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="w-12 h-12 rounded-xl border-2 border-neutral-200 flex items-center justify-center text-xl font-bold text-primary-900 hover:border-primary-900/30 transition-colors"
                                    aria-label="Increase quantity"
                                >
                                    +
                                </button>
                            </div>
                        </section>

                    </div>
                </div>
            </div>

            {/* BOTTOM: Sticky Summary Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                    <div className="hidden sm:block">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Summary</h4>
                        <div className="flex space-x-2 text-sm font-medium text-primary-900 mt-1">
                            <span>{selections.model.name}</span>
                            <span className="text-gray-300">|</span>
                            <span>{selections.engine.name}</span>
                            <span className="text-gray-300">|</span>
                            <span>×{quantity}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Price</div>
                            <motion.div
                                key={totalPrice}
                                initial={{ scale: 1.1, color: "#F97316" }}
                                animate={{ scale: 1, color: "#0A192F" }}
                                className="text-3xl font-mono font-bold"
                            >
                                ${totalPrice.toLocaleString()}
                            </motion.div>
                        </div>

                        <Link
                            href="/rfq"
                            className="bg-primary-900 text-white px-8 py-4 rounded-full font-medium hover:bg-accent-500 transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
                        >
                            Add to Quote
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
}
