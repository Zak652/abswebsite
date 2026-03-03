"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Box, Target, Layers, Settings } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export function HomePageClient() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">

      {/* 1. HERO SECTION */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hardware_software_hero_1772490241653.png"
            alt="Hardware and software blended imagery"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-primary-900/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-primary-900/40" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-heading font-bold tracking-tight mb-6"
          >
            Control<br />Every Asset.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl font-medium text-white/80 max-w-2xl mx-auto mb-10"
          >
            The enterprise digital product showroom for intelligent asset management, hardware, and lifecycle services.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <Link href="/arcplus" className="w-full sm:w-auto bg-accent-500 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-accent-600 transition-colors shadow-lg hover:shadow-xl">
              Start Free Trial
            </Link>
            <Link href="/configurator" className="w-full sm:w-auto bg-white/10 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-full text-lg font-medium hover:bg-white/20 transition-colors">
              Configure Solution
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. PRODUCT GALLERY (Apple-Style Horizontal Scroll) */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="py-32 overflow-hidden bg-surface"
      >
        <motion.div variants={fadeInUp} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary-900">
            The ecosystem.
          </h2>
          <p className="text-xl text-primary-900/60 mt-4 max-w-2xl">
            Integrated hardware and software perfectly synced to track, manage, and scale your operations.
          </p>
        </motion.div>

        <motion.div variants={fadeInUp} className="relative w-full">
          {/* Horizontal scroll container */}
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-12 px-4 sm:px-6 lg:px-8 space-x-6">
            <div className="snap-center shrink-0 w-[4vw] sm:w-[1vw]"></div>

            <ProductCard
              title="Arcplus"
              imageAlt="Software Dashboard"
              imageSrc="/images/hardware_software_hero_1772490241653.png"
              href="/arcplus"
              ctaText="Explore Software"
            />
            <ProductCard
              title="Scanners"
              imageAlt="Barcode and RFID Scanners"
              imageSrc="/images/barcode_scanner_1772490256748.png"
              href="/scanners"
              ctaText="Explore Hardware"
            />
            <ProductCard
              title="Tags"
              imageAlt="Industrial RFID Tags"
              imageSrc="/images/rfid_tag_1772490270592.png"
              href="/tags"
              ctaText="Explore Tags"
            />

            {/* Services Card */}
            <Link href="/services" className="block group w-[300px] md:w-[400px] flex-shrink-0 snap-center">
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-sm hover:shadow-xl transition-shadow duration-500"
              >
                <Image
                  src="/images/services_hero.png"
                  alt="Field services team performing asset verification"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-900/30 to-transparent" />
                <div className="absolute inset-0 p-10 flex flex-col justify-between z-10">
                  <h3 className="text-3xl font-heading font-bold text-white">Services</h3>
                  <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <span className="inline-flex items-center text-lg font-medium text-accent-500">
                      Explore Services <ArrowRight className="w-5 h-5 ml-2" />
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>

            <div className="snap-center shrink-0 w-[4vw] sm:w-[5vw]"></div>
          </div>
        </motion.div>
      </motion.section>

      {/* 3. GUIDED DECISION SECTION */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="py-24 bg-white"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-heading font-bold text-primary-900">
              What do you need to achieve?
            </h2>
            <p className="text-xl text-primary-900/60 mt-6 font-medium">
              We build solutions aligned to your operational goals.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { href: "/arcplus", icon: Layers, title: "Digitize asset management", desc: "Build a central digital register with automated depreciation and lifecycle tracking.", cta: "Arcplus Software" },
              { href: "/scanners", icon: Target, title: "Capture assets faster", desc: "Ditch manual counts with long-range RFID and intelligent barcode scanning terminals.", cta: "Hardware Catalog" },
              { href: "/tags", icon: Box, title: "Tag assets permanently", desc: "Industrial-grade labels and tags engineered for harsh environments and extreme temperatures.", cta: "Tags Selector" },
              { href: "/services", icon: Settings, title: "Build an asset register", desc: "Let our expert field teams tag, locate, and catalogue your entire fixed asset network.", cta: "Consulting Services" },
            ].map((item) => (
              <motion.div key={item.href} variants={fadeInUp}>
                <Link href={item.href} className="group block">
                  <div className="bg-neutral-100 p-10 rounded-3xl h-full flex items-start space-x-6 hover:bg-primary-900 transition-colors duration-300">
                    <div className="bg-white p-4 rounded-2xl shadow-sm text-primary-900 group-hover:text-accent-500 transition-colors">
                      <item.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold font-heading text-primary-900 group-hover:text-white transition-colors mb-3">
                        {item.title}
                      </h3>
                      <p className="text-primary-900/60 group-hover:text-white/70 transition-colors mb-6 text-lg">
                        {item.desc}
                      </p>
                      <span className="inline-flex items-center font-medium text-accent-500 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                        {item.cta} <ArrowRight className="w-5 h-5 ml-2" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* 4. TRUST LAYER */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="py-24 bg-neutral-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-sm font-bold font-mono text-accent-500 uppercase tracking-widest mb-4">Trusted globally</h2>
            <h3 className="text-3xl md:text-5xl font-heading font-bold text-primary-900">Deployed at scale</h3>
          </motion.div>

          <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: "5M+", label: "Assets Under Management" },
              { value: "42", label: "Countries Deployed" },
              { value: "99.9%", label: "Inventory Accuracy Achieved" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeInUp} className="bg-white p-8 rounded-3xl text-center shadow-sm border border-neutral-200">
                <div className="text-5xl font-mono font-bold text-primary-900 mb-4">{stat.value}</div>
                <p className="text-primary-900/60 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeInUp} className="mt-16 text-center">
            <p className="text-lg font-medium text-primary-900/50 uppercase tracking-widest">Powering leaders in</p>
            <div className="flex flex-wrap justify-center gap-8 mt-8 opacity-60 font-bold font-heading text-xl text-primary-900">
              <span>Logistics</span>
              <span>•</span>
              <span>Manufacturing</span>
              <span>•</span>
              <span>Healthcare</span>
              <span>•</span>
              <span>Defense</span>
              <span>•</span>
              <span>IT Assets</span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Global conversion CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="py-32 bg-primary-900 text-center"
      >
        <div className="max-w-4xl mx-auto px-4">
          <motion.h2 variants={fadeInUp} className="text-5xl font-heading font-bold text-white mb-8">
            Ready to gain control?
          </motion.h2>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/arcplus#pricing" className="bg-accent-500 text-white px-10 py-5 rounded-full text-xl font-medium hover:bg-accent-600 transition-colors">
              Start Free Trial
            </Link>
            <Link href="/configurator" className="bg-transparent text-white border-2 border-white/20 px-10 py-5 rounded-full text-xl font-medium hover:border-white/40 transition-colors">
              Configure Solution
            </Link>
          </motion.div>
          <motion.div variants={fadeInUp} className="mt-6">
            <Link href="/rfq" className="text-white/50 hover:text-accent-500 transition-colors font-medium">
              or request a custom quote →
            </Link>
          </motion.div>
        </div>
      </motion.section>

    </div>
  );
}
