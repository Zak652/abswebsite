"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { useAdminUsers, useUpdateUser } from "@/lib/hooks/useAdmin";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Column } from "@/components/admin/DataTable";
import type { AdminUser } from "@/lib/api/admin";

const ROLES = ["admin", "staff", "customer"] as const;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function UserExpandPanel({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const updateUser = useUpdateUser();

  return (
    <tr>
      <td colSpan={6} className="bg-neutral-50 px-6 py-5 border-b border-neutral-100">
        <div className="max-w-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-primary-900">{user.full_name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{user.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5 text-xs">
            <div>
              <p className="text-neutral-400 uppercase tracking-widest mb-1">Joined</p>
              <p className="text-primary-900 font-medium">
                {new Date(user.date_joined).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-neutral-400 uppercase tracking-widest mb-1">Last Login</p>
              <p className="text-primary-900 font-medium">
                {user.last_login
                  ? new Date(user.last_login).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                  : "Never"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Role change */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Role:</span>
              <select
                defaultValue={user.role}
                onChange={(e) =>
                  updateUser.mutate({ id: user.id, data: { role: e.target.value } })
                }
                disabled={updateUser.isPending}
                className="text-xs border border-neutral-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-primary-500 disabled:opacity-50"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Deactivate / Reactivate */}
            <button
              onClick={() =>
                updateUser.mutate({ id: user.id, data: { is_active: !user.is_active } })
              }
              disabled={updateUser.isPending}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${user.is_active
                  ? "border-red-200 text-red-600 hover:bg-red-50"
                  : "border-green-200 text-green-700 hover:bg-green-50"
                }`}
            >
              {user.is_active ? "Deactivate Account" : "Reactivate Account"}
            </button>

            {/* Email shortcut */}
            <a
              href={`mailto:${user.email}`}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:border-neutral-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Email User
            </a>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const search = useDebounce(searchInput, 300);
  const { data: users, isLoading } = useAdminUsers({ search, role: roleFilter });

  const columns: Column<AdminUser>[] = [
    {
      key: "full_name",
      header: "Name",
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-primary-900">{row.full_name || "—"}</p>
          <p className="text-xs text-neutral-400">{row.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700 capitalize">
          {row.role}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.is_active ? "active" : "inactive"} />
      ),
    },
    {
      key: "date_joined",
      header: "Joined",
      render: (row) => (
        <span className="text-xs text-neutral-400">
          {new Date(row.date_joined).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "last_login",
      header: "Last Login",
      render: (row) => (
        <span className="text-xs text-neutral-400">
          {row.last_login
            ? new Date(row.last_login).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            : "Never"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-primary-900 transition-colors"
          aria-label={expandedId === row.id ? "Collapse row" : "Expand row"}
        >
          {expandedId === row.id ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      ),
    },
  ];

  // We render the expand panel by injecting it after the matched row.
  // DataTable doesn't support this natively — render a custom table here.
  const rows = users ?? [];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 font-heading">Users</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {rows.length} user{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg bg-white w-64 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {([undefined, ...ROLES] as (string | undefined)[]).map((r) => (
            <button
              key={r ?? "all"}
              onClick={() => setRoleFilter(r)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${roleFilter === r
                  ? "bg-primary-900 text-white border-primary-900"
                  : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                }`}
            >
              {r ? r.charAt(0).toUpperCase() + r.slice(1) : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Custom table with expand support */}
      {isLoading ? (
        <div className="rounded-2xl border border-neutral-100 overflow-hidden animate-pulse bg-neutral-50 h-48" />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-neutral-100 p-8 text-center">
          <p className="text-sm text-neutral-400">No users found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-100 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((user) => (
                <>
                  <tr
                    key={user.id}
                    className={`hover:bg-neutral-50 transition-colors ${expandedId === user.id ? "bg-neutral-50" : ""
                      }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-primary-900">
                          {user.full_name || "—"}
                        </p>
                        <p className="text-xs text-neutral-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700 capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.is_active ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-400">
                        {new Date(user.date_joined).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-400">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "Never"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                        className="flex items-center gap-1 text-xs text-neutral-400 hover:text-primary-900 transition-colors"
                        aria-label={expandedId === user.id ? "Collapse row" : "Expand row"}
                      >
                        {expandedId === user.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedId === user.id && (
                    <UserExpandPanel
                      key={`expand-${user.id}`}
                      user={user}
                      onClose={() => setExpandedId(null)}
                    />
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
