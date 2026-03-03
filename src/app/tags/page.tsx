import type { Metadata } from "next";
import { TagsPageClient } from "./TagsPageClient";

export const metadata: Metadata = {
    title: "RFID & Barcode Tags | ABS Platform",
    description:
        "High-durability RFID and barcode tags engineered for harsh industrial environments.",
    openGraph: {
        title: "RFID & Barcode Tags | ABS Platform",
        description:
            "High-durability RFID and barcode tags engineered for harsh industrial environments.",
        url: "/tags",
    },
};

export default function TagsPage() {
    return <TagsPageClient />;
}
