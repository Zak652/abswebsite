import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference | ABS Platform",
  description:
    "Complete API reference for the ABS Platform. Authentication, endpoints, request/response formats, and code examples for integration.",
  openGraph: {
    title: "API Reference | ABS Platform",
    description:
      "Complete API reference for the ABS Platform. Authentication, endpoints, and code examples.",
    url: "/resources/api-reference",
  },
};

export default function ApiReferenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
