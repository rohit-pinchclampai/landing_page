"use client";

import { useRef } from "react";
import { m, LazyMotion, domAnimation } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import type { BlogPostMeta } from "@/lib/blog-data";

/* ─── Blog Post Client Component ───────────────────────────────────────────── */

export default function BlogPostClient({
    meta,
    content,
}: {
    meta: BlogPostMeta;
    content: string;
}) {
    const articleRef = useRef<HTMLElement>(null);

    // Strip the first H1 from content since we render it separately in the hero
    const contentWithoutTitle = content.replace(/^#\s+.+\n+/, "");

    return (
        <LazyMotion features={domAnimation}>
            <div
                className="min-h-screen"
                style={{ background: "#060912" }}
            >
                {/* ─── Hero Banner ─────────────────────────────────────────── */}
                <div className="relative overflow-hidden">
                    {/* Background image with overlay */}
                    <div className="absolute inset-0">
                        <img
                            src={meta.image}
                            alt=""
                            className="h-full w-full object-cover"
                            aria-hidden="true"
                        />
                        <div
                            className="absolute inset-0"
                            style={{
                                background:
                                    "linear-gradient(180deg, rgba(6,9,18,0.75) 0%, rgba(6,9,18,0.92) 60%, #060912 100%)",
                            }}
                        />
                    </div>

                    <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
                        {/* Back link */}
                        <m.a
                            href="/#insights"
                            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-pinch-cyan"
                            style={{ color: "#9CA3AF" }}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Insights
                        </m.a>

                        {/* Title */}
                        <m.h1
                            className="mt-8 font-heading text-3xl font-bold leading-tight sm:text-4xl md:text-5xl"
                            style={{ color: "#F9FAFB" }}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                        >
                            {meta.title}
                        </m.h1>

                        {/* Meta row */}
                        <m.div
                            className="mt-6 flex items-center gap-6 text-sm"
                            style={{ color: "#9CA3AF" }}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.35 }}
                        >
                            <span className="inline-flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-pinch-cyan" />
                                {meta.date}
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <Clock className="h-4 w-4 text-pinch-cyan" />
                                {meta.readTime}
                            </span>
                        </m.div>
                    </div>
                </div>

                {/* ─── Article Body ────────────────────────────────────────── */}
                <m.article
                    ref={articleRef}
                    className="relative z-10 mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 lg:px-8"
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.45 }}
                >
                    <div className="blog-prose" style={{ color: "#9CA3AF" }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {contentWithoutTitle}
                        </ReactMarkdown>
                    </div>

                    {/* ─── Bottom CTA ──────────────────────────────────────── */}
                    <div
                        className="mt-16 rounded-xl border border-transparent p-8 text-center"
                        style={{
                            background: "rgba(255, 255, 255, 0.06)",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                        }}
                    >
                        <h3 className="font-heading text-xl font-bold sm:text-2xl" style={{ color: "#F9FAFB" }}>
                            Interested in building something like this?
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "#9CA3AF" }}>
                            We help enterprises bring AI solutions to production.
                            Let&apos;s discuss your project.
                        </p>
                        <a
                            href="/#contact"
                            className="btn-primary mt-6 inline-flex"
                        >
                            Get in Touch
                        </a>
                    </div>

                    {/* ─── Back link bottom ────────────────────────────────── */}
                    <div className="mt-12 text-center">
                        <a
                            href="/#insights"
                            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-pinch-cyan"
                            style={{ color: "#9CA3AF" }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to all insights
                        </a>
                    </div>
                </m.article>
            </div>
        </LazyMotion>
    );
}
