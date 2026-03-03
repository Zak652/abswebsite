import type { Metadata } from "next";
import { ConfiguratorPageClient } from "./ConfiguratorPageClient";

export const metadata: Metadata = {
    title: "Solution Configurator | ABS Platform",
    description:
        "Configure your custom ABS asset management solution with our interactive builder.",
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
