"use client";

import { useEffect, useState, useRef } from "react";

/**
 * CursorGlow — A subtle, page-wide gradient glow that follows the mouse.
 * Uses the PinchClamp brand gradient (cyan core).
 * Only activates on devices with a fine pointer (mouse).
 */
export default function CursorGlow() {
    const [hasMouse, setHasMouse] = useState(false);
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const isFinePointer = window.matchMedia(
            "(hover: hover) and (pointer: fine)"
        ).matches;
        setHasMouse(isFinePointer);
        if (!isFinePointer) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (glowRef.current) {
                glowRef.current.style.left = `${e.clientX}px`;
                glowRef.current.style.top = `${e.clientY}px`;
            }
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    if (!hasMouse) return null;

    return (
        <div
            ref={glowRef}
            className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-1/2"
            style={{
                width: "200px",
                height: "200px",
                background:
                    "radial-gradient(circle, rgba(26,227,217,0.08) 0%, rgba(70,172,224,0.04) 40%, transparent 70%)",
                transition: "left 0.08s linear, top 0.08s linear",
                willChange: "left, top",
            }}
        />
    );
}
