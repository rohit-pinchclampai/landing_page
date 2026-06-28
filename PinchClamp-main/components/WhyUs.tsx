"use client";

import { useRef, useState, useEffect } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const checklist = [
    "Expert team with 10+ years in AI/ML",
    "99.9% uptime for production systems",
    "Reduced operational costs by 40% on average",
];

const stats = [
    { value: "10+", label: "Years Experience" },
    { value: "100%", label: "Client Satisfaction" },
    { value: "24/7", label: "Support Available" },
    { value: "5+", label: "Projects Delivered" },
];

export default function WhyUs() {
    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress: leftProgress } = useScroll({
        target: leftRef,
        offset: ["start end", "start 40%"],
    });
    const leftOpacity = useTransform(leftProgress, [0, 1], [0, 1]);
    const leftX = useTransform(leftProgress, [0, 1], [-32, 0]);

    const { scrollYProgress: rightProgress } = useScroll({
        target: rightRef,
        offset: ["start end", "start 40%"],
    });
    const rightOpacity = useTransform(rightProgress, [0, 1], [0, 1]);
    const rightX = useTransform(rightProgress, [0, 1], [32, 0]);

    // Disable scroll-scrubbing on small screens
    const [isLg, setIsLg] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        setIsLg(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const leftStyle = isLg
        ? { opacity: leftOpacity, x: leftX }
        : { opacity: 1, x: 0 };
    const rightStyle = isLg
        ? { opacity: rightOpacity, x: rightX }
        : { opacity: 1, x: 0 };

    return (
        <section id="why-us" className="relative z-[1] py-16">
            {/* Subtle decorative orb */}
            <div className="orb absolute right-0 top-1/3 h-72 w-72 bg-pinch-blue-1/5" />

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
                    {/* Left column — scroll-linked slide from left */}
                    <m.div
                        ref={leftRef}
                        style={leftStyle}
                    >
                        <h2 className="font-heading text-3xl font-bold leading-tight md:text-4xl">
                            <span className="text-pinch-text">Why Choose </span>
                            <span className="gradient-arc-full-text">PinchClamp AI?</span>
                        </h2>

                        <p className="mt-4 leading-relaxed text-pinch-muted">
                            We&apos;re not just another AI consultancy. We&apos;re your strategic
                            partners in AI transformation, delivering solutions that truly
                            clamp to your business needs.
                        </p>

                        <ul className="mt-6 space-y-3">
                            {checklist.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-pinch-cyan" />
                                    <span className="text-sm text-pinch-text">{item}</span>
                                </li>
                            ))}
                        </ul>

                        <a href="#contact" className="btn-outline mt-8 inline-flex">
                            Partner With Us
                        </a>
                    </m.div>

                    {/* Right column — scroll-linked slide from right */}
                    <m.div
                        ref={rightRef}
                        style={rightStyle}
                    >
                        <div className="grid grid-cols-2 gap-4">
                            {stats.map((stat, i) => (
                                <m.div
                                    key={stat.label}
                                    className="rounded-xl border border-transparent p-6 text-center transition-colors duration-300 hover:border-pinch-cyan/20"
                                    style={{ background: 'var(--overlay-card)', boxShadow: 'var(--shadow-card)' }}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.5 }}
                                    transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
                                >
                                    <p className="gradient-arc-text font-heading text-4xl font-bold">
                                        {stat.value}
                                    </p>
                                    <p className="mt-1 text-sm text-pinch-muted">{stat.label}</p>
                                </m.div>
                            ))}
                        </div>
                    </m.div>
                </div>
            </div>
        </section>
    );
}
