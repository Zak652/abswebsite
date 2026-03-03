import type { Metadata } from "next";
import { ComparePageClient } from "./ComparePageClient";

export const metadata: Metadata = {
    title: "Compare Solutions | ABS Platform",
    description:
        "Compare ABS asset management solutions across software, hardware, and services to find the right fit for your organization.",
    openGraph: {
        title: "Compare Solutions | ABS Platform",
        description:
            "Compare ABS asset management solutions across software, hardware, and services to find the right fit for your organization.",
        url: "/compare",
    },
};

export default function ComparePage() {
    return <ComparePageClient />;
}
