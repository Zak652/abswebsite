import { fetchAPIEndpointGroups } from "@/lib/api/cms-server";
import APIReferencePageClient from "./APIReferencePageClient";

export default async function ApiReferencePage() {
  const cmsGroups = await fetchAPIEndpointGroups();
  return <APIReferencePageClient cmsGroups={cmsGroups} />;
}
