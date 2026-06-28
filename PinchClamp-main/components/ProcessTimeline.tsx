"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { Clock, Search, Wrench, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePullIn } from "@/lib/scroll-animations";

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const phases = [
    {
        id: "discover",
        title: "Discovery Call",
        duration: "1 Hour",
        icon: Search,
        description:
            "Deep-dive into your workflows, data, and pain points. We map the opportunity landscape and define success metrics.",
        color: "#06B6D4",
    },
    {
        id: "design",
        title: "Architecture & Design",
        duration: "1–2 Weeks",
        icon: Clock,
        description:
            "System design, model selection, data pipeline architecture. You approve every decision before a line of code is written.",
        color: "#3B82F6",
    },
    {
        id: "build",
        title: "Build & Iterate",
        duration: "3–4 Weeks",
        icon: Wrench,
        description:
            "Agile sprints with weekly demos. RAG pipelines, agents, and integrations — all production-grade from day one.",
        color: "#8B5CF6",
    },
    {
        id: "deploy",
        title: "Deploy & Scale",
        duration: "Ongoing",
        icon: Rocket,
        description:
            "Production deployment with monitoring, fine-tuning loops, and scaling. We stay on as your AI engineering partner.",
        color: "#F59E0B",
    },
];

const AUTO_CYCLE_INTERVAL = 5000;

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function ProcessTimeline() {
    const [activeId, setActiveId] = useState<string>(phases[0].id);
    const [isHovering, setIsHovering] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);

    const sectionRef = useRef<HTMLElement>(null);
    const pullIn = usePullIn(sectionRef);

    /* Auto-cycle */
    const startCycle = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setActiveId((prev) => {
                const idx = phases.findIndex((p) => p.id === prev);
                return phases[(idx + 1) % phases.length].id;
            });
        }, AUTO_CYCLE_INTERVAL);
    }, []);

    const stopCycle = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Only start cycling when section enters viewport for the first time
    const hasStarted = useRef(false);
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted.current) {
                    hasStarted.current = true;
                    startCycle();
                }
            },
            { threshold: 0.2 }
        );
        observer.observe(el);
        return () => {
            observer.disconnect();
            stopCycle();
        };
    }, [startCycle, stopCycle]);

    const TOUCH_RESUME_DELAY = 4000;

    const touchResumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchActiveRef = useRef(false);

    const handleHover = (id: string | null) => {
        if (touchActiveRef.current) return; // Ignore mouse events during touch
        if (id) {
            setIsHovering(true);
            stopCycle();
            if (touchResumeRef.current) clearTimeout(touchResumeRef.current);
            setActiveId(id);
        } else {
            setIsHovering(false);
            startCycle();
        }
    };

    const handleTouch = (id: string) => {
        touchActiveRef.current = true;
        setIsHovering(true);
        stopCycle();
        setActiveId(id);
        if (touchResumeRef.current) clearTimeout(touchResumeRef.current);
        touchResumeRef.current = setTimeout(() => {
            touchActiveRef.current = false;
            setIsHovering(false);
            startCycle();
        }, TOUCH_RESUME_DELAY);
    };

    return (
        <section
            ref={sectionRef}
            id="process"
            className="relative z-[1] py-24"
        >
            <m.div
                className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                style={pullIn}
            >
                {/* Heading */}
                <m.div
                    className="mb-16"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <h2 className="font-heading text-3xl font-bold text-pinch-text md:text-4xl lg:text-5xl">
                        From idea to <span className="gradient-arc-full-text">production</span>
                    </h2>
                    <p className="mt-4 max-w-xl text-pinch-muted">
                        A battle-tested process that takes you from idea to production AI — fast, transparent, and engineering-first.
                    </p>
                </m.div>

                {/* 
                    Expandable cards — HORIZONTAL only.
                    All cards share a fixed height. 
                    Active card gets flex:4, others get flex:1.
                    Content inside is always rendered, just fades in/out via opacity.
                    No height animation at all.
                */}
                <div className="flex flex-col gap-[2px] lg:h-[220px] lg:flex-row">
                    {phases.map((phase) => {
                        const Icon = phase.icon;
                        const isActive = activeId === phase.id;

                        return (
                            <m.div
                                key={phase.id}
                                className="relative cursor-pointer overflow-hidden"
                                onMouseEnter={() => handleHover(phase.id)}
                                onMouseLeave={() => handleHover(null)}
                                onTouchStart={(e) => {
                                    const t = e.touches[0];
                                    touchStartPos.current = { x: t.clientX, y: t.clientY };
                                }}
                                onTouchEnd={(e) => {
                                    if (!touchStartPos.current) return;
                                    const t = e.changedTouches[0];
                                    const dx = Math.abs(t.clientX - touchStartPos.current.x);
                                    const dy = Math.abs(t.clientY - touchStartPos.current.y);
                                    if (dx < 10 && dy < 10) {
                                        handleTouch(phase.id);
                                    }
                                    touchStartPos.current = null;
                                }}
                                animate={{ flex: isActive ? 4 : 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 28,
                                }}
                                style={{ minWidth: 0, background: 'var(--overlay-subtle)' }}
                            >
                                {/* Color accent at top */}
                                <div
                                    className="h-[2px] transition-all duration-300"
                                    style={{
                                        background: isActive ? phase.color : "transparent",
                                    }}
                                />

                                {/* COLLAPSED — horizontal on mobile, vertical on desktop */}
                                <div
                                    className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
                                    style={{
                                        opacity: isActive ? 0 : 1,
                                        transitionDelay: isActive ? "0ms" : "250ms",
                                        pointerEvents: isActive ? "none" : "auto",
                                    }}
                                >
                                    {/* Mobile: horizontal text */}
                                    <span className="text-sm font-bold tracking-wider text-pinch-muted lg:hidden">
                                        {phase.title}
                                    </span>
                                    {/* Desktop: vertical text */}
                                    <span
                                        className="hidden text-sm font-bold tracking-wider text-pinch-muted lg:block"
                                        style={{
                                            writingMode: "vertical-lr",
                                            transform: "rotate(180deg)",
                                        }}
                                    >
                                        {phase.title}
                                    </span>
                                </div>

                                {/* ACTIVE — full content */}
                                <div
                                    className="flex h-full flex-col justify-between p-5 transition-opacity duration-300"
                                    style={{
                                        opacity: isActive ? 1 : 0,
                                        transitionDelay: isActive ? "300ms" : "0ms",
                                        pointerEvents: isActive ? "auto" : "none",
                                    }}
                                >
                                    {/* Icon + Title + Duration inline */}
                                    <div className="flex items-center gap-3">
                                        <Icon
                                            className="h-4 w-4 shrink-0"
                                            style={{ color: phase.color }}
                                        />
                                        <h3 className="whitespace-nowrap text-sm font-bold text-pinch-text">
                                            {phase.title}
                                        </h3>
                                        <span
                                            className="ml-auto shrink-0 text-xs font-semibold lg:hidden"
                                            style={{ color: phase.color }}
                                        >
                                            {phase.duration}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="mt-3 flex-1 text-xs leading-relaxed text-pinch-muted">
                                        {phase.description}
                                    </p>

                                    {/* Duration — desktop only (separate row) */}
                                    <div className="mt-3 hidden border-t pt-3 lg:block" style={{ borderColor: 'var(--overlay-border)' }}>
                                        <span
                                            className="text-sm font-semibold"
                                            style={{ color: phase.color }}
                                        >
                                            {phase.duration}
                                        </span>
                                    </div>
                                </div>
                            </m.div>
                        );
                    })}
                </div>

                {/* Progress dots */}
                <div className="mt-6 flex items-center justify-center gap-3">
                    {phases.map((p) => (
                        <m.div
                            key={p.id}
                            className="h-2 w-2 rounded-full transition-colors duration-300"
                            style={{
                                background: activeId === p.id ? p.color : "var(--overlay-dot)",
                            }}
                            animate={{
                                scale: activeId === p.id ? 1.3 : 1,
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                    ))}
                </div>
            </m.div>
        </section>
    );
}
