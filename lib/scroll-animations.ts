"use client";

import { useRef } from "react";
import { useScroll, useTransform } from "framer-motion";

/**
 * Hook: scroll-linked opacity + translate-Y animation.
 * Element starts invisible at bottom of viewport, fully visible at center.
 */
function useScrollReveal(
    ref: React.RefObject<HTMLElement | null>,
    { y = 40 } = {}
) {
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "center center"],
    });
    const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
    const translateY = useTransform(scrollYProgress, [0, 1], [y, 0]);
    return { opacity, translateY };
}

/**
 * Hook: scroll-linked opacity + translate-X animation (for opposing columns).
 */
function useScrollRevealX(
    ref: React.RefObject<HTMLElement | null>,
    { x = -40 } = {}
) {
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "center center"],
    });
    const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
    const translateX = useTransform(scrollYProgress, [0, 1], [x, 0]);
    return { opacity, translateX };
}

/**
 * Hook: dramatic scroll-scrub "pull into viewport" animation.
 * Content scales up (0.95→1) and translates (80→0) as it enters.
 * Fully bidirectional — reverses when scrolling back up.
 */
function usePullIn(
    ref: React.RefObject<HTMLElement | null>,
    { yOffset = 80, scaleFrom = 0.95 } = {}
) {
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });
    const y = useTransform(scrollYProgress, [0, 0.3], [yOffset, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.3], [scaleFrom, 1]);
    const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
    return { y, scale, opacity };
}

export { useScrollReveal, useScrollRevealX, usePullIn };
