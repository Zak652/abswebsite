"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Layers, GraduationCap, ExternalLink, LogOut } from "lucide-react";
import { useLogout } from "@/lib/hooks/useAuth";

const navItems = [
  { href: "/admin-portal", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin-portal/quotes", label: "Quote Requests", icon: FileText, exact: false },
  { href: "/admin-portal/subscriptions", label: "Trial Signups", icon: Layers, exact: false },
  { href: "/admin-portal/training", label: "Training", icon: GraduationCap, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { mutate: logout, isPending } = useLogout();

  return (
    <aside className="w-64 min-h-screen bg-primary-900 flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/" className="text-xl font-bold text-white font-heading">
          ABS
        </Link>
        <p className="text-xs text-accent-500 mt-0.5 font-medium">Admin Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* Django Admin External Link */}
        <div className="mt-2 pt-2 border-t border-white/10">
          <a
            href="/django-admin/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
              text-white/40 hover:bg-white/10 hover:text-white/60
              transition-colors duration-150"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            Django Admin
          </a>
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => logout()}
          disabled={isPending}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-sm text-white/60 hover:bg-white/10 hover:text-white
            transition-colors duration-150 disabled:opacity-50"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {isPending ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </aside>
  );
}
