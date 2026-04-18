"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import type { TestimonialData } from "@/types/cms";

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface TestimonialCarouselProps {
    testimonials: TestimonialData[];
    /** Auto-advance interval in ms (0 = disabled). Default 6000. */
    autoPlay?: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function TestimonialCarousel({
    testimonials,
    autoPlay = 6000,
}: TestimonialCarouselProps) {
    const [current, setCurrent] = useState(0);
    const count = testimonials.length;

    const next = useCallback(
        () => setCurrent((i) => (i + 1) % count),
        [count]
    );
    const prev = useCallback(
        () => setCurrent((i) => (i - 1 + count) % count),
        [count]
    );

    useEffect(() => {
        if (!autoPlay || count <= 1) return;
        const id = setInterval(next, autoPlay);
        return () => clearInterval(id);
    }, [autoPlay, count, next]);

    if (count === 0) return null;

    const t = testimonials[current];

    return (
        <section className="relative py-16 lg:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Quote icon */}
                <Quote
                    size={40}
                    className="mx-auto mb-6 text-brand/30"
                    aria-hidden
                />

                {/* Quote text */}
                <blockquote className="text-xl lg:text-2xl font-medium text-foreground leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Rating */}
                {t.rating != null && t.rating > 0 && (
                    <div className="mt-5 flex justify-center gap-1" aria-label={`${t.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                size={18}
                                className={
                                    i < t.rating!
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-border"
                                }
                            />
                        ))}
                    </div>
                )}

                {/* Author */}
                <div className="mt-6 flex items-center justify-center gap-3">
                    {t.avatar ? (
                        <Image
                            src={t.avatar.file}
                            alt={t.author_name}
                            width={44}
                            height={44}
                            className="rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-11 h-11 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-lg">
                            {t.author_name.charAt(0)}
                        </div>
                    )}
                    <div className="text-left">
                        <p className="font-semibold text-foreground">
                            {t.author_name}
                        </p>
                        <p className="text-sm text-muted">
                            {[t.author_role, t.company_name]
                                .filter(Boolean)
                                .join(" · ")}
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                {count > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={prev}
                            aria-label="Previous testimonial"
                            className="p-2 rounded-full border border-border hover:bg-surface-alt transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        {/* Dots */}
                        <div className="flex gap-2">
                            {testimonials.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setCurrent(i)}
                                    aria-label={`Go to testimonial ${i + 1}`}
                                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current
                                            ? "bg-brand"
                                            : "bg-border hover:bg-muted"
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={next}
                            aria-label="Next testimonial"
                            className="p-2 rounded-full border border-border hover:bg-surface-alt transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
