"use client";

import Image from "next/image";

export interface Logo {
    name: string;
    url: string;
}

interface LogoCarouselProps {
    logos: Logo[];
}

export default function LogoCarousel({ logos }: LogoCarouselProps) {
    if (logos.length === 0) return null;

    // Duplicate the list so the second copy creates a seamless loop
    const doubled = [...logos, ...logos];

    return (
        <div className="relative overflow-hidden" role="marquee" aria-label="Client logos">
            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-neutral-100 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-neutral-100 to-transparent z-10" />

            <div className="animate-marquee flex items-center gap-16 w-max py-4">
                {doubled.map((logo, idx) => (
                    <div
                        key={`${logo.name}-${idx}`}
                        className="flex-shrink-0 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                    >
                        <Image
                            src={logo.url}
                            alt={logo.name}
                            width={160}
                            height={48}
                            className="h-10 md:h-12 w-auto object-contain"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
