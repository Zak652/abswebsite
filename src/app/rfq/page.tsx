import type { Metadata } from "next";
import { RFQPageClient } from "./RFQPageClient";

export const metadata: Metadata = {
    title: "Request a Quote | ABS Platform",
    description:
        "Get a tailored proposal for Arcplus software, hardware, and field services. Our solution architects respond within 2 hours.",
    openGraph: {
        title: "Request a Quote | ABS Platform",
        description:
            "Get a tailored proposal for Arcplus asset management solutions.",
        url: "/rfq",
    },
};

export default function RFQPage() {
    return <RFQPageClient />;
}
