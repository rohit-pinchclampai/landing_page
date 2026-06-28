import { notFound } from "next/navigation";
import { getBlogPost, getAllBlogSlugs } from "@/lib/blog-data";
import type { Metadata } from "next";
import BlogPostClient from "./BlogPostClient";

/* ─── Static Params (SSG) ──────────────────────────────────────────────────── */

export function generateStaticParams() {
    return getAllBlogSlugs().map((slug) => ({ id: slug }));
}

/* ─── Dynamic Metadata ─────────────────────────────────────────────────────── */

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const post = getBlogPost(id);
    if (!post) return { title: "Blog — PinchClamp AI" };

    return {
        title: `${post.meta.title} | PinchClamp AI`,
        description: post.meta.excerpt,
        openGraph: {
            title: post.meta.title,
            description: post.meta.excerpt,
            type: "article",
            images: [{ url: post.meta.image }],
        },
    };
}

/* ─── Page Component ───────────────────────────────────────────────────────── */

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const post = getBlogPost(id);
    if (!post) notFound();

    return <BlogPostClient meta={post.meta} content={post.content} />;
}
