"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { CMSStatusBadge } from "@/components/admin/CMSStatusBadge";
import { PublishingActions } from "@/components/admin/PublishingActions";
import type { AdminBlogPostData, BlogCategoryData, TransitionRequest } from "@/types/cms";
import {
    useAdminBlogPosts,
    useCreateBlogPost,
    useUpdateBlogPost,
    useDeleteBlogPost,
    useTransitionBlogPost,
    useAdminBlogCategories,
    useCreateBlogCategory,
    useUpdateBlogCategory,
    useDeleteBlogCategory,
} from "@/lib/hooks/useCMSAdmin";

/* ------------------------------------------------------------------ */
/*  Blog Category inline manager                                      */
/* ------------------------------------------------------------------ */

function CategoryManager() {
    const { data: cats = [] } = useAdminBlogCategories();
    const createCat = useCreateBlogCategory();
    const updateCat = useUpdateBlogCategory();
    const deleteCat = useDeleteBlogCategory();
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [editId, setEditId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editSlug, setEditSlug] = useState("");

    return (
        <div className="mb-8 bg-white rounded-xl border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-primary-900">Blog Categories</h2>
                <button
                    onClick={() => setAdding(true)}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                >
                    <Plus className="w-3 h-3" />Add
                </button>
            </div>
            {adding && (
                <div className="flex items-end gap-2 mb-3">
                    <div>
                        <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="text-xs border border-neutral-300 rounded px-2 py-1.5 w-40" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Slug</label>
                        <input value={slug} onChange={(e) => setSlug(e.target.value)} className="text-xs border border-neutral-300 rounded px-2 py-1.5 w-40" />
                    </div>
                    <button
                        disabled={!name || !slug || createCat.isPending}
                        onClick={() => createCat.mutate({ name, slug } as Record<string, unknown>, { onSuccess: () => { setAdding(false); setName(""); setSlug(""); } })}
                        className="text-xs px-3 py-1.5 rounded bg-primary-900 text-white disabled:opacity-50"
                    >
                        Save
                    </button>
                    <button onClick={() => setAdding(false)} className="text-xs px-2 py-1.5 text-neutral-500 hover:text-neutral-700">Cancel</button>
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                {cats.map((c: BlogCategoryData) =>
                    editId === c.id ? (
                        <div key={c.id} className="flex items-center gap-1 bg-neutral-50 rounded px-2 py-1 border">
                            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-xs border rounded px-1.5 py-0.5 w-24" />
                            <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className="text-xs border rounded px-1.5 py-0.5 w-24" />
                            <button onClick={() => updateCat.mutate({ id: c.id, data: { name: editName, slug: editSlug } }, { onSuccess: () => setEditId(null) })} className="text-[10px] text-primary-700 hover:underline">Save</button>
                            <button onClick={() => setEditId(null)} className="text-[10px] text-neutral-400 hover:underline">Cancel</button>
                        </div>
                    ) : (
                        <div key={c.id} className="inline-flex items-center gap-1.5 bg-neutral-100 rounded-full px-3 py-1 text-xs">
                            <span className="font-medium">{c.name}</span>
                            <button onClick={() => { setEditId(c.id); setEditName(c.name); setEditSlug(c.slug); }} className="text-neutral-400 hover:text-primary-700"><Pencil className="w-3 h-3" /></button>
                            <button onClick={() => deleteCat.mutate(c.id)} className="text-neutral-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    )
                )}
                {cats.length === 0 && !adding && <span className="text-xs text-neutral-400">No categories yet</span>}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Blog Post Form                                                    */
/* ------------------------------------------------------------------ */

type BlogPostFormData = {
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    author_name: string;
    seo_keywords: string;
    reading_time_minutes: number;
    is_featured: boolean;
    category_id: string;
    order: number;
};

const EMPTY: BlogPostFormData = {
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    author_name: "",
    seo_keywords: "",
    reading_time_minutes: 5,
    is_featured: false,
    category_id: "",
    order: 0,
};

function BlogPostForm({
    initial,
    onSubmit,
    onCancel,
    isPending,
}: {
    initial?: Partial<BlogPostFormData>;
    onSubmit: (data: BlogPostFormData) => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<BlogPostFormData>({ ...EMPTY, ...initial });
    const { data: cats = [] } = useAdminBlogCategories();
    const set = (key: keyof BlogPostFormData, value: string | number | boolean) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                    <input value={form.title} onChange={(e) => set("title", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Slug</label>
                    <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Category</label>
                    <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500">
                        <option value="">— None —</option>
                        {cats.map((c: BlogCategoryData) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Author Name</label>
                    <input value={form.author_name} onChange={(e) => set("author_name", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Reading Time (min)</label>
                    <input type="number" value={form.reading_time_minutes} onChange={(e) => set("reading_time_minutes", parseInt(e.target.value) || 0)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Order</label>
                    <input type="number" value={form.order} onChange={(e) => set("order", parseInt(e.target.value) || 0)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Excerpt</label>
                <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Body (HTML)</label>
                <textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={8} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 font-mono" />
            </div>
            <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">SEO Keywords</label>
                <input value={form.seo_keywords} onChange={(e) => set("seo_keywords", e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" placeholder="keyword1, keyword2, ..." />
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="is_featured" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="rounded border-neutral-300" />
                <label htmlFor="is_featured" className="text-xs text-neutral-700">Featured post</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
                <button onClick={() => onSubmit(form)} disabled={isPending || !form.title || !form.slug} className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" />Save
                </button>
            </div>
        </div>
    );
}

function toPayload(data: BlogPostFormData) {
    return {
        ...data,
        category_id: data.category_id ? Number(data.category_id) : null,
    };
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function BlogPage() {
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState("all");

    const { data: posts = [], isLoading } = useAdminBlogPosts();
    const createPost = useCreateBlogPost();
    const updatePost = useUpdateBlogPost();
    const deletePost = useDeleteBlogPost();
    const transitionPost = useTransitionBlogPost();

    const filtered = statusFilter === "all" ? posts : posts.filter((p) => p.status === statusFilter);

    const handleCreate = (data: BlogPostFormData) => {
        createPost.mutate(toPayload(data) as unknown as Record<string, unknown>, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdate = (id: number, data: BlogPostFormData) => {
        const post = posts.find((p) => p.id === id);
        updatePost.mutate(
            { id, data: { ...toPayload(data), version: post?.version } as unknown as Record<string, unknown> },
            { onSuccess: () => setEditingId(null) }
        );
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">Blog Management</h1>
                    <p className="text-sm text-neutral-500 mt-1">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                    onClick={() => { setCreating(true); setEditingId(null); }}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />New Post
                </button>
            </div>

            <CategoryManager />

            <div className="flex flex-wrap gap-2 mb-5">
                {["all", "draft", "review", "approved", "published", "archived"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${statusFilter === s
                            ? "bg-primary-900 text-white border-primary-900"
                            : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"}`}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {creating && (
                <div className="mb-5">
                    <BlogPostForm onSubmit={handleCreate} onCancel={() => setCreating(false)} isPending={createPost.isPending} />
                </div>
            )}

            {isLoading && <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">Loading…</div>}

            {!isLoading && (
                <div className="space-y-3">
                    {filtered.map((post: AdminBlogPostData) =>
                        editingId === post.id ? (
                            <BlogPostForm
                                key={post.id}
                                initial={{
                                    title: post.title, slug: post.slug, excerpt: post.excerpt,
                                    body: post.body, author_name: post.author_name,
                                    seo_keywords: post.seo_keywords, reading_time_minutes: post.reading_time_minutes ?? 5,
                                    is_featured: post.is_featured, category_id: post.category?.id?.toString() ?? "",
                                    order: post.order,
                                }}
                                onSubmit={(d) => handleUpdate(post.id, d)}
                                onCancel={() => setEditingId(null)}
                                isPending={updatePost.isPending}
                            />
                        ) : (
                            <div key={post.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm text-primary-900">{post.title}</span>
                                        <CMSStatusBadge status={post.status} />
                                        {post.is_featured && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Featured</span>}
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{post.excerpt}</p>
                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-400">
                                        {post.category && <span>{post.category.name}</span>}
                                        <span>By {post.author_name || "—"}</span>
                                        <span>slug: {post.slug}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <PublishingActions
                                        status={post.status}
                                        version={post.version}
                                        onTransition={(data: TransitionRequest) => transitionPost.mutate({ id: post.id, data })}
                                        isPending={transitionPost.isPending}
                                    />
                                    <button onClick={() => { setEditingId(post.id); setCreating(false); }} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-primary-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                    {deleteConfirm === post.id ? (
                                        <div className="flex items-center gap-1 ml-1">
                                            <button onClick={() => deletePost.mutate(post.id, { onSuccess: () => setDeleteConfirm(null) })} className="text-[10px] px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Confirm</button>
                                            <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded hover:bg-neutral-100 text-neutral-400"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(post.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                    {filtered.length === 0 && !creating && (
                        <div className="text-center py-12 text-neutral-400 text-sm">
                            {statusFilter === "all" ? "No blog posts yet. Create your first post." : `No ${statusFilter} posts.`}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
