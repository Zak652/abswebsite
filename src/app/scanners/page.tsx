import type { Metadata } from "next";
import { ScannersPageClient } from "./ScannersPageClient";

export const metadata: Metadata = {
    title: "RFID Scanners & Readers | ABS Platform",
    description:
        "Industrial-grade RFID scanners, handheld readers, and fixed infrastructure for enterprise asset tracking.",
    openGraph: {
        title: "RFID Scanners & Readers | ABS Platform",
        description:
            "Industrial-grade RFID scanners, handheld readers, and fixed infrastructure for enterprise asset tracking.",
        url: "/scanners",
    },
};

export default function ScannersPage() {
    return <ScannersPageClient />;
}
