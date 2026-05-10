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
    const metaLine = [t.author_role, t.company_name].filter(Boolean).join(" · ");

    return (
        <div className="relative overflow-hidden rounded-[2rem] border border-primary-900/10 bg-white shadow-[0_24px_80px_rgba(12,31,61,0.12)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,122,26,0.08),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(55,113,201,0.08),_transparent_34%)]" />
            <div className="relative px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
                <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-600/10 text-accent-700">
                            <Quote size={28} aria-hidden />
                        </div>
                        {t.industry && (
                            <span className="rounded-full border border-primary-900/10 bg-primary-900/[0.03] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-primary-900/50">
                                {t.industry}
                            </span>
                        )}
                    </div>

                    {count > 1 && (
                        <div className="hidden sm:flex items-center gap-3">
                            <button
                                type="button"
                                onClick={prev}
                                aria-label="Previous testimonial"
                                className="flex h-11 w-11 items-center justify-center rounded-full border border-primary-900/10 text-primary-900/65 transition-colors hover:border-primary-900/30 hover:text-primary-900"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={next}
                                aria-label="Next testimonial"
                                className="flex h-11 w-11 items-center justify-center rounded-full border border-primary-900/10 text-primary-900/65 transition-colors hover:border-primary-900/30 hover:text-primary-900"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>

                <blockquote className="mt-8 max-w-4xl text-2xl font-medium leading-relaxed text-primary-900 md:text-4xl md:leading-[1.15]">
                    &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="mt-8 flex flex-col gap-6 border-t border-primary-900/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        {t.avatar ? (
                            <Image
                                src={t.avatar.file}
                                alt={t.author_name}
                                width={56}
                                height={56}
                                className="h-14 w-14 rounded-full object-cover ring-2 ring-primary-900/10"
                            />
                        ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-900/5 text-lg font-bold text-primary-900 ring-2 ring-primary-900/10">
                                {t.author_name.charAt(0)}
                            </div>
                        )}

                        <div>
                            <p className="font-heading text-lg font-bold text-primary-900">
                                {t.author_name}
                            </p>
                            <p className="text-sm text-primary-900/60">
                                {metaLine}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-4 sm:items-end">
                        {t.company_name && (
                            <span className="rounded-full bg-accent-600/10 px-4 py-2 text-sm font-semibold text-accent-600">
                                {t.company_name}
                            </span>
                        )}

                        {t.rating != null && t.rating > 0 && (
                            <div
                                className="flex gap-1"
                                role="img"
                                aria-label={`${t.rating} out of 5 stars`}
                            >
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        size={18}
                                        className={i < t.rating! ? "fill-accent-600 text-accent-700" : "text-primary-900/15"}
                                    />
                                ))}
                            </div>
                        )}

                        {count > 1 && (
                            <div className="flex items-center gap-2">
                                {testimonials.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setCurrent(i)}
                                        aria-label={`Go to testimonial ${i + 1}`}
                                        className={`h-2.5 rounded-full transition-all ${i === current ? "w-8 bg-accent-600" : "w-2.5 bg-primary-900/15 hover:bg-primary-900/30"}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {count > 1 && (
                    <div className="mt-6 flex items-center gap-3 sm:hidden">
                        <button
                            type="button"
                            onClick={prev}
                            aria-label="Previous testimonial"
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-primary-900/10 text-primary-900/65 transition-colors hover:border-primary-900/30 hover:text-primary-900"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            aria-label="Next testimonial"
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-primary-900/10 text-primary-900/65 transition-colors hover:border-primary-900/30 hover:text-primary-900"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
