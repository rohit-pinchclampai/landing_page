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
import Insights from "@/components/Insights";
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
                  var(--color-pinch-bg) 32%,
                  var(--bg-mid) 36%,
                  var(--color-pinch-surface) 40%,
                  var(--color-pinch-surface) 46%,
                  var(--bg-mid) 50%,
                  var(--color-pinch-bg) 54%,
                  var(--color-pinch-bg) 62%,
                  var(--bg-mid) 66%,
                  var(--color-pinch-surface) 70%,
                  var(--color-pinch-surface) 76%,
                  var(--bg-mid) 80%,
                  var(--color-pinch-bg) 84%,
                  var(--color-pinch-bg) 90%,
                  var(--bg-mid) 94%,
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

          {/* Decorative orb — between WhyUs and Insights */}
          <div className="relative z-0 h-0 overflow-visible pointer-events-none" aria-hidden="true" style={{ opacity: 'var(--orb-opacity)' }}>
            <div
              className="absolute h-[400px] w-[400px] rounded-full blur-[160px]"
              style={{
                background: "radial-gradient(circle, rgba(91,126,234,0.12), rgba(26,227,217,0.06), transparent 70%)",
                right: "10%",
                top: "-200px",
              }}
            />
          </div>

          <Insights />
          <Contact />
        </main>
      </LazyMotion>

      <Footer />
    </>
  );
}