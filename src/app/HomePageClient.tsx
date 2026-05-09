"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Box, Target, Layers, Settings } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import LogoCarousel from "@/components/patterns/LogoCarousel";
import TestimonialCarousel from "@/components/patterns/TestimonialCarousel";
import { CMSHero } from "@/components/cms/CMSHero";
import type { HeroSectionData, PageBlockData, TestimonialData } from "@/types/cms";

interface HomePageClientProps {
  hero: HeroSectionData | null;
  blocks: PageBlockData[];
  testimonials?: TestimonialData[];
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const noMotion: Variants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const noStagger = {
  visible: { transition: { staggerChildren: 0 } },
};

/* Default hardcoded values used when CMS data is unavailable */
const DEFAULT_HERO = {
  headline: "Control\nEvery Asset.",
  subheadline:
    "The enterprise digital product showroom for intelligent asset management, hardware, and lifecycle services.",
  cta_primary_text: "Start Free Trial",
  cta_primary_link: "/arcplus",
  cta_secondary_text: "Configure Solution",
  cta_secondary_link: "/configurator",
  background_image: null as null,
};

const DEFAULT_GUIDED = [
  { href: "/arcplus", icon: Layers, title: "Digitize asset management", desc: "Build a central digital register with automated depreciation and lifecycle tracking.", cta: "Arcplus Software" },
  { href: "/scanners", icon: Target, title: "Capture assets faster", desc: "Ditch manual counts with long-range RFID and intelligent barcode scanning terminals.", cta: "Hardware Catalog" },
  { href: "/tags", icon: Box, title: "Tag assets permanently", desc: "Industrial-grade labels and tags engineered for harsh environments and extreme temperatures.", cta: "Tags Selector" },
  { href: "/services", icon: Settings, title: "Build an asset register", desc: "Let our expert field teams tag, locate, and catalogue your entire fixed asset network.", cta: "Consulting Services" },
];

const DEFAULT_WORKFLOW = [
  { title: "Expertise", desc: "Deep technical knowledge in asset management" },
  { title: "Experience", desc: "Proven delivery across diverse environments" },
  { title: "Methodology", desc: "Structured system driven approach" },
  { title: "Reliable delivery", desc: "Consistent results that exceed expectations" },
];

const DEFAULT_LOGOS = [
  { name: "Acme Corp", url: "/images/logos/acme.svg" },
  { name: "Globex", url: "/images/logos/globex.svg" },
  { name: "Initech", url: "/images/logos/initech.svg" },
  { name: "Umbrella", url: "/images/logos/umbrella.svg" },
  { name: "Waystar", url: "/images/logos/waystar.svg" },
  { name: "Hooli", url: "/images/logos/hooli.svg" },
  { name: "Massive Dynamic", url: "/images/logos/massive-dynamic.svg" },
  { name: "Soylent Corp", url: "/images/logos/soylent.svg" },
];

const DEFAULT_TESTIMONIALS: TestimonialData[] = [
  {
    id: 1,
    quote: "Achieved 100% asset visibility across 47 departments.",
    author_name: "County Asset Manager",
    author_role: "Asset Manager",
    company_name: "Lamu County Government",
    industry: "Government",
    avatar: null,
    rating: 5,
    placement: "homepage",
    order: 1,
  },
  {
    id: 2,
    quote: "Reduced equipment downtime by 40% with predictive maintenance.",
    author_name: "Head of Ground Operations",
    author_role: "Head of Ground Operations",
    company_name: "Pan African Airways",
    industry: "Aviation MRO",
    avatar: null,
    rating: 5,
    placement: "homepage",
    order: 2,
  },
  {
    id: 3,
    quote: "Digitized 28,000 assets in 3 weeks.",
    author_name: "Director of Infrastructure",
    author_role: "Director of Infrastructure",
    company_name: "Nairobi Metropolitan Services",
    industry: "Public Utilities",
    avatar: null,
    rating: 5,
    placement: "homepage",
    order: 3,
  },
];

const ICON_MAP: Record<string, typeof Layers> = { Layers, Target, Box, Settings };

export function HomePageClient({ hero, blocks, testimonials = [] }: HomePageClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const fade = prefersReducedMotion ? noMotion : fadeInUp;
  const stg = prefersReducedMotion ? noStagger : stagger;

  /* Resolve CMS page blocks by block_type */
  const featureBlock = blocks.find((b) => b.block_type === "feature_grid");
  const guidedBlock = blocks.find((b) => b.block_type === "guided_path");
  const workflowBlock = blocks.find((b) => b.block_type === "workflow");
  const statsBlock = blocks.find((b) => b.block_type === "stats_row");
  const logoBlock = blocks.find((b) => b.block_type === "logo_carousel");
  const testimonialsBlock = blocks.find((b) => b.block_type === "testimonials_section");

  /* Feature grid cards from CMS data or defaults */
  const featureCards =
    featureBlock?.data?.cards && Array.isArray(featureBlock.data.cards)
      ? (featureBlock.data.cards as { title: string; href: string; ctaText: string; imageAlt: string; imageSrc: string }[])
      : [
        { title: "Arcplus", href: "/arcplus", ctaText: "Explore Software", imageAlt: "Software Dashboard", imageSrc: "/images/hardware_software_hero_1772490241653.png" },
        { title: "Scanners", href: "/scanners", ctaText: "Explore Hardware", imageAlt: "Barcode and RFID Scanners", imageSrc: "/images/barcode_scanner_1772490256748.png" },
        { title: "Tags", href: "/tags", ctaText: "Explore Tags", imageAlt: "Industrial RFID Tags", imageSrc: "/images/rfid_tag_1772490270592.png" },
        { title: "Services", href: "/services", ctaText: "Explore Services", imageAlt: "Field services team", imageSrc: "/images/services_hero.png" },
      ];

  /* Guided decision items from CMS data or defaults */
  const guidedItems =
    guidedBlock?.data?.items && Array.isArray(guidedBlock.data.items)
      ? (guidedBlock.data.items as { href: string; icon: string; title: string; desc: string; cta: string }[]).map((item) => ({
        ...item,
        icon: ICON_MAP[item.icon] ?? Layers,
      }))
      : DEFAULT_GUIDED;

  /* Workflow steps from CMS data or defaults */
  const workflowSteps =
    workflowBlock?.data?.steps && Array.isArray(workflowBlock.data.steps)
      ? (workflowBlock.data.steps as { title: string; desc: string }[])
      : DEFAULT_WORKFLOW;

  /* Logo carousel from CMS data or defaults */
  const logos =
    logoBlock?.data?.logos && Array.isArray(logoBlock.data.logos)
      ? (logoBlock.data.logos as { name: string; url: string }[])
      : DEFAULT_LOGOS;

  const homepageTestimonials = testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;

  /* Horizontal scroll controls for product gallery */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScrollState]);

  const scrollBy = useCallback((direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>(":scope > a"));
    if (cards.length === 0) return;

    const scrollPad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    const containerLeft = el.getBoundingClientRect().left;
    const currentScroll = el.scrollLeft;
    // The "aligned" position is currentScroll + scrollPad
    const alignedEdge = currentScroll + scrollPad;

    if (direction === 1) {
      const next = cards.find((card) => {
        const absLeft = card.getBoundingClientRect().left - containerLeft + currentScroll;
        return absLeft > alignedEdge + 2;
      });
      if (next) {
        const absLeft = next.getBoundingClientRect().left - containerLeft + currentScroll;
        el.scrollTo({ left: absLeft - scrollPad, behavior: "smooth" });
      }
    } else {
      const prev = [...cards].reverse().find((card) => {
        const absLeft = card.getBoundingClientRect().left - containerLeft + currentScroll;
        return absLeft < alignedEdge - 2;
      });
      if (prev) {
        const absLeft = prev.getBoundingClientRect().left - containerLeft + currentScroll;
        el.scrollTo({ left: absLeft - scrollPad, behavior: "smooth" });
      }
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-surface">

      {/* 1. HERO SECTION */}
      <CMSHero
        hero={hero}
        fallbackHeading={
          <>
            <span>Control</span>
            <br />
            <span>Every Asset.</span>
          </>
        }
        fallbackSubheading={DEFAULT_HERO.subheadline}
        fallbackImageSrc="/images/hardware_software_hero_1772490241653.png"
        fallbackImageAlt="Hardware and software blended imagery"
        minHeight="90vh"
        priority
      />

      {/* 2. PRODUCT GALLERY (Apple-Style Horizontal Scroll) */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stg}
        className="py-32 overflow-hidden bg-surface"
      >
        <motion.div variants={fade} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary-900">
            {featureBlock?.title ?? "The ecosystem."}
          </h2>
          <p className="text-xl text-primary-900/60 mt-4 max-w-2xl">
            {featureBlock?.body ?? "Integrated hardware and software perfectly synced to track, manage, and scale your operations."}
          </p>
        </motion.div>

        <motion.div variants={fade} className="relative w-full group/gallery">
          {/* Left / Right navigation arrows */}
          <button
            aria-label="Scroll left"
            onClick={() => scrollBy(-1)}
            className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur shadow-lg rounded-full p-3 text-primary-900 hover:bg-white transition-all ${canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            aria-label="Scroll right"
            onClick={() => scrollBy(1)}
            className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur shadow-lg rounded-full p-3 text-primary-900 hover:bg-white transition-all ${canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Horizontal scroll container */}
          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-12 gap-6 scroll-smooth scroll-pl-4 sm:scroll-pl-6 lg:scroll-pl-[max(2rem,calc((100vw-80rem)/2+2rem))]"
          >
            <div className="shrink-0 w-4 sm:w-6 lg:w-[max(2rem,calc((100vw-80rem)/2+2rem))]"></div>

            {featureCards.map((card) => (
              <ProductCard
                key={card.href}
                title={card.title}
                imageAlt={card.imageAlt}
                imageSrc={card.imageSrc}
                href={card.href}
                ctaText={card.ctaText}
                className="snap-start"
              />
            ))}

            <div className="shrink-0 w-4 sm:w-6 lg:w-[max(2rem,calc((100vw-80rem)/2+2rem))]"></div>
          </div>
        </motion.div>
      </motion.section>

      {/* 3. GUIDED DECISION SECTION */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stg}
        className="py-24 bg-white"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fade} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-heading font-bold text-primary-900">
              {guidedBlock?.title ?? "What do you need to achieve?"}
            </h2>
            <p className="text-xl text-primary-900/60 mt-6 font-medium">
              {guidedBlock?.body ?? "We build solutions aligned to your operational goals."}
            </p>
          </motion.div>

          <motion.div variants={stg} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guidedItems.map((item, idx) => (
              <motion.div key={`${idx}-${item.href}`} variants={fade}>
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

      {/* 4. WHY CHOOSE ABS (Workflow) */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stg}
        className="py-24 bg-primary-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fade} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white">
              {workflowBlock?.title ?? "Why organisations choose ABS?"}
            </h2>
            <p className="text-xl text-white/60 mt-4">
              {workflowBlock?.body ?? "Here is why"}
            </p>
          </motion.div>

          <motion.div variants={stg} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {workflowSteps.map((step, idx) => (
              <motion.div
                key={`${idx}-${step.title}`}
                variants={fade}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
              >
                <span className="inline-block text-sm font-mono font-bold text-accent-500 mb-4">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg md:text-xl font-heading font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm md:text-base text-white/50">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* 5. TRUST LAYER */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stg}
        className="pt-24 pb-24 bg-neutral-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fade} className="text-center mb-16">
            <h2 className="text-sm font-bold font-mono text-accent-500 uppercase tracking-widest mb-4">
              {logoBlock?.data?.eyebrow as string ?? statsBlock?.data?.eyebrow as string ?? "Trusted by many"}
            </h2>
            <h3 className="text-3xl md:text-5xl font-heading font-bold text-primary-900">
              {logoBlock?.title ?? statsBlock?.title ?? "Trusted by industry leaders"}
            </h3>
          </motion.div>

          <motion.div variants={fade}>
            <LogoCarousel logos={logos} />
          </motion.div>

          <motion.div variants={fade} className="mt-16 text-center">
            <p className="text-lg font-medium text-primary-900/50 uppercase tracking-widest">
              {(logoBlock ?? statsBlock)?.data?.industries_header as string ?? "Powering leaders in"}
            </p>
            <div className="flex flex-wrap justify-center gap-8 mt-8 opacity-60 font-bold font-heading text-xl text-primary-900">
              {(Array.isArray((logoBlock ?? statsBlock)?.data?.industries)
                ? ((logoBlock ?? statsBlock)!.data!.industries as string[])
                : [
                  "Government & Public Institutions",
                  "NGOs & Development Partners",
                  "Utilities & Infrastructure Partners",
                  "Healthcare & Laboratory Providers",
                  "Corporate & Private Sector Organizations",
                ]
              ).map((industry, idx, arr) => (
                <span key={idx}>
                  {industry}{idx < arr.length - 1 && <span className="ml-8">•</span>}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* 6. TESTIMONIALS */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stg}
        className="relative overflow-hidden border-t border-primary-900/8 bg-[linear-gradient(180deg,#fff4e8_0%,#fffaf4_38%,#ffffff_100%)] py-28"
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,122,26,0.14),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(92,145,220,0.08),_transparent_28%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fade} className="mb-14 text-center">
            <div className="mb-8 flex items-center justify-center gap-4">
              <span className="h-px w-16 bg-gradient-to-r from-transparent to-accent-500/50" />
              <span className="rounded-full border border-accent-500/15 bg-white/70 px-4 py-2 text-[0.7rem] font-mono font-bold uppercase tracking-[0.28em] text-primary-900/45 shadow-sm backdrop-blur-sm">
                {(testimonialsBlock?.data?.eyebrow_tag as string | undefined) ?? "Customer voices"}
              </span>
              <span className="h-px w-16 bg-gradient-to-l from-transparent to-accent-500/50" />
            </div>
            <p className="mb-4 text-sm font-bold font-mono uppercase tracking-[0.3em] text-accent-500">
              {(testimonialsBlock?.data?.eyebrow_label as string | undefined) ?? "Proven in the field"}
            </p>
            <h2 className="text-4xl font-heading font-bold text-primary-900 md:text-5xl">
              {testimonialsBlock?.title || "What teams say after deployment"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-900/60">
              {testimonialsBlock?.body || "Real outcomes from organizations using ABS to digitize registers, improve traceability, and move faster with confidence."}
            </p>
          </motion.div>

          <motion.div variants={fade}>
            <TestimonialCarousel testimonials={homepageTestimonials} autoPlay={7000} />
          </motion.div>
        </div>
      </motion.section>

    </div>
  );
}
