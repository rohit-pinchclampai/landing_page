"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Database, Bot, MessageCircle } from "lucide-react";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const services = [
    { title: "RAG", href: "#services", icon: Database, description: "Real-time knowledge retrieval for accurate answers." },
    { title: "Agentic AI", href: "#services", icon: Bot, description: "Autonomous AI agents for complex workflows." },
    { title: "AI Chatbot", href: "#services", icon: MessageCircle, description: "Natural, human-like conversational assistants." },
];

const navLinks = [
    { label: "About", href: "#about" },
    { label: "Process", href: "#process" },
    { label: "Contact", href: "#contact" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    return (
        <header
            className={cn(
                "fixed top-0 z-50 w-full border-b",
                mobileOpen
                    ? "bg-pinch-bg border-[var(--overlay-border)]"
                    : cn(
                        "transition-all duration-300",
                        scrolled
                            ? "bg-pinch-bg/80 backdrop-blur-md border-[var(--overlay-border)]"
                            : "bg-transparent border-transparent"
                    )
            )}
        >
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo — far left */}
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/pinchclamplogo.png"
                        alt="PinchClamp AI"
                        width={32}
                        height={32}
                        priority
                    />
                    <span className="font-heading text-lg font-semibold text-pinch-text">
                        PinchClamp AI
                    </span>
                </Link>

                {/* Desktop Nav — centered */}
                <nav className="hidden lg:flex items-center gap-1">
                    {/* Services dropdown */}
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent text-sm text-pinch-text/70 transition-all duration-200 hover:bg-transparent hover:text-pinch-cyan focus:bg-transparent focus:text-pinch-cyan data-[active]:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-pinch-cyan font-medium">
                                    Services
                                </NavigationMenuTrigger>

                                <NavigationMenuContent className="rounded-xl border border-[var(--overlay-border)]">
                                    <ul className="grid w-[280px] grid-cols-1 gap-1 p-3">
                                        {services.map((service) => (
                                            <li key={service.title} className="w-full">
                                                <NavigationMenuLink asChild>
                                                    <a
                                                        href={service.href}
                                                        className="group block h-full w-full select-none space-y-2 rounded-lg border-l-2 border-transparent p-3 no-underline outline-none transition-all duration-200 hover:border-pinch-cyan hover:bg-[var(--overlay-hover-light)] focus:bg-[var(--overlay-hover-light)]"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <service.icon className="h-5 w-5 shrink-0 text-pinch-cyan transition-transform group-hover:scale-110" />
                                                            <div className="text-sm font-medium leading-none text-pinch-text group-hover:text-white">
                                                                {service.title}
                                                            </div>
                                                        </div>
                                                        <p className="line-clamp-2 text-xs leading-snug text-pinch-muted">
                                                            {service.description}
                                                        </p>
                                                    </a>
                                                </NavigationMenuLink>
                                            </li>
                                        ))}
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>

                    {/* Plain nav links */}
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="px-4 py-2 text-sm font-medium text-pinch-text/70 transition-colors duration-150 hover:text-pinch-cyan"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                {/* CTA + Mobile toggle — far right */}
                <div className="flex items-center gap-3">
                    <div className="hidden lg:block">
                        <a href="#contact" className="btn-primary text-xs h-10 w-36 inline-flex">
                            Get Started
                        </a>
                    </div>
                    <button
                        className="p-2 text-pinch-text/70 hover:text-pinch-cyan lg:hidden"
                        onClick={() => setMobileOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </nav>

            {/* Mobile Slide-out */}
            {
                mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-50 bg-pinch-bg/60 backdrop-blur-sm"
                            onClick={() => setMobileOpen(false)}
                        />
                        {/* Panel */}
                        <div className="fixed bottom-0 right-0 top-0 z-50 w-72 border-l border-[var(--overlay-border)] bg-pinch-surface p-6">
                            <div className="mb-8 flex items-center justify-between">
                                <span className="font-heading font-bold text-pinch-text">Menu</span>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="text-pinch-muted hover:text-pinch-text"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <nav className="flex flex-col gap-1">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-pinch-muted">
                                    Services
                                </p>
                                {services.map((service) => (
                                    <a
                                        key={service.title}
                                        href={service.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-pinch-text/80 transition-colors hover:bg-[var(--overlay-hover-light)] hover:text-pinch-cyan"
                                    >
                                        <service.icon className="h-4 w-4 text-pinch-cyan" />
                                        <span>{service.title}</span>
                                    </a>
                                ))}
                                <div className="my-3 h-px" style={{ background: 'var(--overlay-border)' }} />
                                {navLinks.map((link) => (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="rounded-lg px-3 py-3 text-sm text-pinch-text/80 transition-colors hover:bg-[var(--overlay-hover-light)] hover:text-pinch-cyan"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--overlay-border)' }}>
                                    <a
                                        href="#contact"
                                        onClick={() => setMobileOpen(false)}
                                        className="btn-primary block w-full text-center text-sm"
                                    >
                                        Get Started
                                    </a>
                                </div>
                            </nav>
                        </div>
                    </>
                )
            }
        </header >
    );
}
