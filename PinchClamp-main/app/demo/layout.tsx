"use client";

import { LazyMotion, domAnimation } from "framer-motion";

/**
 * Shared layout for all /demo routes.
 * Adds a line-grid sandbox background, creating visual distinction
 * between floating content sections and the textured background.
 */
export default function DemoLayout({ children }: { children: React.ReactNode }) {
    return (
        <LazyMotion features={domAnimation} strict>
            <div className="relative min-h-screen bg-pinch-bg overflow-clip">
                {/* Static Grid Background */}
                <div
                    className="fixed inset-0 z-0 pointer-events-none opacity-[0.16]"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, var(--dot-grid-color) 1px, transparent 1px),
              linear-gradient(to bottom, var(--dot-grid-color) 1px, transparent 1px)
            `,
                        backgroundSize: "40px 40px",
                    }}
                />

                {/* Content (sits above the background) */}
                <div className="relative z-10">
                    {children}
                </div>
            </div>
        </LazyMotion>
    );
}
