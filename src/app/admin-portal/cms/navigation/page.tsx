"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save, GripVertical } from "lucide-react";
import {
    useAdminNavigation,
    useCreateNavItem,
    useUpdateNavItem,
    useDeleteNavItem,
    useReorderNavigation,
} from "@/lib/hooks/useCMSAdmin";
import type { NavigationItemData } from "@/types/cms";

type NavFormData = {
    label: string;
    url: string;
    location: string;
    column: string;
    parent: number | null;
    is_active: boolean;
    order: number;
};

const EMPTY_NAV: NavFormData = {
    label: "",
    url: "",
    location: "header_main",
    column: "",
    parent: null,
    is_active: true,
    order: 0,
};

const LOCATIONS = [
    { value: "header_main", label: "Header — Main" },
    { value: "header_products", label: "Header — Products" },
    { value: "footer_company", label: "Footer — Company" },
    { value: "footer_resources", label: "Footer — Resources" },
    { value: "footer_legal", label: "Footer — Legal" },
];

function NavForm({
    initial,
    items,
    onSubmit,
    onCancel,
    isPending,
}: {
    initial?: Partial<NavFormData>;
    items: NavigationItemData[];
    onSubmit: (data: NavFormData) => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<NavFormData>({ ...EMPTY_NAV, ...initial });

    const set = (key: keyof NavFormData, value: string | number | boolean | null) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Label</label>
                    <input
                        value={form.label}
                        onChange={(e) => set("label", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">URL</label>
                    <input
                        value={form.url}
                        onChange={(e) => set("url", e.target.value)}
                        placeholder="/about, /services, https://..."
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Location</label>
                    <select
                        value={form.location}
                        onChange={(e) => set("location", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    >
                        {LOCATIONS.map((loc) => (
                            <option key={loc.value} value={loc.value}>
                                {loc.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Parent</label>
                    <select
                        value={form.parent ?? ""}
                        onChange={(e) => set("parent", e.target.value ? Number(e.target.value) : null)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    >
                        <option value="">None (root)</option>
                        {items.filter((i) => !i.parent).map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Order</label>
                    <input
                        type="number"
                        value={form.order}
                        onChange={(e) => set("order", parseInt(e.target.value) || 0)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Column</label>
                    <input
                        value={form.column}
                        onChange={(e) => set("column", e.target.value)}
                        placeholder="Optional grouping column"
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => set("is_active", e.target.checked)}
                            className="rounded border-neutral-300"
                        />
                        <span className="text-xs font-medium text-neutral-700">Active</span>
                    </label>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button
                    onClick={onCancel}
                    className="text-xs px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onSubmit(form)}
                    disabled={isPending || !form.label || !form.url}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50"
                >
                    <Save className="w-3.5 h-3.5" />
                    Save
                </button>
            </div>
        </div>
    );
}

export default function NavigationPage() {
    const [locationFilter, setLocationFilter] = useState<string | undefined>();
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const { data: items = [], isLoading } = useAdminNavigation();
    const createItem = useCreateNavItem();
    const updateItem = useUpdateNavItem();
    const deleteItem = useDeleteNavItem();
    const reorder = useReorderNavigation();

    const filtered = locationFilter
        ? items.filter((i) => i.location === locationFilter)
        : items;

    // Build tree: root items with children nested
    const rootItems = filtered.filter((i) => !i.parent);
    const childMap = new Map<number, NavigationItemData[]>();
    filtered.filter((i) => i.parent).forEach((i) => {
        const existing = childMap.get(i.parent!) ?? [];
        existing.push(i);
        childMap.set(i.parent!, existing);
    });

    const handleCreate = (data: NavFormData) => {
        createItem.mutate(data as unknown as Record<string, unknown>, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdate = (id: number, data: NavFormData) => {
        updateItem.mutate(
            { id, data: data as unknown as Record<string, unknown> },
            { onSuccess: () => setEditingId(null) }
        );
    };

    const handleMoveUp = (item: NavigationItemData, siblings: NavigationItemData[]) => {
        const idx = siblings.findIndex((s) => s.id === item.id);
        if (idx <= 0) return;
        const reordered = siblings.map((s, i) => ({
            id: s.id,
            order: i === idx - 1 ? idx : i === idx ? idx - 1 : i,
        }));
        reorder.mutate(reordered);
    };

    const handleMoveDown = (item: NavigationItemData, siblings: NavigationItemData[]) => {
        const idx = siblings.findIndex((s) => s.id === item.id);
        if (idx >= siblings.length - 1) return;
        const reordered = siblings.map((s, i) => ({
            id: s.id,
            order: i === idx + 1 ? idx : i === idx ? idx + 1 : i,
        }));
        reorder.mutate(reordered);
    };

    const renderItem = (item: NavigationItemData, siblings: NavigationItemData[], depth = 0) => {
        if (editingId === item.id) {
            return (
                <NavForm
                    key={item.id}
                    initial={{
                        label: item.label,
                        url: item.url,
                        location: item.location,
                        column: item.column,
                        parent: item.parent,
                        is_active: item.is_active,
                        order: item.order,
                    }}
                    items={items}
                    onSubmit={(data) => handleUpdate(item.id, data)}
                    onCancel={() => setEditingId(null)}
                    isPending={updateItem.isPending}
                />
            );
        }

        const children = childMap.get(item.id) ?? [];

        return (
            <div key={item.id}>
                <div
                    className={`flex items-center gap-3 bg-white rounded-lg border border-neutral-200 px-4 py-3 ${depth > 0 ? "ml-8" : ""
                        }`}
                >
                    <GripVertical className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleMoveUp(item, siblings)}
                            className="text-neutral-300 hover:text-neutral-600 text-xs"
                            title="Move up"
                        >
                            ▲
                        </button>
                        <button
                            onClick={() => handleMoveDown(item, siblings)}
                            className="text-neutral-300 hover:text-neutral-600 text-xs"
                            title="Move down"
                        >
                            ▼
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-primary-900">
                                {item.label}
                            </span>
                            <span className="text-xs text-neutral-400 font-mono">{item.url}</span>
                            {!item.is_active && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-400 rounded">
                                    inactive
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-neutral-400">
                            {LOCATIONS.find((l) => l.value === item.location)?.label ?? item.location}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={() => {
                                setEditingId(item.id);
                                setCreating(false);
                            }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 transition-colors"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirm === item.id ? (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => {
                                        deleteItem.mutate(item.id);
                                        setDeleteConfirm(null);
                                    }}
                                    className="text-[10px] px-2 py-1 rounded bg-red-500 text-white"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="p-1 rounded text-neutral-400 hover:text-neutral-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setDeleteConfirm(item.id)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
                {children.map((child) => renderItem(child, children, depth + 1))}
            </div>
        );
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">
                        Navigation
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {items.length} navigation item{items.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setCreating(true);
                        setEditingId(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Item
                </button>
            </div>

            {/* Location Filters */}
            <div className="flex gap-2 mb-5 flex-wrap">
                <button
                    onClick={() => setLocationFilter(undefined)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!locationFilter
                            ? "bg-primary-900 text-white border-primary-900"
                            : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                        }`}
                >
                    All
                </button>
                {LOCATIONS.map((loc) => (
                    <button
                        key={loc.value}
                        onClick={() => setLocationFilter(loc.value)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${locationFilter === loc.value
                                ? "bg-primary-900 text-white border-primary-900"
                                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                            }`}
                    >
                        {loc.label}
                    </button>
                ))}
            </div>

            {creating && (
                <div className="mb-5">
                    <NavForm
                        items={items}
                        onSubmit={handleCreate}
                        onCancel={() => setCreating(false)}
                        isPending={createItem.isPending}
                    />
                </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">
                    Loading…
                </div>
            )}

            {!isLoading && (
                <div className="space-y-2">
                    {rootItems.map((item) => renderItem(item, rootItems))}
                    {rootItems.length === 0 && (
                        <p className="text-center text-neutral-400 text-sm py-12">
                            No navigation items found.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
