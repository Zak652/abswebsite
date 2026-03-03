import type { Metadata } from "next";
import { HomePageClient } from "./HomePageClient";

export const metadata: Metadata = {
  title: "ABS Platform | Intelligent Asset Management Solutions",
  description:
    "ABS delivers enterprise asset management infrastructure — Arcplus software, RFID hardware, and field services — for organizations that can't afford uncertainty.",
  openGraph: {
    title: "ABS Platform | Intelligent Asset Management Solutions",
    description:
      "ABS delivers enterprise asset management infrastructure — Arcplus software, RFID hardware, and field services — for organizations that can't afford uncertainty.",
    url: "/",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
