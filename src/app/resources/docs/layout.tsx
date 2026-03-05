import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | ABS Platform",
  description:
    "Comprehensive documentation for the ABS Platform. Getting started guides, system architecture, deployment, and configuration.",
  openGraph: {
    title: "Documentation | ABS Platform",
    description:
      "Guides, architecture docs, and deployment instructions for the ABS Platform.",
    url: "/resources/docs",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
