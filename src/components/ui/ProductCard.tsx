"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ProductCardProps {
    title: string;
    imageAlt: string;
    imageSrc: string;
    href: string;
    ctaText: string;
    className?: string;
}

export default function ProductCard({ title, imageAlt, imageSrc, href, ctaText, className }: ProductCardProps) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <Link href={href} className={`block group w-[300px] md:w-[400px] flex-shrink-0 ${className ?? ""}`}>
            <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative bg-neutral-100 rounded-3xl overflow-hidden aspect-[4/5] shadow-sm hover:shadow-xl transition-shadow duration-500"
            >
                <div className="absolute inset-0 p-8 flex flex-col z-10">
                    <h3 className="text-2xl font-heading font-bold text-primary-900">{title}</h3>

                    <div className="mt-auto opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        <span className="inline-flex items-center text-sm font-medium text-accent-500">
                            {ctaText} <ArrowRight className="w-4 h-4 ml-1" />
                        </span>
                    </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                        sizes="(max-width: 768px) 300px, 400px"
                    />
                </div>

                {/* Subtle gradient overlay to ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-surface/60 via-transparent to-transparent pointer-events-none" />
            </motion.div>
        </Link>
    );
}
