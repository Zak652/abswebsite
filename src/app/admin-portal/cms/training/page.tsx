"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { CMSStatusBadge } from "@/components/admin/CMSStatusBadge";
import { PublishingActions } from "@/components/admin/PublishingActions";
import type { AdminHeroSectionData, AdminPageBlockData, TransitionRequest, TrainingPageSettingsData } from "@/types/cms";
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
    useAdminTrainingSettings,
    useUpdateTrainingSettings,
} from "@/lib/hooks/useCMSAdmin";

const PAGE = "training";

/* ------------------------------------------------------------------ */
/* Hero Form                                                          */
/* ------------------------------------------------------------------ */

type HeroFormData = {
    headline: string;
    subheadline: string;
    eyebrow: string;
    variant: string;
    cta_primary_text: string;
    cta_primary_link: string;
    cta_secondary_text: string;
    cta_secondary_link: string;
};

const EMPTY_HERO: HeroFormData = {
    headline: "",
    subheadline: "",
    eyebrow: "",
    variant: "overlay",
    cta_primary_text: "",
    cta_primary_link: "",
    cta_secondary_text: "",
    cta_secondary_link: "",
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
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Eyebrow</label>
                    <input
                        value={form.eyebrow}
                        onChange={(e) => set("eyebrow", e.target.value)}
                        placeholder="e.g. ABS Training Academy"
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Variant</label>
                    <select
                        title="Variant"
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
                <label className="block text-xs font-medium text-neutral-700 mb-1">Headline</label>
                <input
                    value={form.headline}
                    onChange={(e) => set("headline", e.target.value)}
                    placeholder="Training Academy"
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Subheadline</label>
                <textarea
                    value={form.subheadline}
                    onChange={(e) => set("subheadline", e.target.value)}
                    rows={2}
                    placeholder="Empower your team. Become certified…"
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Primary CTA Text</label>
                    <input
                        title="Primary CTA Text"
                        placeholder="e.g. Browse courses"
                        value={form.cta_primary_text}
                        onChange={(e) => set("cta_primary_text", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Primary CTA Link</label>
                    <input
                        title="Primary CTA Link"
                        placeholder="/training/courses"
                        value={form.cta_primary_link}
                        onChange={(e) => set("cta_primary_link", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Secondary CTA Text</label>
                    <input
                        title="Secondary CTA Text"
                        placeholder="e.g. Talk to sales"
                        value={form.cta_secondary_text}
                        onChange={(e) => set("cta_secondary_text", e.target.value)}
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Secondary CTA Link</label>
                    <input
                        title="Secondary CTA Link"
                        placeholder="/contact"
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
                    disabled={isPending || !form.headline}
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
/* Sidebar (CTA Banner) Form                                          */
/* ------------------------------------------------------------------ */

type SidebarFormData = {
    title: string;
    body: string;
    link_text: string;
    link_url: string;
};

const EMPTY_SIDEBAR: SidebarFormData = {
    title: "",
    body: "",
    link_text: "",
    link_url: "",
};

function SidebarForm({
    initial,
    onSubmit,
    onCancel,
    isPending,
}: {
    initial?: Partial<SidebarFormData>;
    onSubmit: (data: SidebarFormData) => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<SidebarFormData>({ ...EMPTY_SIDEBAR, ...initial });
    const set = (key: keyof SidebarFormData, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                <input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Need private team training?"
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Body</label>
                <textarea
                    value={form.body}
                    onChange={(e) => set("body", e.target.value)}
                    rows={3}
                    placeholder="We can deliver custom curriculum…"
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Button Text</label>
                    <input
                        value={form.link_text}
                        onChange={(e) => set("link_text", e.target.value)}
                        placeholder="Request Custom Quote"
                        className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Button URL</label>
                    <input
                        value={form.link_url}
                        onChange={(e) => set("link_url", e.target.value)}
                        placeholder="/rfq"
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
                    disabled={isPending || !form.title}
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

export default function TrainingCMSPage() {
    // Hero state
    const [heroCreating, setHeroCreating] = useState(false);
    const [heroEditingId, setHeroEditingId] = useState<number | null>(null);
    const [heroDeleteConfirm, setHeroDeleteConfirm] = useState<number | null>(null);

    // Sidebar state
    const [sidebarCreating, setSidebarCreating] = useState(false);
    const [sidebarEditingId, setSidebarEditingId] = useState<number | null>(null);
    const [sidebarDeleteConfirm, setSidebarDeleteConfirm] = useState<number | null>(null);

    // Queries — filter to this page only
    const { data: allHeroes = [], isLoading: heroesLoading } = useAdminHeroes();
    const heroes = allHeroes.filter((h: AdminHeroSectionData) => h.page === PAGE);

    const { data: allBlocks = [], isLoading: blocksLoading } = useAdminBlocks();
    const sidebarBlocks = allBlocks.filter(
        (b: AdminPageBlockData) => b.page === PAGE && b.block_type === "cta_banner"
    );

    // Mutations — hero
    const createHero = useCreateHero();
    const updateHero = useUpdateHero();
    const deleteHero = useDeleteHero();
    const transitionHero = useTransitionHero();

    // Mutations — sidebar block
    const createBlock = useCreateBlock();
    const updateBlock = useUpdateBlock();
    const deleteBlock = useDeleteBlock();
    const transitionBlock = useTransitionBlock();

    const handleCreateHero = (data: HeroFormData) => {
        createHero.mutate({ ...data, page: PAGE } as Record<string, unknown>, {
            onSuccess: () => setHeroCreating(false),
        });
    };

    const handleUpdateHero = (id: number, data: HeroFormData) => {
        const hero = heroes.find((h) => h.id === id);
        updateHero.mutate(
            { id, data: { ...data, page: PAGE, version: hero?.version } as Record<string, unknown> },
            { onSuccess: () => setHeroEditingId(null) }
        );
    };

    const handleTransitionHero = (id: number, data: TransitionRequest) => {
        transitionHero.mutate({ id, data });
    };

    const handleCreateSidebar = (data: SidebarFormData) => {
        createBlock.mutate(
            { ...data, page: PAGE, block_type: "cta_banner", order: 0 } as Record<string, unknown>,
            { onSuccess: () => setSidebarCreating(false) }
        );
    };

    const handleUpdateSidebar = (id: number, data: SidebarFormData) => {
        const block = sidebarBlocks.find((b) => b.id === id);
        updateBlock.mutate(
            {
                id,
                data: {
                    ...data,
                    page: PAGE,
                    block_type: "cta_banner",
                    order: block?.order ?? 0,
                    version: block?.version,
                } as Record<string, unknown>,
            },
            { onSuccess: () => setSidebarEditingId(null) }
        );
    };

    const handleTransitionSidebar = (id: number, data: TransitionRequest) => {
        transitionBlock.mutate({ id, data });
    };

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-2xl font-bold text-primary-900 font-heading">Training</h1>
                <p className="text-sm text-neutral-500 mt-1">
                    Manage content sections for the <span className="font-mono">/training</span> page
                </p>
            </div>

            {/* ── Hero Section ─────────────────────────────────────────────── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-primary-900">Hero Section</h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Headline, subheadline, background image, and optional CTAs
                        </p>
                    </div>
                    {heroes.length === 0 && !heroCreating && (
                        <button
                            onClick={() => setHeroCreating(true)}
                            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Hero
                        </button>
                    )}
                </div>

                {heroCreating && (
                    <div className="mb-4">
                        <HeroForm
                            onSubmit={handleCreateHero}
                            onCancel={() => setHeroCreating(false)}
                            isPending={createHero.isPending}
                        />
                    </div>
                )}

                {heroesLoading ? (
                    <div className="flex items-center justify-center h-24 text-neutral-400 text-sm">Loading…</div>
                ) : heroes.length === 0 && !heroCreating ? (
                    <div className="bg-neutral-50 rounded-xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-400">
                        No hero section yet. The page will show the default content until one is created and published.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {heroes.map((hero: AdminHeroSectionData) =>
                            heroEditingId === hero.id ? (
                                <HeroForm
                                    key={hero.id}
                                    initial={{
                                        headline: hero.headline,
                                        subheadline: hero.subheadline,
                                        eyebrow: hero.eyebrow,
                                        variant: hero.variant,
                                        cta_primary_text: hero.cta_primary_text,
                                        cta_primary_link: hero.cta_primary_link,
                                        cta_secondary_text: hero.cta_secondary_text,
                                        cta_secondary_link: hero.cta_secondary_link,
                                    }}
                                    onSubmit={(data) => handleUpdateHero(hero.id, data)}
                                    onCancel={() => setHeroEditingId(null)}
                                    isPending={updateHero.isPending}
                                />
                            ) : (
                                <div key={hero.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CMSStatusBadge status={hero.status} />
                                                {hero.eyebrow && (
                                                    <span className="text-xs text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded">
                                                        {hero.eyebrow}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-primary-900 text-sm">{hero.headline}</h3>
                                            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{hero.subheadline}</p>
                                            {hero.cta_primary_text && (
                                                <p className="text-xs text-neutral-400 mt-1">
                                                    CTA: {hero.cta_primary_text} → {hero.cta_primary_link}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                title="Edit hero"
                                                aria-label="Edit hero"
                                                onClick={() => {
                                                    setHeroEditingId(hero.id);
                                                    setHeroCreating(false);
                                                }}
                                                className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            {heroDeleteConfirm === hero.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            deleteHero.mutate(hero.id);
                                                            setHeroDeleteConfirm(null);
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded bg-red-500 text-white"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        title="Cancel delete"
                                                        aria-label="Cancel delete"
                                                        onClick={() => setHeroDeleteConfirm(null)}
                                                        className="p-1 rounded text-neutral-400 hover:text-neutral-600"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    title="Delete hero"
                                                    aria-label="Delete hero"
                                                    onClick={() => setHeroDeleteConfirm(hero.id)}
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
                    </div>
                )}
            </section>

            {/* ── Private Training Sidebar ──────────────────────────────────── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-primary-900">Private Training Sidebar</h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            The call-to-action panel alongside the sessions list
                        </p>
                    </div>
                    {sidebarBlocks.length === 0 && !sidebarCreating && (
                        <button
                            onClick={() => setSidebarCreating(true)}
                            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Sidebar
                        </button>
                    )}
                </div>

                {sidebarCreating && (
                    <div className="mb-4">
                        <SidebarForm
                            onSubmit={handleCreateSidebar}
                            onCancel={() => setSidebarCreating(false)}
                            isPending={createBlock.isPending}
                        />
                    </div>
                )}

                {blocksLoading ? (
                    <div className="flex items-center justify-center h-24 text-neutral-400 text-sm">Loading…</div>
                ) : sidebarBlocks.length === 0 && !sidebarCreating ? (
                    <div className="bg-neutral-50 rounded-xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-400">
                        No sidebar block yet. The page will show the default content until one is created and published.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sidebarBlocks.map((block: AdminPageBlockData) =>
                            sidebarEditingId === block.id ? (
                                <SidebarForm
                                    key={block.id}
                                    initial={{
                                        title: block.title,
                                        body: block.body,
                                        link_text: block.link_text,
                                        link_url: block.link_url,
                                    }}
                                    onSubmit={(data) => handleUpdateSidebar(block.id, data)}
                                    onCancel={() => setSidebarEditingId(null)}
                                    isPending={updateBlock.isPending}
                                />
                            ) : (
                                <div key={block.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CMSStatusBadge status={block.status} />
                                            </div>
                                            <h3 className="font-semibold text-primary-900 text-sm">{block.title}</h3>
                                            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{block.body}</p>
                                            {block.link_text && (
                                                <p className="text-xs text-neutral-400 mt-1">
                                                    Button: {block.link_text} → {block.link_url}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                title="Edit sidebar"
                                                aria-label="Edit sidebar"
                                                onClick={() => {
                                                    setSidebarEditingId(block.id);
                                                    setSidebarCreating(false);
                                                }}
                                                className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            {sidebarDeleteConfirm === block.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            deleteBlock.mutate(block.id);
                                                            setSidebarDeleteConfirm(null);
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded bg-red-500 text-white"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        title="Cancel delete"
                                                        aria-label="Cancel delete"
                                                        onClick={() => setSidebarDeleteConfirm(null)}
                                                        className="p-1 rounded text-neutral-400 hover:text-neutral-600"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    title="Delete sidebar"
                                                    aria-label="Delete sidebar"
                                                    onClick={() => setSidebarDeleteConfirm(block.id)}
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
                                            onTransition={(data) => handleTransitionSidebar(block.id, data)}
                                            isPending={transitionBlock.isPending}
                                        />
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </section>

            {/* ── Sessions Page Labels ────────────────────────────────────── */}
            <TrainingSettingsSection />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Training Page Settings (singleton labels)                          */
/* ------------------------------------------------------------------ */

function TrainingSettingsSection() {
    const { data, isLoading } = useAdminTrainingSettings();
    const update = useUpdateTrainingSettings();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<Partial<TrainingPageSettingsData>>({});

    const startEditing = () => {
        setForm({
            sessions_heading: data?.sessions_heading ?? "",
            no_sessions_message: data?.no_sessions_message ?? "",
            low_seats_template: data?.low_seats_template ?? "",
            register_button_label: data?.register_button_label ?? "",
            full_button_label: data?.full_button_label ?? "",
        });
        setEditing(true);
    };

    const handleSave = () => {
        update.mutate(form, { onSuccess: () => setEditing(false) });
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-semibold text-primary-900">Sessions Section Labels</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                        Heading, empty state, and per-session button copy
                    </p>
                </div>
                {!editing && !isLoading && (
                    <button
                        onClick={startEditing}
                        className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-24 text-neutral-400 text-sm">Loading…</div>
            ) : editing ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                    <Field
                        label="Sessions heading"
                        value={form.sessions_heading ?? ""}
                        onChange={(v) => setForm({ ...form, sessions_heading: v })}
                    />
                    <Field
                        label="No-sessions message"
                        value={form.no_sessions_message ?? ""}
                        onChange={(v) => setForm({ ...form, no_sessions_message: v })}
                        textarea
                    />
                    <Field
                        label="Low-seats template"
                        value={form.low_seats_template ?? ""}
                        onChange={(v) => setForm({ ...form, low_seats_template: v })}
                        hint="Use {count} for the seat number and {plural} for s/empty."
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Field
                            label="Register button label"
                            value={form.register_button_label ?? ""}
                            onChange={(v) => setForm({ ...form, register_button_label: v })}
                        />
                        <Field
                            label="Full button label"
                            value={form.full_button_label ?? ""}
                            onChange={(v) => setForm({ ...form, full_button_label: v })}
                        />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            onClick={() => setEditing(false)}
                            className="text-xs px-4 py-2 rounded-lg text-neutral-500 hover:bg-neutral-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={update.isPending}
                            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-3.5 h-3.5" />
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-neutral-200 p-5 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <SettingRow label="Sessions heading" value={data?.sessions_heading} />
                    <SettingRow label="Low-seats template" value={data?.low_seats_template} />
                    <SettingRow label="No-sessions message" value={data?.no_sessions_message} full />
                    <SettingRow label="Register button" value={data?.register_button_label} />
                    <SettingRow label="Full button" value={data?.full_button_label} />
                </div>
            )}
        </section>
    );
}

function Field({
    label,
    value,
    onChange,
    textarea,
    hint,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    textarea?: boolean;
    hint?: string;
}) {
    return (
        <label className="block">
            <span className="block text-xs font-medium text-primary-900 mb-1">{label}</span>
            {textarea ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={2}
                    className="w-full text-sm rounded-lg border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full text-sm rounded-lg border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
            )}
            {hint && <span className="block text-[10px] text-neutral-400 mt-1">{hint}</span>}
        </label>
    );
}

function SettingRow({ label, value, full }: { label: string; value?: string; full?: boolean }) {
    return (
        <div className={full ? "sm:col-span-2" : undefined}>
            <div className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</div>
            <div className="text-primary-900">{value || <span className="text-neutral-400">—</span>}</div>
        </div>
    );
}
