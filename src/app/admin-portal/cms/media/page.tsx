"use client";

import { useState } from "react";
import {
    Grid3X3,
    List,
    Trash2,
    X,
    ImageIcon,
    FileText,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Tag,
    Search,
} from "lucide-react";
import type { MediaAssetData } from "@/types/cms";
import {
    useAdminMedia,
    useDeleteMedia,
    useUpdateMedia,
    useAdminMediaTags,
    useCreateMediaTag,
} from "@/lib/hooks/useCMSAdmin";
import { MediaUploader } from "@/components/admin/MediaUploader";

const PROCESSING_ICONS: Record<
    MediaAssetData["processing_status"],
    { icon: typeof Loader2; color: string }
> = {
    pending: { icon: Loader2, color: "text-neutral-400" },
    processing: { icon: Loader2, color: "text-yellow-500 animate-spin" },
    completed: { icon: CheckCircle2, color: "text-green-500" },
    failed: { icon: AlertCircle, color: "text-red-500" },
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibraryPage() {
    const [view, setView] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [tagFilter, setTagFilter] = useState<string>("all");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [editingMeta, setEditingMeta] = useState<string | null>(null);
    const [altText, setAltText] = useState("");
    const [caption, setCaption] = useState("");
    const [showUploader, setShowUploader] = useState(false);
    const [newTag, setNewTag] = useState("");

    const { data: media = [], isLoading } = useAdminMedia();
    const { data: tags = [] } = useAdminMediaTags();
    const deleteMedia = useDeleteMedia();
    const updateMedia = useUpdateMedia();
    const createTag = useCreateMediaTag();

    const filtered = media.filter((m) => {
        if (search && !m.filename.toLowerCase().includes(search.toLowerCase()) && !m.alt_text?.toLowerCase().includes(search.toLowerCase())) return false;
        if (typeFilter !== "all" && !m.asset_type.startsWith(typeFilter)) return false;
        if (statusFilter !== "all" && m.processing_status !== statusFilter) return false;
        if (tagFilter !== "all" && !m.tags.some((t) => t.slug === tagFilter)) return false;
        return true;
    });

    const selected = media.find((m) => m.id === selectedId);

    const handleSaveMeta = () => {
        if (!editingMeta) return;
        updateMedia.mutate(
            { id: editingMeta, data: { alt_text: altText, caption } as unknown as Parameters<typeof updateMedia.mutate>[0]["data"] },
            { onSuccess: () => setEditingMeta(null) }
        );
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">Media Library</h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {media.length} asset{media.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    onClick={() => setShowUploader(!showUploader)}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                >
                    {showUploader ? "Hide Uploader" : "Upload Asset"}
                </button>
            </div>

            {showUploader && (
                <div className="mb-6">
                    <MediaUploader onUpload={() => setShowUploader(false)} />
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search files…"
                        className="w-full text-sm border border-neutral-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-primary-500"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="text-xs border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                >
                    <option value="all">All Types</option>
                    <option value="image">Images</option>
                    <option value="application/pdf">PDFs</option>
                    <option value="video">Videos</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                </select>
                <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="text-xs border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                >
                    <option value="all">All Tags</option>
                    {tags.map((t) => (
                        <option key={t.slug} value={t.slug}>{t.name}</option>
                    ))}
                </select>
                <div className="flex border border-neutral-200 rounded-lg overflow-hidden">
                    <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-primary-50 text-primary-600" : "text-neutral-400 hover:text-neutral-600"}`}>
                        <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-primary-50 text-primary-600" : "text-neutral-400 hover:text-neutral-600"}`}>
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tag management */}
            <div className="flex items-center gap-2 mb-5">
                <Tag className="w-3.5 h-3.5 text-neutral-400" />
                <div className="flex flex-wrap gap-1">
                    {tags.map((t) => (
                        <span key={t.id} className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">{t.name}</span>
                    ))}
                </div>
                <div className="flex items-center gap-1 ml-2">
                    <input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="New tag"
                        className="text-xs border border-neutral-200 rounded px-2 py-1 w-24 focus:outline-none focus:border-primary-500"
                    />
                    <button
                        onClick={() => {
                            if (newTag.trim()) {
                                createTag.mutate({ name: newTag.trim() } as unknown as Parameters<typeof createTag.mutate>[0]);
                                setNewTag("");
                            }
                        }}
                        disabled={!newTag.trim()}
                        className="text-xs px-2 py-1 rounded bg-primary-900 text-white disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">Loading…</div>
            )}

            {/* Grid View */}
            {!isLoading && view === "grid" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filtered.map((asset) => {
                        const isImage = asset.asset_type.startsWith("image");
                        const thumb = asset.file_thumbnail ?? asset.file;
                        const info = PROCESSING_ICONS[asset.processing_status];
                        const StatusIcon = info.icon;

                        return (
                            <div
                                key={asset.id}
                                onClick={() => setSelectedId(asset.id === selectedId ? null : asset.id)}
                                className={`group relative bg-white rounded-xl border overflow-hidden cursor-pointer transition-all ${selectedId === asset.id ? "border-primary-400 ring-2 ring-primary-100" : "border-neutral-200 hover:border-neutral-300"
                                    }`}
                            >
                                <div className="aspect-square bg-neutral-50 flex items-center justify-center">
                                    {isImage && thumb ? (
                                        <img src={thumb} alt={asset.alt_text || asset.filename} className="w-full h-full object-cover" />
                                    ) : isImage ? (
                                        <ImageIcon className="w-8 h-8 text-neutral-300" />
                                    ) : (
                                        <FileText className="w-8 h-8 text-neutral-300" />
                                    )}
                                </div>
                                <div className="p-2">
                                    <p className="text-[10px] text-neutral-600 truncate">{asset.filename}</p>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[10px] text-neutral-400">{formatBytes(asset.file_size)}</span>
                                        <StatusIcon className={`w-3 h-3 ${info.color}`} />
                                    </div>
                                </div>
                                {asset.usage_count > 0 && (
                                    <span className="absolute top-1.5 right-1.5 text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                                        {asset.usage_count}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* List View */}
            {!isLoading && view === "list" && (
                <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
                    {filtered.map((asset) => {
                        const isImage = asset.asset_type.startsWith("image");
                        const thumb = asset.file_thumbnail ?? asset.file;
                        const info = PROCESSING_ICONS[asset.processing_status];
                        const StatusIcon = info.icon;

                        return (
                            <div
                                key={asset.id}
                                onClick={() => setSelectedId(asset.id === selectedId ? null : asset.id)}
                                className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${selectedId === asset.id ? "bg-primary-50" : "hover:bg-neutral-50"
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden shrink-0">
                                    {isImage && thumb ? (
                                        <img src={thumb} alt={asset.alt_text || asset.filename} className="w-full h-full object-cover" />
                                    ) : (
                                        <FileText className="w-4 h-4 text-neutral-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-primary-900 truncate">{asset.filename}</p>
                                    <p className="text-xs text-neutral-400">{asset.alt_text || "No alt text"}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 text-xs text-neutral-400">
                                    <span>{formatBytes(asset.file_size)}</span>
                                    {asset.width && asset.height && <span>{asset.width}×{asset.height}</span>}
                                    <StatusIcon className={`w-3.5 h-3.5 ${info.color}`} />
                                    {asset.tags.length > 0 && (
                                        <div className="flex gap-1">
                                            {asset.tags.map((t) => (
                                                <span key={t.id} className="text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded">{t.name}</span>
                                            ))}
                                        </div>
                                    )}
                                    {asset.usage_count > 0 && (
                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                            {asset.usage_count} use{asset.usage_count !== 1 ? "s" : ""}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {filtered.length === 0 && !isLoading && (
                <p className="text-center text-neutral-400 text-sm py-12">No assets found.</p>
            )}

            {/* Detail panel for selected asset */}
            {selected && (
                <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-neutral-200 shadow-xl z-50 overflow-y-auto">
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-primary-900">Asset Details</h3>
                            <button onClick={() => setSelectedId(null)} className="p-1 rounded text-neutral-400 hover:text-neutral-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Preview */}
                        <div className="w-full aspect-square rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden mb-4">
                            {selected.asset_type.startsWith("image") && selected.file_medium ? (
                                <img src={selected.file_medium} alt={selected.alt_text || selected.filename} className="w-full h-full object-contain" />
                            ) : selected.asset_type.startsWith("image") && selected.file ? (
                                <img src={selected.file} alt={selected.alt_text || selected.filename} className="w-full h-full object-contain" />
                            ) : (
                                <FileText className="w-12 h-12 text-neutral-300" />
                            )}
                        </div>

                        {/* Metadata */}
                        <div className="space-y-3 text-xs">
                            <div>
                                <span className="font-medium text-neutral-700">Filename</span>
                                <p className="text-neutral-500 mt-0.5 break-all">{selected.filename}</p>
                            </div>
                            <div className="flex gap-4">
                                <div>
                                    <span className="font-medium text-neutral-700">Size</span>
                                    <p className="text-neutral-500">{formatBytes(selected.file_size)}</p>
                                </div>
                                {selected.width && selected.height && (
                                    <div>
                                        <span className="font-medium text-neutral-700">Dimensions</span>
                                        <p className="text-neutral-500">{selected.width}×{selected.height}</p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <span className="font-medium text-neutral-700">Type</span>
                                <p className="text-neutral-500">{selected.asset_type}</p>
                            </div>

                            {/* Variants */}
                            <div>
                                <span className="font-medium text-neutral-700">Variants</span>
                                <div className="flex gap-1.5 mt-1">
                                    {(["file_webp", "file_thumbnail", "file_medium", "file_large"] as const).map((key) => (
                                        <span
                                            key={key}
                                            className={`text-[10px] px-2 py-0.5 rounded ${selected[key] ? "bg-green-50 text-green-600" : "bg-neutral-50 text-neutral-300"
                                                }`}
                                        >
                                            {key.replace("file_", "")}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Alt text / Caption editing */}
                            {editingMeta === selected.id ? (
                                <div className="space-y-2 pt-2 border-t border-neutral-100">
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-700 mb-1">Alt Text</label>
                                        <input value={altText} onChange={(e) => setAltText(e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-700 mb-1">Caption</label>
                                        <input value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-500" />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingMeta(null)} className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50">Cancel</button>
                                        <button onClick={handleSaveMeta} disabled={updateMedia.isPending} className="text-xs px-3 py-1.5 rounded-lg bg-primary-900 text-white hover:bg-primary-800 disabled:opacity-50">Save</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-2 border-t border-neutral-100">
                                    <p className="text-neutral-500">{selected.alt_text || <span className="italic text-neutral-300">No alt text</span>}</p>
                                    {selected.caption && <p className="text-neutral-400 mt-0.5">{selected.caption}</p>}
                                    <button
                                        onClick={() => {
                                            setAltText(selected.alt_text ?? "");
                                            setCaption(selected.caption ?? "");
                                            setEditingMeta(selected.id);
                                        }}
                                        className="text-xs text-primary-600 hover:text-primary-700 mt-1"
                                    >
                                        Edit metadata
                                    </button>
                                </div>
                            )}

                            {/* Usage warning + delete */}
                            <div className="pt-3 border-t border-neutral-100">
                                {selected.usage_count > 0 && (
                                    <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1 mb-2">
                                        ⚠ Used in {selected.usage_count} place{selected.usage_count !== 1 ? "s" : ""}. Deleting may break content.
                                    </p>
                                )}
                                {deleteConfirm === selected.id ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                deleteMedia.mutate(selected.id);
                                                setDeleteConfirm(null);
                                                setSelectedId(null);
                                            }}
                                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white"
                                        >
                                            Confirm Delete
                                        </button>
                                        <button onClick={() => setDeleteConfirm(null)} className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600">Cancel</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setDeleteConfirm(selected.id)}
                                        className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 className="w-3 h-3" />Delete Asset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
