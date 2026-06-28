"use client";

import { useRef, useState, useCallback } from "react";
import { m } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { usePullIn } from "@/lib/scroll-animations";
import type { BlogPostMeta } from "@/lib/blog-data";

/* ─── Blog Post Data (client-safe metadata only) ───────────────────────────── */

const blogPosts: BlogPostMeta[] = [
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

/* ─── Blog Card with Cursor Glow ───────────────────────────────────────────── */

function BlogCard({
    post,
    index,
}: {
    post: BlogPostMeta;
    index: number;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            setMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        },
        []
    );

    return (
        <m.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: index * 0.2, ease: "easeOut" }}
        >
            <a
                href={`/blogs/${post.slug}`}
                className="block"
            >
                <div
                    ref={cardRef}
                    className="blog-card group relative h-full overflow-hidden rounded-xl border border-transparent transition-colors duration-300"
                    style={{
                        background: "var(--overlay-card)",
                        boxShadow: "var(--shadow-card)",
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Cursor-following glow */}
                    {isHovered && (
                        <div
                            className="pointer-events-none absolute z-0 transition-opacity duration-300"
                            style={{
                                left: mousePos.x - 150,
                                top: mousePos.y - 150,
                                width: 300,
                                height: 300,
                                background:
                                    "radial-gradient(circle, hsl(187 80% 48% / 0.10) 0%, transparent 70%)",
                            }}
                        />
                    )}

                    {/* Featured Image */}
                    <div className="relative z-10 overflow-hidden">
                        <div className="aspect-[16/9]">
                            <img
                                src={post.image}
                                alt={post.title}
                                className="blog-card-image h-full w-full object-cover"
                            />
                        </div>
                        {/* Gradient fade at bottom of image */}
                        <div
                            className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
                            style={{
                                background:
                                    "linear-gradient(to top, var(--color-pinch-bg), transparent)",
                                opacity: 0.6,
                            }}
                        />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-4">
                        {/* Title */}
                        <h3 className="font-heading text-base font-bold leading-snug text-pinch-text sm:text-lg">
                            {post.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="mt-1.5 text-sm leading-relaxed text-pinch-muted line-clamp-2">
                            {post.excerpt}
                        </p>

                        {/* Meta Row */}
                        <div className="mt-3 flex items-center gap-4 text-xs text-pinch-muted/70">
                            <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {post.date}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {post.readTime}
                            </span>
                        </div>

                        {/* Read More Link */}
                        <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">
                            <span className="gradient-arc-text">
                                Read Article
                            </span>
                            <ArrowRight className="blog-card-arrow h-4 w-4 text-pinch-cyan transition-transform duration-300" />
                        </div>
                    </div>
                </div>
            </a>
        </m.div>
    );
}

/* ─── Insights Section ─────────────────────────────────────────────────────── */

export default function Insights() {
    const sectionRef = useRef<HTMLElement>(null);
    const pullIn = usePullIn(sectionRef);

    return (
        <section ref={sectionRef} id="insights" className="relative z-[1] py-24">
            {/* Subtle decorative orb */}
            <div
                className="orb absolute left-0 top-1/4 h-72 w-72 bg-pinch-blue-1/5"
                aria-hidden="true"
            />

            <m.div
                className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                style={pullIn}
            >
                {/* Section Heading */}
                <m.div
                    className="mb-14 text-center"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <h2 className="font-heading text-3xl font-bold text-pinch-text md:text-4xl">
                        Latest{" "}
                        <span className="gradient-arc-full-text">Insights</span>
                    </h2>
                    <p className="mx-auto mt-3 max-w-lg text-pinch-muted">
                        Deep dives into the AI solutions shaping healthcare and
                        intelligent communication.
                    </p>
                </m.div>

                {/* Blog Card Grid */}
                <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
                    {blogPosts.map((post, i) => (
                        <BlogCard key={post.slug} post={post} index={i} />
                    ))}
                </div>
            </m.div>
        </section>
    );
}
