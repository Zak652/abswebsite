import type { Metadata } from "next";
import { ServicesPageClient } from "./ServicesPageClient";

export const metadata: Metadata = {
    title: "Field Services | ABS Platform",
    description:
        "Expert physical tagging, asset register building, and RFID deployment by ABS-certified field engineers.",
    openGraph: {
        title: "Field Services | ABS Platform",
        description:
            "Expert physical tagging, asset register building, and RFID deployment by ABS-certified field engineers.",
        url: "/services",
    },
};

export default function ServicesPage() {
    return <ServicesPageClient />;
}
