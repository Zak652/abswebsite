import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
    cleanup();
});

// Mock next/link as a plain anchor
vi.mock("next/link", () => ({
    __esModule: true,
    default: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

// Mock next/image as a plain img
vi.mock("next/image", () => ({
    __esModule: true,
    default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} {...props} />
    ),
}));

// Mock framer-motion to render without animation
vi.mock("framer-motion", async () => {
    const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
    return {
        ...actual,
        motion: new Proxy(actual.motion, {
            get: (_target, prop: string) => {
                // Return a forwardRef component that renders the HTML element directly
                return ({ children, initial, animate, exit, variants, transition, whileHover, whileTap, whileInView, viewport, layout, layoutId, ...rest }: Record<string, unknown>) => {
                    const Tag = prop as keyof JSX.IntrinsicElements;
                    return <Tag {...rest}>{children as React.ReactNode}</Tag>;
                };
            },
        }),
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        useReducedMotion: () => true,
    };
});
