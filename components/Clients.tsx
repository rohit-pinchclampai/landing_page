"use client";

import { useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { Briefcase, Sparkles, Building2, Globe } from "lucide-react";

const clients = [
    { name: "Enterprise Client", industry: "Financial Services", icon: Building2 },
    { name: "Growth Startup", industry: "SaaS Platform", icon: Sparkles },
    { name: "Global Corp", industry: "Healthcare", icon: Globe },
    { name: "Tech Partner", industry: "E-Commerce", icon: Briefcase },
    { name: "AI-First Co", industry: "Education", icon: Sparkles },
    { name: "Innovation Labs", industry: "Manufacturing", icon: Building2 },
];

function MarqueeRow({
    items,
    reverse = false,
}: {
    items: typeof clients;
    reverse?: boolean;
}) {
    // Render the item set as a reusable block
    const renderItems = (keyPrefix: string) =>
        items.map((client, i) => (
            <div
                key={`${keyPrefix}-${client.name}-${i}`}
                className="flex w-[260px] shrink-0 items-center gap-4 rounded-none border-0 bg-pinch-surface px-6 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
            >
                <client.icon className="h-6 w-6 shrink-0 text-pinch-cyan" />
                <div>
                    <p className="text-sm font-medium text-pinch-text">
                        {client.name}
                    </p>
                    <p className="text-xs text-pinch-muted">{client.industry}</p>
                </div>
            </div>
        ));

    return (
        <div className="group flex overflow-hidden">
            <div
                className={`flex shrink-0 gap-4 animate-marquee ${reverse ? "[animation-direction:reverse]" : ""
                    } group-hover:[animation-play-state:paused]`}
                style={{ "--duration": "25s" } as React.CSSProperties}
            >
                {renderItems("a")}
                {renderItems("b")}
                {renderItems("c")}
                {renderItems("d")}
            </div>
        </div>
    );
}

export default function Clients() {
    const firstRow = clients.slice(0, Math.ceil(clients.length / 2));
    const secondRow = clients.slice(Math.ceil(clients.length / 2));

    const headingRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: headingRef,
        offset: ["start end", "center center"],
    });
    const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
    const y = useTransform(scrollYProgress, [0, 1], [32, 0]);

    return (
        <section id="clients" className="relative z-[1] py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <m.div
                    ref={headingRef}
                    className="text-center"
                    style={{ opacity, y }}
                >
                    <h2 className="font-heading text-3xl font-bold text-pinch-text md:text-4xl">
                        Our Work
                    </h2>
                    <p className="mx-auto mt-3 max-w-lg text-pinch-muted">
                        A look at what we&apos;ve been building.
                    </p>
                </m.div>

                <div className="mt-12 flex flex-col gap-4 overflow-hidden">
                    <MarqueeRow items={firstRow} />
                    <MarqueeRow items={secondRow} reverse />
                </div>
            </div>
        </section>
    );
}
