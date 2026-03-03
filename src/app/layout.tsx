import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://absplatform.com"
  ),
  title: {
    default: "ABS — Digital Asset Management Showroom",
    template: "%s | ABS Platform",
  },
  description:
    "The enterprise digital product showroom for intelligent asset management, industrial hardware, and lifecycle services. See, compare, configure, and act — without contacting ABS.",
  keywords: [
    "asset management",
    "RFID",
    "barcode scanners",
    "industrial tags",
    "Arcplus",
    "enterprise",
  ],
  openGraph: {
    siteName: "ABS Platform",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <Header />
          <main className="pt-20 flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
