"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, ImageIcon, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { MediaAssetData } from "@/types/cms";
import { useUploadMedia, useUpdateMedia } from "@/lib/hooks/useCMSAdmin";

const STATUS_MAP: Record<MediaAssetData["processing_status"], { icon: typeof Loader2; color: string; label: string }> = {
    pending: { icon: Loader2, color: "text-neutral-400", label: "Pending" },
    processing: { icon: Loader2, color: "text-yellow-500 animate-spin", label: "Processing…" },
    completed: { icon: CheckCircle2, color: "text-green-500", label: "Ready" },
    failed: { icon: AlertCircle, color: "text-red-500", label: "Failed" },
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MediaUploaderProps {
    /** Called with the uploaded asset when upload completes */
    onUpload?: (asset: MediaAssetData) => void;
    /** Currently selected asset (for inline editing mode) */
    asset?: MediaAssetData | null;
    /** Whether to show compact (single-file) vs expanded (library) mode */
    compact?: boolean;
    /** Accepted file types */
    accept?: string;
}

export function MediaUploader({
    onUpload,
    asset,
    compact = false,
    accept = "image/*,application/pdf",
}: MediaUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [editingAlt, setEditingAlt] = useState(false);
    const [altText, setAltText] = useState(asset?.alt_text ?? "");
    const [caption, setCaption] = useState(asset?.caption ?? "");

    const upload = useUploadMedia();
    const update = useUpdateMedia();

    const handleFiles = useCallback(
        (files: FileList | null) => {
            if (!files || files.length === 0) return;
            const formData = new FormData();
            formData.append("file", files[0]);
            upload.mutate(formData, {
                onSuccess: (data) => {
                    onUpload?.(data as unknown as MediaAssetData);
                },
            });
        },
        [upload, onUpload]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
        },
        [handleFiles]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => setDragOver(false), []);

    const handleSaveMeta = () => {
        if (!asset) return;
        update.mutate(
            { id: asset.id, data: { alt_text: altText, caption } as unknown as Parameters<typeof update.mutate>[0]["data"] },
            { onSuccess: () => setEditingAlt(false) }
        );
    };

    const isImage = asset?.asset_type?.startsWith("image");
    const previewUrl = asset?.file_thumbnail ?? asset?.file ?? null;

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors ${dragOver
                        ? "border-primary-400 bg-primary-50"
                        : "border-neutral-200 bg-neutral-50 hover:border-neutral-300"
                    } ${compact ? "p-4" : "p-8"} flex flex-col items-center justify-center gap-2`}
            >
                {upload.isPending ? (
                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                ) : (
                    <Upload className={`${compact ? "w-5 h-5" : "w-8 h-8"} text-neutral-400`} />
                )}
                <p className="text-xs text-neutral-500">
                    {upload.isPending
                        ? "Uploading…"
                        : compact
                            ? "Drop file or click"
                            : "Drag & drop files here or click to browse"}
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            {/* Asset preview (when an asset is provided or just uploaded) */}
            {asset && (
                <div className="bg-white rounded-xl border border-neutral-200 p-4">
                    <div className="flex gap-4">
                        {/* Thumbnail / icon */}
                        <div className="w-20 h-20 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden shrink-0">
                            {isImage && previewUrl ? (
                                <img src={previewUrl} alt={asset.alt_text || asset.filename} className="w-full h-full object-cover" />
                            ) : isImage ? (
                                <ImageIcon className="w-6 h-6 text-neutral-400" />
                            ) : (
                                <FileText className="w-6 h-6 text-neutral-400" />
                            )}
                        </div>
                        {/* Meta */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary-900 truncate">{asset.filename}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                                <span>{formatBytes(asset.file_size)}</span>
                                {asset.width && asset.height && (
                                    <span>{asset.width}×{asset.height}</span>
                                )}
                                {(() => {
                                    const info = STATUS_MAP[asset.processing_status];
                                    const StatusIcon = info.icon;
                                    return (
                                        <span className={`inline-flex items-center gap-1 ${info.color}`}>
                                            <StatusIcon className="w-3 h-3" />{info.label}
                                        </span>
                                    );
                                })()}
                            </div>
                            {/* Variant availability */}
                            <div className="flex gap-1.5 mt-2">
                                {(["file_webp", "file_thumbnail", "file_medium", "file_large"] as const).map((key) => (
                                    <span
                                        key={key}
                                        className={`text-[10px] px-1.5 py-0.5 rounded ${asset[key]
                                                ? "bg-green-50 text-green-600"
                                                : "bg-neutral-50 text-neutral-300"
                                            }`}
                                    >
                                        {key.replace("file_", "")}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Inline alt text / caption editing */}
                    {editingAlt ? (
                        <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1">Alt Text</label>
                                <input
                                    value={altText}
                                    onChange={(e) => setAltText(e.target.value)}
                                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1">Caption</label>
                                <input
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setEditingAlt(false)} className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50">Cancel</button>
                                <button onClick={handleSaveMeta} disabled={update.isPending} className="text-xs px-3 py-1.5 rounded-lg bg-primary-900 text-white hover:bg-primary-800 disabled:opacity-50">
                                    {update.isPending ? "Saving…" : "Save"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => { setAltText(asset.alt_text ?? ""); setCaption(asset.caption ?? ""); setEditingAlt(true); }}
                            className="mt-2 text-xs text-primary-600 hover:text-primary-700"
                        >
                            {asset.alt_text ? `Alt: "${asset.alt_text}"` : "Add alt text & caption"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
