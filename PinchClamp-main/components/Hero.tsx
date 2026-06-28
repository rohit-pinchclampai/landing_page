"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

/* ─── Random beam generator ────────────────────────────────────────────────── */

const BEAM_GRADIENTS = [
    ["#5b7eea", "#46ace0"],
    ["#46ace0", "#1ae3d9"],
    ["#8B5CF6", "#5b7eea"],
    ["#06B6D4", "#1ae3d9"],
    ["#3B82F6", "#8B5CF6"],
    ["#1ae3d9", "#06B6D4"],
    ["#a855f7", "#8B5CF6"],
];

function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function generateBeamConfig(index: number) {
    const [c1, c2] = BEAM_GRADIENTS[index % BEAM_GRADIENTS.length];
    const rotate = Math.round(randomBetween(15, 30));
    const travelDistance = randomBetween(800, 1400);
    const radians = (rotate * Math.PI) / 180;
    // Move along the tilt direction: x goes left (negative sin), y goes down (cos)
    const xTravel = Math.round(-Math.sin(radians) * travelDistance);
    const yTravel = Math.round(Math.cos(radians) * travelDistance);
    return {
        left: `${randomBetween(10, 95)}%`,
        top: `${randomBetween(-60, -35)}%`,
        height: Math.round(randomBetween(380, 620)),
        width: Math.random() > 0.7 ? 2 : 1,
        rotate,
        duration: randomBetween(5.5, 10.5),
        delay: randomBetween(0, 7),
        peakOpacity: randomBetween(0.08, 0.2),
        xEnd: xTravel,
        yEnd: yTravel,
        gradient: `linear-gradient(180deg, transparent, ${c1}, ${c2}, transparent)`,
    };
}

function RandomBeam({ index }: { index: number }) {
    const [config, setConfig] = useState(() => generateBeamConfig(index));

    const reRandomize = useCallback(() => {
        setConfig(generateBeamConfig(index));
    }, [index]);

    return (
        <m.div
            className="absolute"
            style={{
                background: config.gradient,
                left: config.left,
                top: config.top,
                height: config.height,
                width: config.width,
            }}
            initial={{ opacity: 0, rotate: config.rotate }}
            animate={{
                x: [0, config.xEnd],
                y: [0, config.yEnd],
                opacity: [0, 0, config.peakOpacity, config.peakOpacity, 0, 0],
                rotate: config.rotate,
            }}
            transition={{
                duration: config.duration,
                ease: "easeInOut",
                delay: config.delay,
            }}
            onAnimationComplete={reRandomize}
        />
    );
}

function RandomBeams({ count }: { count: number }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return (
        <>
            {Array.from({ length: count }, (_, i) => (
                <RandomBeam key={i} index={i} />
            ))}
        </>
    );
}

/* ─── Stats Data ───────────────────────────────────────────────────────────── */

const stats = [
    { value: "10+", label: "Years Experience" },
    { value: "100%", label: "Client Satisfaction" },
    { value: "24/7", label: "Support Available" },
    { value: "5+", label: "Projects Delivered" },
];

export default function Hero() {
    const sectionRef = useRef<HTMLElement>(null);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"],
    });
    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);

    return (
        <section
            ref={sectionRef}
            id="hero"
            className="relative flex min-h-screen w-full flex-col items-center justify-center pt-20"
        >
            {/* ─── Parallax Background Layer ──────────────────────────────────── */}
            <m.div
                className="absolute left-0 right-0 top-0 z-0 pointer-events-none"
                style={{ y: bgY, bottom: "-50vh" }}
            >
                {/* Subtle dot grid — barely visible texture */}
                <div
                    className="absolute inset-0 opacity-45"
                    style={{
                        backgroundImage: `radial-gradient(circle, var(--dot-grid-color) 1px, transparent 1px)`,
                        backgroundSize: '32px 32px',
                        maskImage: 'linear-gradient(180deg, white 50%, transparent 85%)',
                        WebkitMaskImage: 'linear-gradient(180deg, white 50%, transparent 85%)',
                    }}
                />

                {/* Very subtle ambient orbs — barely perceptible depth */}
                <div style={{ opacity: 'var(--orb-opacity)' }}>
                    <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-pinch-blue-1/10 blur-[128px]" />
                    <div className="absolute -right-32 bottom-1/3 h-80 w-80 rounded-full bg-pinch-cyan/8 blur-[128px]" />
                </div>

                {/* Animated beams — randomly generated */}
                <div className="absolute inset-0 overflow-visible" style={{ opacity: 'var(--beam-opacity)' }}>
                    <RandomBeams count={7} />
                </div>
            </m.div>

            {/* ─── Content ─────────────────────────────────────────────────── */}
            <div className="relative z-10 container mx-auto flex max-w-5xl flex-col items-center justify-center px-4 sm:px-6">
                <m.h1
                    className="w-full text-center font-heading text-5xl font-bold leading-tight tracking-tight text-pinch-text md:text-7xl"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    Clamping{" "}
                    <span className="gradient-arc-full-text">AI</span>{" "}
                    to your needs.
                </m.h1>

                <m.p
                    className="mx-auto mt-8 max-w-2xl text-center text-lg leading-relaxed text-pinch-muted md:text-xl"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                >
                    Your enterprise partner for RAG, Agentic AI, chatbot solutions, and
                    fine-tuning large language models.
                </m.p>

                {/* ─── CTA Buttons ─────────────────────────────────────────── */}
                <m.div
                    className="mt-12 flex w-full flex-col items-center justify-center gap-4 sm:flex-row"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                >
                    <a href="#contact" className="btn-primary">
                        <span className="inline-flex items-center gap-2">Start a Project <ArrowRight className="h-4 w-4 shrink-0" /></span>
                    </a>
                    <a href="#services" className="btn-outline">
                        View Services
                    </a>
                </m.div>

                {/* ─── Stats Bar ───────────────────────────────────────────── */}
                <m.div
                    className="mt-20 grid w-full max-w-3xl grid-cols-2 gap-6 md:grid-cols-4"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.6 }}
                >
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="font-heading text-2xl font-bold text-pinch-text md:text-3xl">
                                {stat.value}
                            </div>
                            <div className="mt-1 text-xs text-pinch-muted">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </m.div>
            </div>

            {/* Bottom gradient fade for smooth transition to next section */}
            <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-32"
                style={{ background: 'linear-gradient(to bottom, transparent, var(--pinch-bg))' }}
            />
        </section>
    );
}