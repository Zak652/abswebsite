import type { Metadata } from "next";
import { ArcplusPageClient } from "./ArcplusPageClient";

export const metadata: Metadata = {
    title: "Arcplus Asset Management Platform | ABS",
    description:
        "Enterprise asset lifecycle management — register, operate, maintain, depreciate, and dispose of assets in one unified platform. Start your free trial today.",
    openGraph: {
        title: "Arcplus Asset Management Platform",
        description:
            "Eight powerful modules for complete asset lifecycle management. Trusted by enterprises across Africa.",
        url: "/arcplus",
    },
};

export default function ArcplusPage() {
    return <ArcplusPageClient />;
}
