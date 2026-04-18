import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, User, Tag } from "lucide-react";
import { notFound } from "next/navigation";
import { fetchBlogPost, fetchBlogPosts } from "@/lib/api/cms-server";

/* ------------------------------------------------------------------ */
/*  Metadata                                                          */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const post = await fetchBlogPost(slug);
    if (!post) return { title: "Article Not Found | ABS Platform" };
    return {
        title: `${post.title} | ABS Blog`,
        description: post.excerpt || undefined,
        keywords: post.seo_keywords || undefined,
        openGraph: {
            title: post.title,
            description: post.excerpt || undefined,
            type: "article",
            publishedTime: post.published_at ?? undefined,
            authors: post.author_name ? [post.author_name] : undefined,
            images: post.featured_image
                ? [{ url: post.featured_image.file, alt: post.featured_image.alt_text || post.title }]
                : undefined,
        },
    };
}

/* ------------------------------------------------------------------ */
/*  Static params (for ISR)                                           */
/* ------------------------------------------------------------------ */

export async function generateStaticParams() {
    const posts = await fetchBlogPosts();
    return posts.map((p) => ({ slug: p.slug }));
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDate(iso: string | null) {
    if (!iso) return "";
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(iso));
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const post = await fetchBlogPost(slug);
    if (!post) notFound();

    return (
        <div className="min-h-screen bg-surface pt-24 pb-32">
            <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back link */}
                <Link
                    href="/resources/blog"
                    className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand transition-colors mb-8"
                >
                    <ArrowLeft size={16} /> Back to Blog
                </Link>

                {/* Category */}
                {post.category && (
                    <Link
                        href={`/resources/blog?category=${post.category.slug}`}
                        className="inline-block text-xs font-semibold text-brand uppercase tracking-wider mb-3 hover:underline"
                    >
                        {post.category.name}
                    </Link>
                )}

                {/* Title */}
                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground leading-tight">
                    {post.title}
                </h1>

                {/* Meta */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
                    {post.author_name && (
                        <span className="flex items-center gap-1.5">
                            {post.author_avatar ? (
                                <Image
                                    src={post.author_avatar.file}
                                    alt={post.author_name}
                                    width={24}
                                    height={24}
                                    className="rounded-full"
                                />
                            ) : (
                                <User size={16} />
                            )}
                            {post.author_name}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Calendar size={14} /> {formatDate(post.published_at)}
                    </span>
                    {post.reading_time_minutes && (
                        <span className="flex items-center gap-1">
                            <Clock size={14} /> {post.reading_time_minutes} min read
                        </span>
                    )}
                </div>

                {/* Featured image */}
                {post.featured_image && (
                    <div className="relative mt-8 aspect-[2/1] rounded-xl overflow-hidden">
                        <Image
                            src={post.featured_image.file}
                            alt={post.featured_image.alt_text || post.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                )}

                {/* Body */}
                <div
                    className="mt-10 prose prose-lg prose-neutral dark:prose-invert max-w-none
                        prose-headings:font-bold prose-a:text-brand prose-img:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: post.body }}
                />

                {/* Tags / keywords */}
                {post.seo_keywords && (
                    <div className="mt-12 pt-8 border-t border-border">
                        <div className="flex flex-wrap gap-2">
                            {post.seo_keywords.split(",").map((kw) => (
                                <span
                                    key={kw.trim()}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-alt text-xs text-muted"
                                >
                                    <Tag size={10} /> {kw.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom CTA */}
                <div className="mt-12 p-6 rounded-xl bg-surface-alt border border-border text-center">
                    <p className="text-lg font-semibold text-foreground">
                        Ready to transform your asset management?
                    </p>
                    <p className="mt-1 text-sm text-muted">
                        Explore ABS products and solutions today.
                    </p>
                    <Link
                        href="/scanners"
                        className="mt-4 inline-block px-6 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand/90 transition-colors"
                    >
                        Browse Products
                    </Link>
                </div>
            </article>
        </div>
    );
}
