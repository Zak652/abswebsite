import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { DraftModeBanner } from "@/components/layout/DraftModeBanner";
import { Providers } from "./providers";
import {
  fetchNavigation,
  fetchSiteSettings,
} from "@/lib/api/cms-server";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [headerNav, footerPlatform, footerResources, settings] = await Promise.all([
    fetchNavigation("header_main"),
    fetchNavigation("footer_platform"),
    fetchNavigation("footer_resources"),
    fetchSiteSettings(),
  ]);

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <DraftModeBanner />
          <Header cmsNavItems={headerNav} />
          <main className="pt-20 flex-1">{children}</main>
          <Footer
            platformLinks={footerPlatform}
            resourceLinks={footerResources}
            settings={settings}
          />
        </Providers>
      </body>
    </html>
  );
}
