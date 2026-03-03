"use client";

import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { useRehydrateAuth } from "@/lib/hooks/useAuth";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRehydrateAuth();

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <PortalSidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8">{children}</main>
    </div>
  );
}
