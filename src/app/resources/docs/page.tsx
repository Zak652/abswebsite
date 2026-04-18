import { fetchDocumentationPages } from "@/lib/api/cms-server";
import DocsPageClient from "./DocsPageClient";

export default async function DocsPage() {
  const cmsPages = await fetchDocumentationPages();
  return <DocsPageClient cmsPages={cmsPages} />;
}
