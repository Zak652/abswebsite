"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react";

const scannersMenu = [
    {
        category: "Fixed Scanners",
        items: [
            { name: "Barcode Fixed", desc: "High-speed conveyor scanning", image: "/images/barcode_scanner_1772490256748.png", href: "/scanners" },
            { name: "RFID Fixed", desc: "Dock door & portal readers", image: "/images/barcode_scanner_1772490256748.png", href: "/scanners" },
        ],
    },
    {
        category: "Handheld Devices",
        items: [
            { name: "PDA Scanners", desc: "Rugged mobile computers", image: "/images/barcode_scanner_1772490256748.png", href: "/scanners" },
            { name: "Opticon Readers", desc: "Companion Bluetooth scanners", image: "/images/barcode_scanner_1772490256748.png", href: "/scanners" },
            { name: "Handheld RFID", desc: "Inventory & cycle counting", image: "/images/barcode_scanner_1772490256748.png", href: "/scanners" },
        ],
    },
    {
        category: "Wearable",
        items: [
            { name: "Ring Scanners", desc: "Hands-free picking", image: "/images/barcode_scanner_1772490256748.png", href: "/scanners" },
            { name: "Wearable RFID", desc: "Ergonomic continuous read", image: "/images/barcode_scanner_1772490256748.png", href: "/scanners" },
        ],
    },
];

const tagsMenu = [
    {
        category: "RFID Tags",
        items: [
            { name: "Metal mount", desc: "On-metal tracking", image: "/images/rfid_tag_1772490270592.png", href: "/tags" },
            { name: "Long range", desc: "Yard management up to 20m", image: "/images/rfid_tag_1772490270592.png", href: "/tags" },
            { name: "Industrial", desc: "High-temperature & rugged", image: "/images/rfid_tag_1772490270592.png", href: "/tags" },
        ],
    },
    {
        category: "Barcode Tags",
        items: [
            { name: "Polyester", desc: "Durable indoor labels", image: "/images/rfid_tag_1772490270592.png", href: "/tags" },
            { name: "Aluminum", desc: "Harsh environment plates", image: "/images/rfid_tag_1772490270592.png", href: "/tags" },
            { name: "Tamper proof", desc: "Security and warranty", image: "/images/rfid_tag_1772490270592.png", href: "/tags" },
        ],
    },
    {
        category: "GPS Tags",
        items: [
            { name: "Fleet tracking", desc: "Real-time vehicle location", image: "/images/rfid_tag_1772490270592.png", href: "/tags" },
            { name: "Asset tracking", desc: "High-value unpowered assets", image: "/images/rfid_tag_1772490270592.png", href: "/tags" },
        ],
    },
];

export default function Header() {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileStep, setMobileStep] = useState<string | null>(null);

    const handleMouseEnter = (menu: string) => {
        setActiveMenu(menu);
    };

    const handleMouseLeave = () => {
        setActiveMenu(null);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-neutral-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="text-2xl font-bold font-heading text-primary-900 tracking-tight">
                            ABS<span className="text-accent-500">.</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8 h-full items-center" onMouseLeave={handleMouseLeave}>
                        <Link href="/arcplus" className="text-sm font-medium text-primary-900/80 hover:text-primary-900 transition-colors">
                            Arcplus
                        </Link>

                        {/* Scanners Dropdown */}
                        <div className="relative h-full flex items-center" onMouseEnter={() => handleMouseEnter("scanners")}>
                            <Link href="/scanners" className="flex items-center space-x-1 text-sm font-medium text-primary-900/80 hover:text-primary-900 transition-colors">
                                <span>Scanners</span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeMenu === "scanners" ? "rotate-180" : ""}`} />
                            </Link>
                        </div>

                        {/* Tags Dropdown */}
                        <div className="relative h-full flex items-center" onMouseEnter={() => handleMouseEnter("tags")}>
                            <Link href="/tags" className="flex items-center space-x-1 text-sm font-medium text-primary-900/80 hover:text-primary-900 transition-colors">
                                <span>Tags</span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeMenu === "tags" ? "rotate-180" : ""}`} />
                            </Link>
                        </div>

                        <Link href="/services" className="text-sm font-medium text-primary-900/80 hover:text-primary-900 transition-colors">
                            Services
                        </Link>
                        <Link href="/training" className="text-sm font-medium text-primary-900/80 hover:text-primary-900 transition-colors">
                            Training
                        </Link>
                    </nav>

                    {/* CTA */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link href="/rfq" className="text-sm font-medium text-primary-900 hover:text-accent-500 transition-colors">
                            Get Quote
                        </Link>
                        <Link href="/arcplus#pricing" className="bg-primary-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-accent-500 transition-colors shadow-sm hover:shadow-md">
                            Start Trial
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => {
                                setMobileMenuOpen(!mobileMenuOpen);
                                setMobileStep(null);
                            }}
                            className="text-primary-900 p-2"
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Mega Menus */}
            <AnimatePresence>
                {activeMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-20 left-0 right-0 bg-white border-b border-neutral-100 shadow-xl overflow-hidden"
                        onMouseEnter={() => handleMouseEnter(activeMenu)}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                            <div className="grid grid-cols-4 gap-8">
                                {(activeMenu === "scanners" ? scannersMenu : tagsMenu).map((group, idx) => (
                                    <div key={idx}>
                                        <h3 className="text-xs font-bold font-mono text-primary-900/50 uppercase tracking-wider mb-4">
                                            {group.category}
                                        </h3>
                                        <ul className="space-y-4">
                                            {group.items.map((item, itemIdx) => (
                                                <li key={itemIdx}>
                                                    <Link href={item.href} className="group flex items-center space-x-3">
                                                        {/* Product thumbnail */}
                                                        <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 relative">
                                                            <Image
                                                                src={item.image}
                                                                alt={item.name}
                                                                fill
                                                                className="object-contain p-1"
                                                                sizes="40px"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm font-medium text-primary-900 group-hover:text-accent-500 transition-colors block">
                                                                {item.name}
                                                            </span>
                                                            <p className="text-xs text-primary-900/60 truncate">{item.desc}</p>
                                                        </div>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}

                                {/* Promo/Action Column */}
                                <div className="bg-neutral-100 p-6 rounded-2xl flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-primary-900 mb-2">Not sure what you need?</h4>
                                        <p className="text-xs text-primary-900/60 mb-4">Use our visual comparison tool to find the perfect match for your environment.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <Link href="/compare" className="flex items-center text-sm font-medium text-accent-500 hover:text-primary-900 transition-colors">
                                            Compare Products <ArrowRight className="w-4 h-4 ml-1" />
                                        </Link>
                                        <Link href="/configurator" className="flex items-center text-sm font-medium text-primary-900/70 hover:text-primary-900 transition-colors">
                                            Configure Hardware <ArrowRight className="w-4 h-4 ml-1" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "100vh" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden fixed top-20 left-0 right-0 bg-surface z-40 overflow-y-auto pb-24"
                    >
                        <div className="px-4 py-6">
                            {!mobileStep ? (
                                <div className="space-y-6">
                                    <Link href="/arcplus" className="block text-xl font-heading font-semibold text-primary-900" onClick={() => setMobileMenuOpen(false)}>Arcplus</Link>
                                    <button
                                        onClick={() => setMobileStep("scanners")}
                                        className="flex items-center justify-between w-full text-xl font-heading font-semibold text-primary-900"
                                    >
                                        Scanners <ArrowRight className="w-5 h-5 text-primary-900/40" />
                                    </button>
                                    <button
                                        onClick={() => setMobileStep("tags")}
                                        className="flex items-center justify-between w-full text-xl font-heading font-semibold text-primary-900"
                                    >
                                        Tags <ArrowRight className="w-5 h-5 text-primary-900/40" />
                                    </button>
                                    <Link href="/services" className="block text-xl font-heading font-semibold text-primary-900" onClick={() => setMobileMenuOpen(false)}>Services</Link>
                                    <Link href="/training" className="block text-xl font-heading font-semibold text-primary-900" onClick={() => setMobileMenuOpen(false)}>Training</Link>

                                    <div className="pt-8 border-t border-neutral-100 flex flex-col space-y-4">
                                        <Link href="/arcplus#pricing" className="w-full text-center bg-primary-900 text-white px-5 py-3.5 rounded-xl font-medium" onClick={() => setMobileMenuOpen(false)}>
                                            Start Free Trial
                                        </Link>
                                        <Link href="/rfq" className="w-full text-center text-primary-900 font-medium py-3.5 border border-neutral-200 rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                                            Get Quote
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <button
                                        onClick={() => setMobileStep(null)}
                                        className="flex items-center text-sm font-medium text-primary-900/60 mb-6"
                                        aria-label="Back to menu"
                                    >
                                        <ChevronDown className="w-4 h-4 mr-1 rotate-90" /> Back to Menu
                                    </button>
                                    <h2 className="text-2xl font-heading font-bold text-primary-900 mb-6 capitalize">{mobileStep}</h2>

                                    <div className="space-y-8">
                                        {(mobileStep === "scanners" ? scannersMenu : tagsMenu).map((group, idx) => (
                                            <div key={idx}>
                                                <h3 className="text-xs font-bold font-mono text-accent-500 uppercase tracking-wider mb-4">
                                                    {group.category}
                                                </h3>
                                                <ul className="space-y-4">
                                                    {group.items.map((item, itemIdx) => (
                                                        <li key={itemIdx}>
                                                            <Link href={item.href} className="flex items-center space-x-3" onClick={() => setMobileMenuOpen(false)}>
                                                                <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 relative">
                                                                    <Image src={item.image} alt={item.name} fill className="object-contain p-1" sizes="48px" />
                                                                </div>
                                                                <div>
                                                                    <span className="block text-base font-medium text-primary-900">{item.name}</span>
                                                                    <span className="block text-xs text-primary-900/60 mt-0.5">{item.desc}</span>
                                                                </div>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-6 border-t border-neutral-100">
                                        <Link href="/compare" className="flex items-center text-sm font-medium text-accent-500 py-3" onClick={() => setMobileMenuOpen(false)}>
                                            Compare {mobileStep === "scanners" ? "Scanners" : "Tags"} <ArrowRight className="w-4 h-4 ml-1" />
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
