import fs from "fs";
import path from "path";

/* ─── Blog Post Metadata ───────────────────────────────────────────────────── */

export interface BlogPostMeta {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    date: string;
    readTime: string;
    image: string;
}

export const blogPosts: BlogPostMeta[] = [
    {
        slug: "future-of-telehealth",
        title: "The Future of Telehealth: How AI Is Transforming Virtual Healthcare",
        excerpt:
            "Healthcare has undergone a dramatic digital transformation. The next generation of virtual healthcare is no longer just about video consultations — it's about creating intelligent ecosystems that automate documentation, enhance clinical decision-making, and improve accessibility.",
        category: "Healthcare AI",
        date: "Jun 2026",
        readTime: "7 min read",
        image: "/blog/telehealth-featured.png",
    },
    {
        slug: "ai-powered-call-intelligence",
        title: "Why AI-Powered Call Intelligence Is Becoming a Competitive Advantage",
        excerpt:
            "Sales organizations generate enormous amounts of valuable information every day, yet most is never fully utilized. AI is changing this dynamic by transforming conversations into actionable business intelligence that helps teams qualify leads faster and improve conversion rates.",
        category: "Communication AI",
        date: "Jun 2026",
        readTime: "7 min read",
        image: "/blog/call-intelligence-featured.png",
    },
];

/* ─── Content Loading ──────────────────────────────────────────────────────── */

export function getBlogPost(slug: string): { meta: BlogPostMeta; content: string } | null {
    const meta = blogPosts.find((p) => p.slug === slug);
    if (!meta) return null;

    const filePath = path.join(process.cwd(), "content", "blogs", `${slug}.md`);
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        return { meta, content };
    } catch {
        return null;
    }
}

export function getAllBlogSlugs(): string[] {
    return blogPosts.map((p) => p.slug);
}
