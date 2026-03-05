import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support | ABS Platform",
  description:
    "Get help with the ABS Platform. Support tiers, response times, and direct contact options for technical assistance.",
  openGraph: {
    title: "Support | ABS Platform",
    description:
      "Support tiers, response times, and contact options for ABS Platform users.",
    url: "/resources/support",
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
