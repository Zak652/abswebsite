import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, User, Tag } from "lucide-react";
import {
    fetchPageMeta,
    fetchBlogPosts,
    fetchBlogCategories,
} from "@/lib/api/cms-server";
import type { BlogPostData, BlogCategoryData } from "@/types/cms";

const DEFAULT_TITLE = "Blog & Articles | ABS Platform";
const DEFAULT_DESC =
    "Insights, tutorials, and industry updates on asset management, RFID tracking, and enterprise solutions across Africa.";

export async function generateMetadata(): Promise<Metadata> {
    const meta = await fetchPageMeta("/resources/blog");
    return {
        title: meta?.title ?? DEFAULT_TITLE,
        description: meta?.description ?? DEFAULT_DESC,
    };
}

/* ------------------------------------------------------------------ */
/*  Fallback data                                                     */
/* ------------------------------------------------------------------ */

const FALLBACK_POSTS: BlogPostData[] = [
    {
        id: 1,
        title: "How RFID Is Transforming Asset Management in East Africa",
        slug: "rfid-transforming-east-africa",
        excerpt:
            "Discover how enterprises across East Africa are leveraging RFID technology to streamline asset tracking and reduce losses.",
        body: "",
        featured_image: null,
        category: { id: 1, name: "Industry Insights", slug: "industry-insights", description: "", order: 0 },
        author_name: "ABS Team",
        author_avatar: null,
        seo_keywords: "RFID, asset management, East Africa",
        reading_time_minutes: 5,
        is_featured: true,
        order: 0,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
    {
        id: 2,
        title: "Top 5 Barcode Scanner Models for Warehouse Operations",
        slug: "top-barcode-scanners-warehouse",
        excerpt:
            "A comprehensive comparison of the most reliable barcode scanners for high-volume warehouse environments.",
        body: "",
        featured_image: null,
        category: { id: 2, name: "Product Guides", slug: "product-guides", description: "", order: 1 },
        author_name: "ABS Team",
        author_avatar: null,
        seo_keywords: "barcode scanners, warehouse",
        reading_time_minutes: 7,
        is_featured: false,
        order: 1,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
    {
        id: 3,
        title: "Getting Started with ARC+ Asset Management Platform",
        slug: "getting-started-arcplus",
        excerpt:
            "A step-by-step guide to setting up and configuring the ARC+ platform for your organisation.",
        body: "",
        featured_image: null,
        category: { id: 3, name: "Tutorials", slug: "tutorials", description: "", order: 2 },
        author_name: "ABS Team",
        author_avatar: null,
        seo_keywords: "ARC+, setup, tutorial",
        reading_time_minutes: 10,
        is_featured: false,
        order: 2,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDate(iso: string | null) {
    if (!iso) return "";
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(iso));
}

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function FeaturedPost({ post }: { post: BlogPostData }) {
    return (
        <Link
            href={`/resources/blog/${post.slug}`}
            className="group block rounded-2xl overflow-hidden bg-card border border-border hover:border-brand/40 transition-all duration-300 hover:shadow-lg"
        >
            <div className="relative aspect-[2/1] bg-surface-alt">
                {post.featured_image ? (
                    <Image
                        src={post.featured_image.file}
                        alt={post.featured_image.alt_text || post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted">
                        <Tag size={48} />
                    </div>
                )}
                <span className="absolute top-4 left-4 bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Featured
                </span>
            </div>
            <div className="p-6 lg:p-8">
                {post.category && (
                    <span className="text-xs font-medium text-brand uppercase tracking-wider">
                        {post.category.name}
                    </span>
                )}
                <h2 className="mt-2 text-2xl lg:text-3xl font-bold text-foreground group-hover:text-brand transition-colors">
                    {post.title}
                </h2>
                <p className="mt-3 text-muted line-clamp-3">{post.excerpt}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1">
                        <User size={14} /> {post.author_name}
                    </span>
                    <span className="flex items-center gap-1">
                        <Calendar size={14} /> {formatDate(post.published_at)}
                    </span>
                    {post.reading_time_minutes && (
                        <span className="flex items-center gap-1">
                            <Clock size={14} /> {post.reading_time_minutes} min read
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

function PostCard({ post }: { post: BlogPostData }) {
    return (
        <Link
            href={`/resources/blog/${post.slug}`}
            className="group flex flex-col rounded-xl overflow-hidden bg-card border border-border hover:border-brand/40 transition-all duration-300 hover:shadow-md"
        >
            <div className="relative aspect-[16/9] bg-surface-alt">
                {post.featured_image ? (
                    <Image
                        src={post.featured_image.file}
                        alt={post.featured_image.alt_text || post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted">
                        <Tag size={32} />
                    </div>
                )}
            </div>
            <div className="flex-1 p-5">
                {post.category && (
                    <span className="text-xs font-medium text-brand uppercase tracking-wider">
                        {post.category.name}
                    </span>
                )}
                <h3 className="mt-1 text-lg font-semibold text-foreground group-hover:text-brand transition-colors line-clamp-2">
                    {post.title}
                </h3>
                <p className="mt-2 text-sm text-muted line-clamp-2">{post.excerpt}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(post.published_at)}
                    </span>
                    {post.reading_time_minutes && (
                        <span className="flex items-center gap-1">
                            <Clock size={12} /> {post.reading_time_minutes} min
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

function CategoryFilter({
    categories,
    active,
}: {
    categories: BlogCategoryData[];
    active: string | undefined;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            <Link
                href="/resources/blog"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!active
                        ? "bg-brand text-white"
                        : "bg-surface-alt text-muted hover:text-foreground"
                    }`}
            >
                All
            </Link>
            {categories.map((cat) => (
                <Link
                    key={cat.id}
                    href={`/resources/blog?category=${cat.slug}`}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${active === cat.slug
                            ? "bg-brand text-white"
                            : "bg-surface-alt text-muted hover:text-foreground"
                        }`}
                >
                    {cat.name}
                </Link>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function BlogPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string }>;
}) {
    const params = await searchParams;
    const activeCategory = params.category;

    const [cmsPosts, cmsCategories] = await Promise.all([
        fetchBlogPosts(activeCategory),
        fetchBlogCategories(),
    ]);

    const posts = cmsPosts.length > 0 ? cmsPosts : FALLBACK_POSTS;
    const featured = posts.find((p) => p.is_featured);
    const rest = posts.filter((p) => p !== featured);

    return (
        <div className="min-h-screen bg-surface pt-24 pb-32">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back link */}
                <Link
                    href="/resources"
                    className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand transition-colors mb-8"
                >
                    <ArrowLeft size={16} /> Back to Resources
                </Link>

                {/* Page header */}
                <div className="mb-10">
                    <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
                        Blog &amp; Articles
                    </h1>
                    <p className="mt-3 text-lg text-muted max-w-2xl">
                        Insights, tutorials, and industry updates on asset
                        management and enterprise solutions across Africa.
                    </p>
                </div>

                {/* Category filter */}
                {cmsCategories.length > 0 && (
                    <div className="mb-10">
                        <CategoryFilter
                            categories={cmsCategories}
                            active={activeCategory}
                        />
                    </div>
                )}

                {/* Featured post */}
                {featured && (
                    <div className="mb-12">
                        <FeaturedPost post={featured} />
                    </div>
                )}

                {/* Post grid */}
                {rest.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {rest.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    !featured && (
                        <div className="text-center py-20 text-muted">
                            <Tag size={48} className="mx-auto mb-4 opacity-40" />
                            <p className="text-lg">No articles published yet.</p>
                            <p className="text-sm mt-1">Check back soon for new content.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
