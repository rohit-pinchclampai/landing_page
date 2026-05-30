"use client";

import { useRef, useState, useCallback } from "react";
import { m } from "framer-motion";
import { Database, Bot, MessageCircle } from "lucide-react";
import { usePullIn } from "@/lib/scroll-animations";

const services = [
    {
        title: "RAG",
        description:
            "Boost LLMs with real-time knowledge retrieval for accurate, fact-based answers.",
        icon: Database,
    },
    {
        title: "Agentic AI",
        description:
            "Deploy autonomous AI agents that can plan, reason, and seamlessly execute complex workflows.",
        icon: Bot,
    },
    {
        title: "AI Chatbot",
        description:
            "Build conversational assistants that engage users with natural, human-like interactions.",
        icon: MessageCircle,
    },
];

/** Card with cursor-following glow effect */
function GlowCard({
    service,
    index,
}: {
    service: (typeof services)[number];
    index: number;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    }, []);

    return (
        <m.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: index * 0.2, ease: "easeOut" }}
        >
            <div
                ref={cardRef}
                className="rounded-xl border border-transparent relative h-full overflow-hidden p-8 flex flex-col transition-colors duration-300"
                style={{ background: 'var(--overlay-card)', boxShadow: 'var(--shadow-card)' }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Cursor-following glow */}
                {isHovered && (
                    <div
                        className="pointer-events-none absolute z-0 transition-opacity duration-300"
                        style={{
                            left: mousePos.x - 120,
                            top: mousePos.y - 120,
                            width: 240,
                            height: 240,
                            background: "radial-gradient(circle, hsl(187 80% 48% / 0.12) 0%, transparent 70%)",
                        }}
                    />
                )}

                <div className="relative z-10 flex flex-col h-full">
                    <span className="inline-flex">
                        <service.icon className="h-8 w-8 text-pinch-cyan" />
                    </span>
                    <h3 className="mt-4 font-heading text-xl font-semibold text-pinch-text">
                        {service.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-pinch-muted">
                        {service.description}
                    </p>
                    <a href={service.title === "RAG" ? "/demo/rag" : service.title === "AI Chatbot" ? "/demo/chatbot" : "/demo/agent"} className="btn-outline mt-5 w-full justify-center text-sm py-2.5">
                        View Demo
                    </a>
                </div>
            </div>
        </m.div>
    );
}

export default function Services() {
    const sectionRef = useRef<HTMLElement>(null);
    const pullIn = usePullIn(sectionRef);

    return (
        <section ref={sectionRef} id="services" className="relative z-[1] py-16">
            <m.div
                className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                style={pullIn}
            >
                {/* Section heading */}
                <div className="text-center">
                    <h2 className="font-heading text-3xl font-bold text-pinch-text md:text-4xl">
                        What We <span className="gradient-arc-full-text">Build</span>
                    </h2>
                    <p className="mx-auto mt-3 max-w-lg text-pinch-muted">
                        Enterprise-grade AI solutions tailored to your business.
                    </p>
                </div>

                {/* Cards — stagger from bottom, one by one */}
                <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((service, i) => (
                        <GlowCard key={service.title} service={service} index={i} />
                    ))}
                </div>
            </m.div>
        </section>
    );
}
