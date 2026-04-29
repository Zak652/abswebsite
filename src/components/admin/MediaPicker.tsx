"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, X, Upload, ImageIcon, FileText, Check } from "lucide-react";
import type { MediaAssetData } from "@/types/cms";
import {
    useAdminMedia,
    useAdminMediaTags,
} from "@/lib/hooks/useCMSAdmin";
import { MediaUploader } from "./MediaUploader";

interface MediaPickerProps {
    /** Currently selected media asset id (string UUID), or null if none. */
    value: string | null;
    /** Called when selection changes. `asset` is undefined when cleared. */
    onChange: (id: string | null, asset?: MediaAssetData | null) => void;
    /** Restrict the picker to a particular asset type. Defaults to "any". */
    accept?: "image" | "video" | "any";
    /** Optional small label displayed above the field. */
    label?: string;
    /** Optional helper text below the field. */
    helperText?: string;
}

/**
 * Reusable media picker that opens a modal listing existing media assets
 * (filterable by search + tag) and supports inline upload via the existing
 * `MediaUploader` component. Selecting an asset closes the modal and fires
 * `onChange(id, asset)`. A "Clear selection" button calls `onChange(null)`.
 */
export function MediaPicker({
    value,
    onChange,
    accept = "any",
    label,
    helperText,
}: MediaPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [tagFilter, setTagFilter] = useState<string>("all");
    const [showUploader, setShowUploader] = useState(false);

    const { data: media = [], isLoading } = useAdminMedia();
    const { data: tags = [] } = useAdminMediaTags();

    const selected = useMemo(
        () =>
            value
                ? (media as MediaAssetData[]).find((m) => m.id === value) ?? null
                : null,
        [value, media]
    );

    const filtered = useMemo(() => {
        return (media as MediaAssetData[]).filter((m) => {
            if (
                search &&
                !m.filename.toLowerCase().includes(search.toLowerCase()) &&
                !m.alt_text?.toLowerCase().includes(search.toLowerCase())
            ) {
                return false;
            }
            if (accept !== "any" && !m.asset_type?.startsWith(accept)) return false;
            if (
                tagFilter !== "all" &&
                !m.tags.some((t) => t.slug === tagFilter)
            ) {
                return false;
            }
            return true;
        });
    }, [media, search, tagFilter, accept]);

    const handleSelect = (asset: MediaAssetData) => {
        onChange(asset.id, asset);
        setOpen(false);
    };

    const handleClear = () => onChange(null, null);

    const previewSrc =
        selected?.file_thumbnail ?? selected?.file_medium ?? selected?.file ?? null;
    const isImage = selected?.asset_type?.startsWith("image");

    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-xs font-medium text-neutral-700">
                    {label}
                </label>
            )}

            <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg bg-white">
                {selected ? (
                    <>
                        <div className="w-14 h-14 shrink-0 rounded-md overflow-hidden bg-neutral-100 flex items-center justify-center">
                            {isImage && previewSrc ? (
                                <Image
                                    src={previewSrc}
                                    alt={selected.alt_text || selected.filename}
                                    width={56}
                                    height={56}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <FileText className="w-6 h-6 text-neutral-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-neutral-800 truncate">
                                {selected.filename}
                            </p>
                            {selected.alt_text && (
                                <p className="text-[11px] text-neutral-500 truncate">
                                    {selected.alt_text}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => setOpen(true)}
                                className="text-xs px-3 py-1.5 rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                            >
                                Change
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                aria-label="Clear selection"
                                className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-14 h-14 shrink-0 rounded-md bg-neutral-100 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-neutral-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-neutral-500">No media selected</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="text-xs px-3 py-1.5 rounded-md bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                        >
                            Choose media…
                        </button>
                    </>
                )}
            </div>

            {helperText && (
                <p className="text-[11px] text-neutral-500">{helperText}</p>
            )}

            {open && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-primary-900">
                                Select media
                            </h3>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
                                aria-label="Close picker"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Toolbar */}
                        <div className="px-5 py-3 border-b border-neutral-100 flex flex-wrap items-center gap-2">
                            <div className="relative flex-1 min-w-[180px]">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Search filename or alt text…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full text-xs pl-8 pr-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-primary-400"
                                />
                            </div>
                            <select
                                value={tagFilter}
                                onChange={(e) => setTagFilter(e.target.value)}
                                className="text-xs px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:border-primary-400"
                            >
                                <option value="all">All tags</option>
                                {tags.map((t) => (
                                    <option key={t.slug} value={t.slug}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setShowUploader((v) => !v)}
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                {showUploader ? "Hide uploader" : "Upload new"}
                            </button>
                        </div>

                        {showUploader && (
                            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50">
                                <MediaUploader
                                    compact
                                    accept={
                                        accept === "image"
                                            ? "image/*"
                                            : accept === "video"
                                                ? "video/*"
                                                : "image/*,application/pdf,video/*"
                                    }
                                    onUpload={(asset) => {
                                        setShowUploader(false);
                                        handleSelect(asset);
                                    }}
                                />
                            </div>
                        )}

                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {isLoading ? (
                                <p className="text-center text-neutral-400 text-sm py-12">
                                    Loading…
                                </p>
                            ) : filtered.length === 0 ? (
                                <p className="text-center text-neutral-400 text-sm py-12">
                                    No media matches your filters.
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {filtered.map((m) => {
                                        const isImg = m.asset_type?.startsWith("image");
                                        const thumb =
                                            m.file_thumbnail ?? m.file_medium ?? m.file;
                                        const isSelected = m.id === value;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => handleSelect(m)}
                                                className={`relative group rounded-lg overflow-hidden border transition-colors text-left ${isSelected
                                                    ? "border-primary-500 ring-2 ring-primary-200"
                                                    : "border-neutral-200 hover:border-neutral-300"
                                                    }`}
                                            >
                                                <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                                                    {isImg && thumb ? (
                                                        <Image
                                                            src={thumb}
                                                            alt={m.alt_text || m.filename}
                                                            width={200}
                                                            height={200}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <FileText className="w-8 h-8 text-neutral-400" />
                                                    )}
                                                </div>
                                                <div className="p-2">
                                                    <p className="text-[11px] font-medium text-neutral-700 truncate">
                                                        {m.filename}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute top-1.5 right-1.5 bg-primary-600 text-white rounded-full p-1 shadow">
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
