"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useRehydrateAuth } from "@/lib/hooks/useAuth";

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRehydrateAuth();

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8">{children}</main>
    </div>
  );
}
