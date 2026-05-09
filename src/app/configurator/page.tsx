import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Heavy interactive client — lazy-load it so the chunk only ships
// to users who actually visit /configurator (§ 3.3).
const ConfiguratorPageClient = dynamic(
    () =>
        import("./ConfiguratorPageClient").then((m) => m.ConfiguratorPageClient),
    {
        loading: () => (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="text-sm text-neutral-500">Loading configurator…</div>
            </div>
        ),
    },
);

export const metadata: Metadata = {
    title: "Solution Configurator | ABS Platform",
    description:
        "Configure your custom ABS asset management solution with our interactive builder.",
    alternates: { canonical: "/configurator" },
    openGraph: {
        title: "Solution Configurator | ABS Platform",
        description:
            "Configure your custom ABS asset management solution with our interactive builder.",
        url: "/configurator",
    },
};

export default function ConfiguratorPage() {
    return <ConfiguratorPageClient />;
}
