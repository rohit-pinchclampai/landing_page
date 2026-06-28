"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Layers, Briefcase, ChevronRight, ChevronDown, Brain, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePullIn } from "@/lib/scroll-animations";

/* Tech stack icons from react-icons */
import {
    SiPython,
    SiFastapi,
    SiReact,
    SiMongodb,
} from "react-icons/si";
import { FaAws } from "react-icons/fa6";

/* ─── Data ─────────────────────────────────────────────────────────────────── */

type IconComponent = React.ComponentType<{ className?: string }>;

interface ClientItem {
    name: string;
    tagline: string;
    iconSrc: string;
    imgClass?: string;
}

interface TechItem {
    name: string;
    category: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface AIModel {
    name: string;
    provider: string;
    capability: string;
    iconSrc: string;
}

interface CloudProvider {
    name: string;
    iconSrc: string;
}

const clients: ClientItem[] = [
    { name: "Clovix", tagline: "AI-powered call center that turns every lead into a conversion", iconSrc: "/clovix.png", imgClass: "h-16 w-40" },
    { name: "DocSetu", tagline: "Bridging doctors and patients across remote communities", iconSrc: "/stethescope.png" },
    { name: "SocialBunkrs", tagline: "Social media intelligence platform", iconSrc: "/social-media.png" },
];

const techStack: TechItem[] = [
    { name: "Python", category: "Languages", icon: SiPython },
    { name: "FastAPI", category: "APIs", icon: SiFastapi },
    { name: "Web App", category: "Frontend", icon: SiReact },
    { name: "DynamoDB", category: "Database", icon: FaAws },
    { name: "MongoDB", category: "Database", icon: SiMongodb },
];

const aiModels: AIModel[] = [
    { name: "OpenAI", provider: "Closed-Source", capability: "GPT-4o & o1", iconSrc: "/openai.png" },
    { name: "Gemini", provider: "Closed-Source", capability: "2.0 Flash & Pro", iconSrc: "/gemini.png" },
    { name: "Claude", provider: "Closed-Source", capability: "Sonnet & Opus", iconSrc: "/claude.png" },
    { name: "Llama", provider: "Open-Source", capability: "Meta AI", iconSrc: "/llama.png" },
    { name: "Mistral", provider: "Open-Source", capability: "Mixtral & Large", iconSrc: "/mistral.png" },
    { name: "Qwen", provider: "Open-Source", capability: "Alibaba Cloud", iconSrc: "/qwen.png" },
];

const cloudProviders: CloudProvider[] = [
    { name: "AWS", iconSrc: "/aws.png" },
    { name: "Azure", iconSrc: "/azure.png" },
    { name: "Digital Ocean", iconSrc: "/digitalocean.png" },
    { name: "Google Cloud", iconSrc: "/googlecloud.png" },
];

/* Drawer metadata — colors used for hover borders per section */
const drawerMeta = [
    { id: "clients", label: "Clients", icon: Briefcase, color: "#06B6D4" },
    { id: "stack", label: "Tech Stack", icon: Layers, color: "#3B82F6" },
    { id: "models", label: "AI Models", icon: Brain, color: "#8B5CF6" },
    { id: "cloud", label: "Cloud", icon: Cloud, color: "#F59E0B" },
];

/* ─── Drawer Tab ───────────────────────────────────────────────────────────── */

function DrawerTab({
    drawer,
    isActive,
    onHover,
    onTap,
}: {
    drawer: (typeof drawerMeta)[number];
    isActive: boolean;
    onHover: (id: string | null) => void;
    onTap: (id: string) => void;
}) {
    const Icon = drawer.icon;
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    return (
        <m.div
            className="relative cursor-pointer select-none"
            onMouseEnter={() => onHover(drawer.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onTap(drawer.id)}
            onTouchStart={(e) => {
                const t = e.touches[0];
                touchStartRef.current = { x: t.clientX, y: t.clientY };
            }}
            onTouchEnd={(e) => {
                if (!touchStartRef.current) return;
                const t = e.changedTouches[0];
                const dx = Math.abs(t.clientX - touchStartRef.current.x);
                const dy = Math.abs(t.clientY - touchStartRef.current.y);
                if (dx < 10 && dy < 10) {
                    e.preventDefault();
                    onTap(drawer.id);
                }
                touchStartRef.current = null;
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Desktop layout */}
            <div
                className={cn(
                    "group hidden lg:flex items-center gap-4 rounded-lg border-0 p-5 transition-all duration-300",
                    isActive
                        ? "bg-pinch-surface shadow-[0_1px_8px_rgba(0,0,0,0.25)] translate-x-4"
                        : "bg-transparent hover:bg-[var(--overlay-hover-light)] translate-x-0"
                )}
            >
                <div
                    className="absolute left-0 top-0 h-full w-1 rounded-full transition-all duration-300"
                    style={{
                        background: isActive ? drawer.color : "transparent",
                        opacity: isActive ? 1 : 0,
                    }}
                />
                <Icon
                    className="h-5 w-5 shrink-0 transition-colors duration-300"
                    style={{ color: isActive ? drawer.color : "var(--color-pinch-muted)" }}
                />
                <span
                    className={cn(
                        "text-sm font-semibold tracking-wide transition-colors duration-300",
                        isActive ? "text-pinch-text" : "text-pinch-muted group-hover:text-pinch-text/80"
                    )}
                >
                    {drawer.label}
                </span>
                <ChevronRight
                    className={cn(
                        "ml-auto h-4 w-4 transition-all duration-300",
                        isActive ? "opacity-100" : "opacity-0 -translate-x-2"
                    )}
                    style={{ color: drawer.color }}
                />
            </div>

            {/* Mobile layout */}
            <div
                className={cn(
                    "group flex lg:hidden flex-col items-center gap-1 rounded-lg border-0 px-3 py-2 transition-all duration-300 relative",
                    isActive
                        ? "bg-pinch-surface scale-105"
                        : "bg-transparent scale-100"
                )}
            >
                <div
                    className="absolute left-0 right-0 top-0 h-[2px] rounded-full transition-all duration-300"
                    style={{
                        background: isActive ? drawer.color : "transparent",
                        opacity: isActive ? 1 : 0,
                    }}
                />
                <Icon
                    className="h-4 w-4 shrink-0 transition-colors duration-300"
                    style={{ color: isActive ? drawer.color : "var(--color-pinch-muted)" }}
                />
                <span
                    className={cn(
                        "text-[11px] font-semibold tracking-wide transition-colors duration-300",
                        isActive ? "text-pinch-text" : "text-pinch-muted"
                    )}
                >
                    {drawer.label}
                </span>
                <ChevronDown
                    className={cn(
                        "h-3 w-3 transition-all duration-300",
                        isActive ? "opacity-100" : "opacity-0"
                    )}
                    style={{ color: drawer.color }}
                />
            </div>
        </m.div>
    );
}

/* ─── Inner card — lighter bg, section-colored hover border ────────────────── */

function InnerCard({
    children,
    hoverColor,
    className: extraClass,
}: {
    children: React.ReactNode;
    hoverColor: string;
    className?: string;
}) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className={cn("rounded-xl border p-4 transition-all duration-300", extraClass)}
            style={{
                background: 'var(--overlay-card)',
                boxShadow: 'var(--shadow-card)',
                borderColor: hovered ? `${hoverColor}33` : 'transparent',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children}
        </div>
    );
}

/* ─── Clients Panel (marquee) ─────────────────────────────────────────────── */

function ClientsPanel() {
    const hoverColor = "#06B6D4"; // cyan
    return (
        <div className="flex h-full flex-col p-4 pb-8 lg:p-6 lg:pb-6">
            <h3 className="font-heading text-xl lg:text-2xl font-bold text-pinch-text pt-10 lg:pt-12 pb-6 lg:pb-8 text-center">
                Trusted By
            </h3>
            <div className="overflow-hidden flex-1 flex items-center">
                <div className="flex animate-marquee gap-4" style={{ width: "max-content", ['--duration' as string]: '20s' }}>
                    {[...clients, ...clients, ...clients, ...clients].map((client, i) => (
                        <InnerCard key={`${client.name}-${i}`} hoverColor={hoverColor} className="flex w-32 lg:w-48 flex-shrink-0 flex-col items-center justify-center text-center">
                            <div className="mb-2 lg:mb-3 flex h-10 lg:h-16 w-full items-center justify-center">
                                <img src={client.iconSrc} alt={client.name} className={cn("object-contain", client.imgClass || "h-8 w-8 lg:h-12 lg:w-12")} />
                            </div>
                            <p className="text-[10px] lg:text-xs font-semibold text-pinch-text">{client.name}</p>
                            <p className="mt-1 text-[10px] leading-snug text-pinch-muted line-clamp-2 hidden lg:block">{client.tagline}</p>
                        </InnerCard>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── Tech Stack Panel ─────────────────────────────────────────────────────── */

function StackPanel() {
    const hoverColor = "#3B82F6"; // blue

    const TechCard = ({ icon: Icon, name }: { icon: React.ComponentType<{ className?: string }>; name: string }) => (
        <InnerCard hoverColor={hoverColor} className="group flex w-full items-center gap-3 px-4 py-4">
            <Icon className="h-7 w-7 shrink-0 text-pinch-muted transition-colors group-hover:text-pinch-text" />
            <p className="text-sm font-semibold text-pinch-text">{name}</p>
        </InnerCard>
    );

    return (
        <div className="flex h-full flex-col p-4 lg:p-8">
            <h3 className="font-heading text-xl lg:text-2xl font-bold text-pinch-text pt-10 lg:pt-12 pb-6 lg:pb-8 text-center">
                Built With
            </h3>

            {/* Desktop: horizontal flow */}
            <div className="hidden lg:flex flex-1 items-center justify-center">
                <div className="flex w-48 flex-col">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-pinch-muted text-center opacity-60">Web &amp; Mobile Apps</p>
                    <div className="flex flex-col gap-2">
                        <TechCard icon={SiReact} name="Web App" />
                        <TechCard icon={SiReact} name="Mobile App" />
                    </div>
                </div>
                <div className="flex shrink-0 items-center px-2">
                    <span className="text-pinch-muted text-xs font-mono opacity-50">⟺</span>
                </div>
                <div className="flex w-48 flex-col">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-pinch-muted text-center opacity-60">Languages &amp; APIs</p>
                    <div className="flex flex-col gap-2">
                        <TechCard icon={SiPython} name="Python" />
                        <TechCard icon={SiFastapi} name="FastAPI" />
                    </div>
                </div>
                <div className="flex shrink-0 items-center px-2">
                    <span className="text-pinch-muted text-xs font-mono opacity-50">⟺</span>
                </div>
                <div className="flex w-48 flex-col">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-pinch-muted text-center opacity-60">Database</p>
                    <div className="flex flex-col gap-2">
                        <TechCard icon={FaAws} name="DynamoDB" />
                        <TechCard icon={SiMongodb} name="MongoDB" />
                    </div>
                </div>
            </div>

            {/* Mobile: vertical flow */}
            <div className="flex lg:hidden flex-1 flex-col items-center justify-center">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-pinch-muted text-center opacity-60">Web &amp; Mobile Apps</p>
                <div className="flex w-full max-w-[200px] flex-col gap-2">
                    <TechCard icon={SiReact} name="Web App" />
                    <TechCard icon={SiReact} name="Mobile App" />
                </div>
                <div className="flex justify-center py-1"><span className="text-pinch-muted text-xs font-mono opacity-50">⟺</span></div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-pinch-muted text-center opacity-60">Languages &amp; APIs</p>
                <div className="flex w-full max-w-[200px] flex-col gap-2">
                    <TechCard icon={SiPython} name="Python" />
                    <TechCard icon={SiFastapi} name="FastAPI" />
                </div>
                <div className="flex justify-center py-1"><span className="text-pinch-muted text-xs font-mono opacity-50">⟺</span></div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-pinch-muted text-center opacity-60">Database</p>
                <div className="flex w-full max-w-[200px] flex-col gap-2">
                    <TechCard icon={FaAws} name="DynamoDB" />
                    <TechCard icon={SiMongodb} name="MongoDB" />
                </div>
            </div>
        </div>
    );
}

/* ─── AI Models Panel ──────────────────────────────────────────────────────── */

function ModelsPanel() {
    const hoverColor = "#8B5CF6"; // purple
    const closedSource = aiModels.filter(m => m.provider === "Closed-Source");
    const openSource = aiModels.filter(m => m.provider === "Open-Source");
    return (
        <div className="flex h-full flex-col p-4 lg:p-6">
            <h3 className="font-heading text-xl lg:text-2xl font-bold text-pinch-text pt-6 lg:pt-8 pb-4 lg:pb-6 text-center">
                AI Models We Deploy
            </h3>
            <div className="flex flex-1 flex-col justify-center gap-3">
                <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-pinch-muted text-center opacity-60">Closed-Source</p>
                    <div className="grid grid-cols-3 gap-2">
                        {closedSource.map((model) => (
                            <InnerCard key={model.name} hoverColor={hoverColor} className="group flex flex-col items-center justify-center gap-1 p-2 lg:p-3 text-center">
                                <img src={model.iconSrc} alt={model.name} className="h-5 w-5 lg:h-6 lg:w-6 object-contain" />
                                <p className="text-[10px] lg:text-[11px] font-semibold text-pinch-text">{model.name}</p>
                                <p className="text-[9px] text-pinch-muted hidden lg:block">{model.capability}</p>
                            </InnerCard>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-pinch-muted text-center opacity-60">Open-Source</p>
                    <div className="grid grid-cols-3 gap-2">
                        {openSource.map((model) => (
                            <InnerCard key={model.name} hoverColor={hoverColor} className="group flex flex-col items-center justify-center gap-1 p-2 lg:p-3 text-center">
                                <img src={model.iconSrc} alt={model.name} className="h-5 w-5 lg:h-6 lg:w-6 object-contain" />
                                <p className="text-[10px] lg:text-[11px] font-semibold text-pinch-text">{model.name}</p>
                                <p className="text-[9px] text-pinch-muted hidden lg:block">{model.capability}</p>
                            </InnerCard>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Cloud Deployments Panel ──────────────────────────────────────────────── */

function CloudPanel() {
    const hoverColor = "#F59E0B"; // amber — matches 4th timeline phase
    return (
        <div className="flex h-full flex-col p-4 lg:p-6">
            <h3 className="font-heading text-xl lg:text-2xl font-bold text-pinch-text pt-6 lg:pt-8 pb-4 lg:pb-6 text-center">
                We Deploy On
            </h3>
            <div className="flex flex-1 items-center justify-center">
                <div className="grid grid-cols-2 max-w-md w-full">
                    {cloudProviders.map((provider, i) => (
                        <div
                            key={provider.name}
                            className={cn(
                                "px-2.5 py-1.5",
                                // right border on left column
                                i % 2 === 0 && "border-r border-[var(--overlay-border)]",
                                // bottom border on top row
                                i < 2 && "border-b border-[var(--overlay-border)]"
                            )}
                        >
                            <InnerCard hoverColor={hoverColor} className="group flex flex-col items-center justify-center gap-2 px-6 py-4 lg:px-8 lg:py-5 text-center">
                                <img src={provider.iconSrc} alt={provider.name} className="h-10 w-10 lg:h-12 lg:w-12 object-contain" />
                                <p className="text-[11px] lg:text-xs font-semibold text-pinch-text">{provider.name}</p>
                            </InnerCard>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── Content Router — panel + cards slide in together ─────────────────────── */

function ContentPanel({ activeId }: { activeId: string }) {
    return (
        <m.div
            key={activeId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="lg:absolute lg:inset-0"
        >
            {activeId === "clients" && <ClientsPanel />}
            {activeId === "stack" && <StackPanel />}
            {activeId === "models" && <ModelsPanel />}
        </m.div>
    );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

export default function AboutDrawers() {
    const [activeId, setActiveId] = useState<string>(drawerMeta[0].id);
    const [isHovering, setIsHovering] = useState(false);

    const sectionRef = useRef<HTMLElement>(null);
    const pullIn = usePullIn(sectionRef);

    // Detect mobile
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1023px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const handleHover = (id: string | null) => {
        if (isMobile) return;
        if (id) {
            setIsHovering(true);
            setActiveId(id);
        } else {
            setIsHovering(false);
        }
    };

    const handleTap = (id: string) => {
        setActiveId(id);
    };

    const activeDrawer = drawerMeta.find((d) => d.id === activeId) || drawerMeta[0];

    return (
        <section
            ref={sectionRef}
            id="about"
            className="relative z-10 py-24"
            style={{
                background: "linear-gradient(180deg, var(--color-pinch-bg) 0%, var(--color-pinch-bg) 80%, transparent 100%)",
            }}
        >
            <div
                className="pointer-events-none absolute top-0 left-0 right-0 z-0 h-32"
                style={{ background: 'linear-gradient(to top, transparent, var(--pinch-bg))' }}
            />
            <m.div
                className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                style={pullIn}
            >

                {/* Heading — one-shot materialize */}
                <m.div
                    className="mb-16 text-center"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <h2 className="font-heading text-3xl font-bold text-pinch-text md:text-4xl">
                        What <span className="gradient-arc-full-text">Powers</span> Us
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-pinch-muted">
                        The clients we serve, the stack we build on, and the AI models that drive it all.
                    </p>
                </m.div>

                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 lg:gap-8 lg:grid-cols-12 lg:gap-0">

                    {/* Drawer Tabs */}
                    <div className="flex flex-row justify-center gap-0 lg:flex-col lg:justify-center lg:gap-1 lg:col-span-4 lg:pr-4">
                        {drawerMeta.map((drawer, i) => (
                            <m.div
                                key={drawer.id}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.5 }}
                                transition={{ duration: 0.4, delay: 0.1 + i * 0.1, ease: "easeOut" }}
                                className="flex-1 lg:flex-none"
                            >
                                <DrawerTab
                                    drawer={drawer}
                                    isActive={activeId === drawer.id}
                                    onHover={handleHover}
                                    onTap={handleTap}
                                />
                            </m.div>
                        ))}
                    </div>

                    <m.div
                        className="relative lg:col-span-8 lg:min-h-[400px]"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                    >
                        <AnimatePresence mode="wait">
                            <m.div
                                key={activeId}
                                className="relative overflow-hidden rounded-lg lg:absolute lg:inset-0"
                                style={{ background: 'var(--color-pinch-surface)', boxShadow: 'var(--shadow-panel)' }}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                            >
                                <div
                                    className="absolute left-0 right-0 top-0 h-1"
                                    style={{ background: activeDrawer.color }}
                                />
                                {activeId === "clients" && <ClientsPanel />}
                                {activeId === "stack" && <StackPanel />}
                                {activeId === "models" && <ModelsPanel />}
                                {activeId === "cloud" && <CloudPanel />}
                            </m.div>
                        </AnimatePresence>
                    </m.div>
                </div>
            </m.div>
        </section>
    );
}