"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import {
    useAdminHeroes,
    useCreateHero,
    useUpdateHero,
    useDeleteHero,
    useTransitionHero,
    useAdminBlocks,
    useCreateBlock,
    useUpdateBlock,
    useDeleteBlock,
    useTransitionBlock,
} from "@/lib/hooks/useCMSAdmin";
import { CMSStatusBadge } from "@/components/admin/CMSStatusBadge";
import { PublishingActions } from "@/components/admin/PublishingActions";
import type { AdminHeroSectionData, AdminPageBlockData, TransitionRequest } from "@/types/cms";

/* ------------------------------------------------------------------ */
/* Hero Form                                                          */
/* ------------------------------------------------------------------ */

type HeroFormData = {
    page: string;
    headline: string;
    subheadline: string;
    cta_primary_text: string;
    cta_primary_link: string;
    cta_secondary_text: string;
    cta_secondary_link: string;
    variant: string;
    eyebrow: string;
};

const EMPTY_HERO: HeroFormData = {
    page: "",
    headline: "",
    subheadline: "",
    cta_primary_text: "",
    cta_primary_link: "",
    cta_secondary_text: "",
    cta_secondary_link: "",
    variant: "overlay",
    eyebrow: "",
};

function HeroForm({
    initial,
    onSubmit,
    onCancel,
    isPending,
}: {
    initial?: Partial<HeroFormData>;
    onSubmit: (data: HeroFormData) => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<HeroFormData>({ ...EMPTY_HERO, ...initial });

    const set = (key: keyof HeroFormData, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Page Slug</label>
                    <input
                        value={form.page}
                        onChange={(e) => set("page", e.target.value)}
                        placeholder="home, arcplus, scanners…"
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Variant</label>
                    <select
                        value={form.variant}
                        onChange={(e) => set("variant", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    >
                        <option value="overlay">Overlay</option>
                        <option value="split">Split</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Eyebrow</label>
                <input
                    value={form.eyebrow}
                    onChange={(e) => set("eyebrow", e.target.value)}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Headline</label>
                <input
                    value={form.headline}
                    onChange={(e) => set("headline", e.target.value)}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Subheadline</label>
                <textarea
                    value={form.subheadline}
                    onChange={(e) => set("subheadline", e.target.value)}
                    rows={2}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Primary CTA Text</label>
                    <input
                        value={form.cta_primary_text}
                        onChange={(e) => set("cta_primary_text", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Primary CTA Link</label>
                    <input
                        value={form.cta_primary_link}
                        onChange={(e) => set("cta_primary_link", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Secondary CTA Text</label>
                    <input
                        value={form.cta_secondary_text}
                        onChange={(e) => set("cta_secondary_text", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Secondary CTA Link</label>
                    <input
                        value={form.cta_secondary_link}
                        onChange={(e) => set("cta_secondary_link", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
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
                    disabled={isPending || !form.page || !form.headline}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50"
                >
                    <Save className="w-3.5 h-3.5" />
                    Save
                </button>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Block Form                                                         */
/* ------------------------------------------------------------------ */

type BlockFormData = {
    page: string;
    block_type: string;
    title: string;
    body: string;
    icon: string;
    link_url: string;
    link_text: string;
    order: number;
};

const EMPTY_BLOCK: BlockFormData = {
    page: "",
    block_type: "text",
    title: "",
    body: "",
    icon: "",
    link_url: "",
    link_text: "",
    order: 0,
};

const BLOCK_TYPES = [
    "text",
    "hero",
    "feature_grid",
    "stats",
    "cta",
    "image_text",
    "card_grid",
    "timeline",
    "accordion",
    "testimonial",
];

function BlockForm({
    initial,
    onSubmit,
    onCancel,
    isPending,
}: {
    initial?: Partial<BlockFormData>;
    onSubmit: (data: BlockFormData) => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<BlockFormData>({ ...EMPTY_BLOCK, ...initial });

    const set = (key: keyof BlockFormData, value: string | number) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Page Slug</label>
                    <input
                        value={form.page}
                        onChange={(e) => set("page", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Block Type</label>
                    <select
                        value={form.block_type}
                        onChange={(e) => set("block_type", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    >
                        {BLOCK_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t.replace(/_/g, " ")}
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
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                <input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Body</label>
                <textarea
                    value={form.body}
                    onChange={(e) => set("body", e.target.value)}
                    rows={4}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Icon</label>
                    <input
                        value={form.icon}
                        onChange={(e) => set("icon", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Link Text</label>
                    <input
                        value={form.link_text}
                        onChange={(e) => set("link_text", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Link URL</label>
                    <input
                        value={form.link_url}
                        onChange={(e) => set("link_url", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
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
                    disabled={isPending || !form.page || !form.title}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50"
                >
                    <Save className="w-3.5 h-3.5" />
                    Save
                </button>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function ContentPage() {
    const [tab, setTab] = useState<"heroes" | "blocks">("heroes");
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    // Heroes
    const { data: heroes = [], isLoading: heroesLoading } = useAdminHeroes();
    const createHero = useCreateHero();
    const updateHero = useUpdateHero();
    const deleteHero = useDeleteHero();
    const transitionHero = useTransitionHero();

    // Blocks
    const { data: blocks = [], isLoading: blocksLoading } = useAdminBlocks();
    const createBlock = useCreateBlock();
    const updateBlock = useUpdateBlock();
    const deleteBlock = useDeleteBlock();
    const transitionBlock = useTransitionBlock();

    const handleCreateHero = (data: HeroFormData) => {
        createHero.mutate(data as Record<string, unknown>, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdateHero = (id: number, data: HeroFormData) => {
        const hero = heroes.find((h) => h.id === id);
        updateHero.mutate(
            { id, data: { ...data, version: hero?.version } as Record<string, unknown> },
            { onSuccess: () => setEditingId(null) }
        );
    };

    const handleCreateBlock = (data: BlockFormData) => {
        createBlock.mutate(data as unknown as Record<string, unknown>, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdateBlock = (id: number, data: BlockFormData) => {
        const block = blocks.find((b) => b.id === id);
        updateBlock.mutate(
            { id, data: { ...data, version: block?.version } as Record<string, unknown> },
            { onSuccess: () => setEditingId(null) }
        );
    };

    const handleTransitionHero = (id: number, data: TransitionRequest) => {
        transitionHero.mutate({ id, data });
    };

    const handleTransitionBlock = (id: number, data: TransitionRequest) => {
        transitionBlock.mutate({ id, data });
    };

    const isLoading = tab === "heroes" ? heroesLoading : blocksLoading;

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">
                        Pages & Content
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        Manage hero sections and page content blocks
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
                    New {tab === "heroes" ? "Hero" : "Block"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
                {(["heroes", "blocks"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => {
                            setTab(t);
                            setCreating(false);
                            setEditingId(null);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${tab === t
                                ? "bg-primary-900 text-white border-primary-900"
                                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                            }`}
                    >
                        {t === "heroes" ? `Heroes (${heroes.length})` : `Blocks (${blocks.length})`}
                    </button>
                ))}
            </div>

            {/* Create Form */}
            {creating && tab === "heroes" && (
                <div className="mb-5">
                    <HeroForm
                        onSubmit={handleCreateHero}
                        onCancel={() => setCreating(false)}
                        isPending={createHero.isPending}
                    />
                </div>
            )}
            {creating && tab === "blocks" && (
                <div className="mb-5">
                    <BlockForm
                        onSubmit={handleCreateBlock}
                        onCancel={() => setCreating(false)}
                        isPending={createBlock.isPending}
                    />
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">
                    Loading…
                </div>
            )}

            {/* Heroes List */}
            {tab === "heroes" && !isLoading && (
                <div className="space-y-3">
                    {heroes.map((hero: AdminHeroSectionData) =>
                        editingId === hero.id ? (
                            <HeroForm
                                key={hero.id}
                                initial={{
                                    page: hero.page,
                                    headline: hero.headline,
                                    subheadline: hero.subheadline,
                                    cta_primary_text: hero.cta_primary_text,
                                    cta_primary_link: hero.cta_primary_link,
                                    cta_secondary_text: hero.cta_secondary_text,
                                    cta_secondary_link: hero.cta_secondary_link,
                                    variant: hero.variant,
                                    eyebrow: hero.eyebrow,
                                }}
                                onSubmit={(data) => handleUpdateHero(hero.id, data)}
                                onCancel={() => setEditingId(null)}
                                isPending={updateHero.isPending}
                            />
                        ) : (
                            <div
                                key={hero.id}
                                className="bg-white rounded-xl border border-neutral-200 p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded">
                                                {hero.page}
                                            </span>
                                            <CMSStatusBadge status={hero.status} />
                                        </div>
                                        <h3 className="font-semibold text-primary-900 text-sm truncate">
                                            {hero.headline}
                                        </h3>
                                        <p className="text-xs text-neutral-500 mt-0.5 truncate">
                                            {hero.subheadline}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            onClick={() => {
                                                setEditingId(hero.id);
                                                setCreating(false);
                                            }}
                                            className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 transition-colors"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        {deleteConfirm === hero.id ? (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        deleteHero.mutate(hero.id);
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
                                                onClick={() => setDeleteConfirm(hero.id)}
                                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-neutral-100">
                                    <PublishingActions
                                        status={hero.status}
                                        version={hero.version}
                                        onTransition={(data) => handleTransitionHero(hero.id, data)}
                                        isPending={transitionHero.isPending}
                                    />
                                </div>
                            </div>
                        )
                    )}
                    {heroes.length === 0 && (
                        <p className="text-center text-neutral-400 text-sm py-12">
                            No hero sections yet. Create one to get started.
                        </p>
                    )}
                </div>
            )}

            {/* Blocks List */}
            {tab === "blocks" && !isLoading && (
                <div className="space-y-3">
                    {blocks.map((block: AdminPageBlockData) =>
                        editingId === block.id ? (
                            <BlockForm
                                key={block.id}
                                initial={{
                                    page: block.page,
                                    block_type: block.block_type,
                                    title: block.title,
                                    body: block.body,
                                    icon: block.icon,
                                    link_url: block.link_url,
                                    link_text: block.link_text,
                                    order: block.order,
                                }}
                                onSubmit={(data) => handleUpdateBlock(block.id, data)}
                                onCancel={() => setEditingId(null)}
                                isPending={updateBlock.isPending}
                            />
                        ) : (
                            <div
                                key={block.id}
                                className="bg-white rounded-xl border border-neutral-200 p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded">
                                                {block.page}
                                            </span>
                                            <span className="text-xs text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded">
                                                {block.block_type.replace(/_/g, " ")}
                                            </span>
                                            <CMSStatusBadge status={block.status} />
                                            <span className="text-xs text-neutral-400">#{block.order}</span>
                                        </div>
                                        <h3 className="font-semibold text-primary-900 text-sm truncate">
                                            {block.title}
                                        </h3>
                                        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                                            {block.body}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            onClick={() => {
                                                setEditingId(block.id);
                                                setCreating(false);
                                            }}
                                            className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 transition-colors"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        {deleteConfirm === block.id ? (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        deleteBlock.mutate(block.id);
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
                                                onClick={() => setDeleteConfirm(block.id)}
                                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-neutral-100">
                                    <PublishingActions
                                        status={block.status}
                                        version={block.version}
                                        onTransition={(data) => handleTransitionBlock(block.id, data)}
                                        isPending={transitionBlock.isPending}
                                    />
                                </div>
                            </div>
                        )
                    )}
                    {blocks.length === 0 && (
                        <p className="text-center text-neutral-400 text-sm py-12">
                            No page blocks yet. Create one to get started.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
