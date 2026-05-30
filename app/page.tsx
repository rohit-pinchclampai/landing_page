/**
 * app/page.tsx — PinchClamp AI Landing Page
 *
 * Architecture:
 *   Layer 0: Unified parallax background (section color gradient, scrolls ~5% slower)
 *   Layer 1: Hero background elements (dots, orbs, beams — overflow into Services)
 *   Layer 2: Content (text, cards, forms at normal scroll speed)
 */

"use client";

import { useRef } from "react";
import { LazyMotion, domAnimation, m, useScroll, useTransform } from "framer-motion";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import AboutDrawers from "@/components/DVDDrawers";
import ProcessTimeline from "@/components/ProcessTimeline";
import WhyUs from "@/components/WhyUs";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  const mainRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  // Background scrolls ~5% slower than content — subtle depth
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-5%"]);

  return (
    <>
      <Navbar />

      <LazyMotion features={domAnimation} strict>
        <main
          ref={mainRef}
          className="relative flex flex-col w-full min-h-screen overflow-clip"
        >
          {/* ─── Unified Parallax Background ─────────────────────────── */}
          {/* One continuous gradient for ALL section color transitions */}
          <m.div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ y: bgY, height: "105%" }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg,
                  var(--color-pinch-bg) 0%,
                  var(--color-pinch-bg) 36%,
                  var(--bg-mid) 40%,
                  var(--color-pinch-surface) 44%,
                  var(--color-pinch-surface) 50%,
                  var(--bg-mid) 54%,
                  var(--color-pinch-bg) 58%,
                  var(--color-pinch-bg) 68%,
                  var(--bg-mid) 72%,
                  var(--color-pinch-surface) 76%,
                  var(--color-pinch-surface) 86%,
                  var(--bg-mid) 90%,
                  var(--color-pinch-bg) 94%,
                  var(--color-pinch-bg) 100%
                )`,
              }}
            />
          </m.div>

          {/* ─── Content Sections (transparent, sit on top) ──────────── */}
          <Hero />
          <Services />
          <AboutDrawers />

          {/* Decorative orb — between sections, offset left */}
          <div className="relative z-0 h-0 overflow-visible pointer-events-none" aria-hidden="true" style={{ opacity: 'var(--orb-opacity)' }}>
            <div
              className="absolute h-[400px] w-[400px] rounded-full blur-[160px]"
              style={{
                background: "radial-gradient(circle, rgba(139,92,246,0.15), rgba(59,130,246,0.08), transparent 70%)",
                left: "15%",
                top: "-200px",
              }}
            />
          </div>

          <ProcessTimeline />
          <WhyUs />
          <Contact />
        </main>
      </LazyMotion>

      <Footer />
    </>
  );
}