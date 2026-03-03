"use client";

import Link from "next/link";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-primary-900 text-white pt-24 pb-12 border-t border-neutral-100/10 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">

                    {/* Brand & Value Prop */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="inline-block text-3xl font-bold font-heading text-white tracking-tight mb-6">
                            ABS<span className="text-accent-500">.</span>
                        </Link>
                        <p className="text-white/60 text-sm mb-8 max-w-sm">
                            The enterprise digital product showroom for intelligent asset management, hardware, and lifecycle services.
                        </p>
                        <div className="space-y-3 text-sm text-white/50">
                            <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-3 text-accent-500" />
                                <a href="mailto:contact@abssystems.com" className="hover:text-white transition-colors">contact@abssystems.com</a>
                            </div>
                            <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-3 text-accent-500" />
                                <a href="tel:+18005550199" className="hover:text-white transition-colors">+1 (800) 555-0199</a>
                            </div>
                            <div className="flex items-start">
                                <MapPin className="w-4 h-4 mr-3 text-accent-500 mt-0.5" />
                                <span>100 Enterprise Way<br />Suite 400<br />Boston, MA 02110</span>
                            </div>
                        </div>
                    </div>

                    {/* Platform Links */}
                    <div>
                        <h3 className="text-sm font-bold font-mono text-accent-500 uppercase tracking-wider mb-6">Platform</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/arcplus" className="text-white/70 hover:text-white transition-colors text-sm">Arcplus Software</Link>
                            </li>
                            <li>
                                <Link href="/scanners" className="text-white/70 hover:text-white transition-colors text-sm">Industrial Scanners</Link>
                            </li>
                            <li>
                                <Link href="/tags" className="text-white/70 hover:text-white transition-colors text-sm">RFID & Barcode Tags</Link>
                            </li>
                            <li>
                                <Link href="/services" className="text-white/70 hover:text-white transition-colors text-sm">Field Services</Link>
                            </li>
                            <li>
                                <Link href="/training" className="text-white/70 hover:text-white transition-colors text-sm">Training Academy</Link>
                            </li>
                            <li>
                                <Link href="/compare" className="text-white/70 hover:text-white transition-colors text-sm">Compare Solutions</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-sm font-bold font-mono text-accent-500 uppercase tracking-wider mb-6">Resources</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/resources/case-studies" className="text-white/70 hover:text-white transition-colors text-sm">Case Studies</Link>
                            </li>
                            <li>
                                <Link href="/resources/docs" className="text-white/70 hover:text-white transition-colors text-sm">Documentation</Link>
                            </li>
                            <li>
                                <Link href="/resources/api-reference" className="text-white/70 hover:text-white transition-colors text-sm">API Reference</Link>
                            </li>
                            <li>
                                <Link href="/resources/support" className="text-white/70 hover:text-white transition-colors text-sm">Support Portal</Link>
                            </li>
                            <li>
                                <Link href="#" className="text-white/70 hover:text-white transition-colors text-sm">System Status</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Actions / Newsletter */}
                    <div>
                        <h3 className="text-sm font-bold font-mono text-accent-500 uppercase tracking-wider mb-6">Stay Updated</h3>
                        <p className="text-white/60 text-sm mb-4">Subscribe to our newsletter for the latest in enterprise asset management.</p>
                        <form className="mb-8" onSubmit={(e) => e.preventDefault()}>
                            <div className="flex">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="bg-white/5 border border-white/10 rounded-l-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent-500 w-full"
                                />
                                <button type="submit" className="bg-accent-500 text-white px-4 py-3 rounded-r-xl hover:bg-accent-600 transition-colors">
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </form>

                        <div className="space-y-3">
                            <Link href="/arcplus#pricing" className="block w-full text-center bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors text-sm">
                                Start Free Trial
                            </Link>
                            <Link href="/rfq" className="block w-full text-center bg-transparent border border-white/20 hover:border-white/40 text-white font-medium py-3 rounded-xl transition-colors text-sm">
                                Request Quote
                            </Link>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-xs text-white/40">
                    <p>&copy; {currentYear} ABS Systems Inc. All rights reserved.</p>
                    <div className="flex space-x-6">
                        <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="#" className="hover:text-white transition-colors">Cookie Settings</Link>
                    </div>
                </div>

            </div>
        </footer>
    );
}
