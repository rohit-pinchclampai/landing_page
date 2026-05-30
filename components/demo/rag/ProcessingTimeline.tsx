"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
    FileText,
    Download,
    Scissors,
    Cpu,
    Database,
    Loader2,
    AlertTriangle,
} from "lucide-react";

/* ─── Public types ─────────────────────────────────────────────────────────── */

export interface TimelineStep {
    label: string;
    status: "pending" | "active" | "done";
    /** 0–100 fill level for the liquid effect */
    progress: number;
    summary: string;
    icon: "extract" | "model" | "chunk" | "embed" | "upsert";
}

export interface ProcessingTimelineProps {
    steps: TimelineStep[];
    error?: string | null;
    strategy?: "recursive" | "semantic";
    onRetry?: () => void;
}

export const MIN_STEP_DISPLAY_MS = 600;

/* ─── Constants ────────────────────────────────────────────────────────────── */

const ICONS = {
    extract: FileText,
    model: Download,
    chunk: Scissors,
    embed: Cpu,
    upsert: Database,
} as const;

const SPRING = { type: "spring" as const, stiffness: 260, damping: 24 };

/* Duller, darker brand gradient for the liquid fill */
const LIQUID_GRADIENT =
    "linear-gradient(180deg, rgba(46,80,150,0.55) 0%, rgba(35,90,140,0.5) 40%, rgba(16,140,135,0.45) 100%)";

/* Match the top of the liquid gradient for seamless waves */
const WAVE_COLOR = "rgba(46,80,150,0.55)";

/* ─── Liquid Fill Card ─────────────────────────────────────────────────────── */

function LiquidCard({
    step,
    isSelected,
    onClick,
}: {
    step: TimelineStep;
    isSelected: boolean;
    onClick: () => void;
}) {
    const Icon = ICONS[step.icon];
    const fill = step.status === "done" ? 100 : step.progress;

    return (
        <m.button
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={SPRING}
            className={`
        relative w-full sm:w-[130px] h-[90px] sm:h-[120px] rounded-xl cursor-pointer
        focus:outline-none select-none overflow-hidden
        border transition-all duration-300
        ${isSelected
                    ? "border-pinch-cyan/40 ring-1 ring-pinch-cyan/20"
                    : step.status !== "pending"
                        ? "border-white/[0.08]"
                        : "border-white/[0.06] hover:border-white/[0.12]"
                }
      `}
            style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow: "0 4px 24px -4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
        >
            {/* ── Liquid Fill ──────────────────────────────────────────────── */}
            <m.div
                className="absolute bottom-0 left-0 right-0 pointer-events-none"
                initial={{ height: "0%" }}
                animate={{ height: `${fill}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 18 }}
                style={{ background: LIQUID_GRADIENT }}
            >
                {/* Wave surface */}
                {step.status === "active" && fill > 0 && (
                    <div
                        className="absolute left-0 right-0 overflow-hidden pointer-events-none"
                        style={{ bottom: "100%", height: "10px" }}
                    >
                        <svg
                            viewBox="0 0 600 14"
                            preserveAspectRatio="none"
                            className="absolute bottom-0 w-[200%] h-full"
                            style={{ animation: "wave-drift 3.5s ease-in-out infinite" }}
                        >
                            <path
                                d="M0,7 C15,5 30,9 52,6 C74,3 95,10 120,7 C145,4 162,11 190,8 C218,5 240,10 268,6 C296,2 315,11 345,8 C375,5 398,10 425,7 C452,4 470,12 505,7 C540,2 565,10 600,7 L600,14 L0,14 Z"
                                fill={WAVE_COLOR}
                            />
                        </svg>
                    </div>
                )}
            </m.div>

            {/* ── Card Content (above the fill) ────────────────────────── */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-4">
                {/* Icon */}
                <div className="mb-2.5">
                    <div
                        className={`
              w-9 h-9 rounded-lg flex items-center justify-center
              transition-colors duration-300
              ${step.status !== "pending"
                                ? "bg-white/[0.08]"
                                : "bg-white/[0.04] border border-white/[0.06]"
                            }
            `}
                    >
                        <Icon
                            className={`w-4 h-4 transition-colors duration-300 ${step.status === "active"
                                ? "text-pinch-cyan"
                                : step.status === "done"
                                    ? "text-pinch-text"
                                    : "text-pinch-muted"
                                }`}
                        />
                    </div>
                </div>

                {/* Label */}
                <div className="h-7 flex items-center justify-center w-full">
                    <span
                        className={`text-[11px] font-heading font-semibold leading-snug text-center transition-colors duration-300 ${step.status === "active"
                            ? "text-pinch-cyan"
                            : step.status === "done"
                                ? "text-pinch-text"
                                : "text-pinch-muted"
                            }`}
                    >
                        {step.label}
                    </span>
                </div>
            </div>
        </m.button>
    );
}

/* ─── Arrow Connector ──────────────────────────────────────────────────────── */

function ArrowConnector({
    prevDone,
    nextVisible,
}: {
    prevDone: boolean;
    nextVisible: boolean;
}) {
    return (
        <>
            {/* Desktop: horizontal arrow */}
            <m.div
                className="hidden sm:flex items-center mx-1.5 flex-shrink-0"
                initial={{ width: 8, opacity: 0 }}
                animate={{
                    width: prevDone && nextVisible ? 32 : 8,
                    opacity: 1,
                }}
                transition={SPRING}
            >
                {prevDone && (
                    <div className="flex-1 relative h-px">
                        <m.div
                            className="absolute inset-0"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            style={{ originX: 0, background: "rgba(26,227,217,0.35)" }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                    </div>
                )}
                <div
                    className="w-0 h-0 flex-shrink-0"
                    style={{
                        borderTop: "4px solid transparent",
                        borderBottom: "4px solid transparent",
                        borderLeft: prevDone
                            ? "5px solid rgba(26,227,217,0.4)"
                            : "5px solid var(--overlay-border)",
                    }}
                />
            </m.div>

            {/* Mobile: vertical arrow, centered */}
            <m.div
                className="flex sm:hidden flex-col items-center my-1 flex-shrink-0"
                initial={{ height: 8, opacity: 0 }}
                animate={{
                    height: prevDone && nextVisible ? 28 : 8,
                    opacity: 1,
                }}
                transition={SPRING}
            >
                {prevDone && (
                    <div className="flex-1 relative w-px">
                        <m.div
                            className="absolute inset-0"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            style={{ originY: 0, background: "rgba(26,227,217,0.35)" }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                    </div>
                )}
                <div
                    className="w-0 h-0 flex-shrink-0"
                    style={{
                        borderLeft: "4px solid transparent",
                        borderRight: "4px solid transparent",
                        borderTop: prevDone
                            ? "5px solid rgba(26,227,217,0.4)"
                            : "5px solid var(--overlay-border)",
                    }}
                />
            </m.div>
        </>
    );
}

/* ─── Educational Data Points ──────────────────────────────────────────────── */

const LEARN_RECURSIVE = [
    {
        label: "Fixed-Size Splitting",
        text: "Text is divided into equal chunks (default 500 chars) using a hierarchy of separators: paragraphs → lines → sentences → words. This ensures each chunk fits the model's context window.",
    },
    {
        label: "Overlap Window",
        text: "Each chunk overlaps the next by 50 characters. This sliding window prevents important context from being lost at chunk boundaries — a sentence split across two chunks is captured in both.",
    },
    {
        label: "384-Dimensional Embeddings",
        text: "MiniLM-L6-v2 maps each chunk into a 384-dimensional vector space. Semantically similar text ends up near each other, enabling meaning-based search instead of keyword matching.",
    },
    {
        label: "HNSW Vector Index",
        text: "Pinecone uses Hierarchical Navigable Small World graphs for approximate nearest-neighbor search. At query time, your question is embedded and matched against millions of vectors in milliseconds.",
    },
    {
        label: "Why It Works",
        text: "By converting documents into dense vectors, RAG lets the LLM access your specific knowledge without retraining. The retriever finds relevant chunks, and the LLM synthesizes a grounded answer.",
    },
];

const LEARN_SEMANTIC = [
    {
        label: "Cosine Similarity Boundaries",
        text: "Instead of fixed sizes, semantic chunking measures cosine similarity between consecutive sentence embeddings. When similarity drops below 0.45, a new chunk boundary is created.",
    },
    {
        label: "Context-Aware Splits",
        text: "Each chunk contains sentences that are semantically related. A paragraph about pricing stays together, even if it's 800 chars. A topic shift at 200 chars triggers a split. Meaning drives structure.",
    },
    {
        label: "384-Dimensional Embeddings",
        text: "MiniLM-L6-v2 maps each chunk into a 384-dimensional vector space. Semantically similar text ends up near each other, enabling meaning-based search instead of keyword matching.",
    },
    {
        label: "Variable Chunk Sizes",
        text: "Semantic chunks range from single sentences to multi-paragraph blocks. This mirrors how humans organize information — by topic, not by character count.",
    },
    {
        label: "Better Retrieval Accuracy",
        text: "Since each chunk is topically coherent, vector search returns more focused results. The LLM receives higher-quality context, producing answers that are more precise and less noisy.",
    },
];

/* ─── Main Component ───────────────────────────────────────────────────────── */

export default function ProcessingTimeline({ steps, error, strategy = "recursive", onRetry }: ProcessingTimelineProps) {
    const [selectedNode, setSelectedNode] = useState<number | null>(null);

    // Determine which nodes are visible:
    // Node 0 is visible if it's active or done.
    // Node i is visible if steps[i-1] is done OR steps[i] is active/done.
    const isNodeVisible = (i: number) => {
        if (steps[i].status !== "pending") return true;
        if (i > 0 && steps[i - 1].status === "done") return true;
        return false;
    };

    // Arrow between i and i+1: visible if node i is visible
    const isArrowVisible = (i: number) => isNodeVisible(i);

    // Check if any node is visible yet
    const anyNodeVisible = steps.some((_, i) => isNodeVisible(i));

    return (
        <div className="w-full max-w-5xl mx-auto py-8 px-4">
            {/* Wave animation keyframes */}
            <style>{`
        @keyframes wave-drift {
          0% { transform: translateX(0) scaleY(1); }
          50% { transform: translateX(-25%) scaleY(1.2); }
          100% { transform: translateX(-50%) scaleY(1); }
        }
      `}</style>

            {/* Header */}
            <m.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8 sm:mb-14"
            >
                <h3 className="font-heading text-xl font-semibold text-pinch-text">
                    Building Your <span className="gradient-arc-text">Knowledge Base</span>
                </h3>
                <p className="text-sm text-pinch-muted mt-2">
                    Click any node to see what it does
                </p>
            </m.div>

            {/* ── Placeholder Node (before any real nodes appear) ────── */}
            <AnimatePresence>
                {!anyNodeVisible && (
                    <m.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="flex justify-center mb-6"
                    >
                        <div
                            className="w-full max-w-[200px] sm:max-w-[320px] rounded-xl border-2 border-dashed border-white/[0.12] px-6 py-8 text-center"
                            style={{ background: "rgba(255,255,255,0.02)" }}
                        >
                            <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-dashed border-white/[0.1] flex items-center justify-center mx-auto mb-3">
                                <Loader2 className="w-5 h-5 text-pinch-muted/50 animate-spin" />
                            </div>
                            <p className="text-xs font-heading font-semibold text-pinch-muted/50">
                                Nodes will appear here
                            </p>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* ── Pipeline (vertical on mobile, horizontal on desktop) ── */}
            {/* ── Pipeline (vertical on mobile, horizontal on desktop) ── */}
            {!error && (
                <div className="flex flex-col sm:flex-row items-center justify-center sm:overflow-hidden px-4 sm:px-0">
                    {steps.map((step, i) => {
                        const visible = isNodeVisible(i);
                        const isSelected = selectedNode === i;
                        const prevDone = i > 0 && steps[i - 1].status === "done";
                        const nextNodeVisible = i < steps.length - 1 && isNodeVisible(i + 1);

                        return (
                            <div key={i} className="flex flex-col sm:flex-row items-center w-full sm:w-auto">
                                {/* Node — only render when visible */}
                                <AnimatePresence>
                                    {visible && (
                                        <div className="relative w-full sm:w-auto">
                                            <LiquidCard
                                                step={step}
                                                isSelected={isSelected}
                                                onClick={() => setSelectedNode(isSelected ? null : i)}
                                            />

                                            {/* Mobile tooltip bubble — shows below the card on tap */}
                                            <AnimatePresence>
                                                {isSelected && step.summary && (
                                                    <m.div
                                                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="block sm:hidden absolute left-0 right-0 mt-2 z-[100]"
                                                    >
                                                        <div className="flex justify-center mb-0.5">
                                                            <div
                                                                className="w-0 h-0"
                                                                style={{
                                                                    borderLeft: "6px solid transparent",
                                                                    borderRight: "6px solid transparent",
                                                                    borderBottom: "6px solid rgba(15,18,25,0.95)",
                                                                }}
                                                            />
                                                        </div>
                                                        <div
                                                            className="rounded-lg border border-white/[0.08] p-3"
                                                            style={{
                                                                background: "rgba(15,18,25,0.95)",
                                                                backdropFilter: "blur(16px)",
                                                                boxShadow: "0 8px 32px -4px rgba(0,0,0,0.5)",
                                                            }}
                                                        >
                                                            <p className="text-[11px] text-pinch-muted leading-relaxed">
                                                                {step.summary}
                                                            </p>
                                                        </div>
                                                    </m.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </AnimatePresence>

                                {/* Arrow — visible once node is visible */}
                                <AnimatePresence>
                                    {i < steps.length - 1 && isArrowVisible(i) && (
                                        <ArrowConnector
                                            prevDone={step.status === "done"}
                                            nextVisible={nextNodeVisible}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Summary Panel (hidden on error) ───────────────────── */}
            {!error && (
                <AnimatePresence mode="wait">
                    {selectedNode !== null && isNodeVisible(selectedNode) && (
                        <m.div
                            key={selectedNode}
                            initial={{ opacity: 0, y: -8, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -8, height: 0 }}
                            transition={SPRING}
                            className="overflow-hidden hidden sm:block"
                        >
                            <div className="mt-6 max-w-md mx-auto">
                                <div className="flex justify-center mb-1">
                                    <div
                                        className="w-0 h-0"
                                        style={{
                                            borderLeft: "8px solid transparent",
                                            borderRight: "8px solid transparent",
                                            borderBottom: "8px solid rgba(255,255,255,0.06)",
                                        }}
                                    />
                                </div>
                                <div
                                    className="rounded-xl border border-white/[0.06] p-5"
                                    style={{
                                        background: "rgba(255,255,255,0.04)",
                                        backdropFilter: "blur(16px)",
                                        boxShadow: "0 4px 24px -4px rgba(0,0,0,0.25)",
                                    }}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        {(() => {
                                            const Icon = ICONS[steps[selectedNode].icon];
                                            return (
                                                <div className="w-8 h-8 rounded-lg bg-pinch-cyan/10 flex items-center justify-center">
                                                    <Icon className="w-4 h-4 text-pinch-cyan" />
                                                </div>
                                            );
                                        })()}
                                        <h4 className="text-sm font-heading font-semibold text-pinch-text">
                                            {steps[selectedNode].label}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-pinch-muted leading-relaxed">
                                        {steps[selectedNode].summary}
                                    </p>
                                </div>
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>
            )}

            {/* ── While You Wait (hidden on error) ──────────────── */}
            {!error && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="mt-20 sm:mt-12 max-w-2xl mx-auto"
                >
                    <div className="text-center mb-6">
                        <h4 className="text-sm font-heading font-semibold text-pinch-muted">
                            While you wait, learn how it works
                        </h4>
                        <p className="text-xs text-pinch-muted/60 mt-1">
                            {strategy === "semantic"
                                ? "You chose Semantic Chunking — here's what that means"
                                : "You chose Recursive Splitting — here's what that means"
                            }
                        </p>
                    </div>

                    <div className="space-y-3">
                        {(strategy === "semantic" ? LEARN_SEMANTIC : LEARN_RECURSIVE).map((point, i) => (
                            <m.div
                                key={point.label}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + i * 0.15, duration: 0.35 }}
                                className="rounded-xl border border-white/[0.06] p-4"
                                style={{
                                    background: "rgba(255,255,255,0.02)",
                                    backdropFilter: "blur(12px)",
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 w-5 h-5 rounded-md bg-pinch-cyan/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-[10px] font-bold text-pinch-cyan">{i + 1}</span>
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-heading font-semibold text-pinch-text mb-1">
                                            {point.label}
                                        </h5>
                                        <p className="text-[11px] text-pinch-muted leading-relaxed">
                                            {point.text}
                                        </p>
                                    </div>
                                </div>
                            </m.div>
                        ))}
                    </div>
                </m.div>
            )}

            {/* ── Error Placeholder Node ─────────────────────────────────── */}
            <AnimatePresence>
                {error && (
                    <m.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="flex justify-center mt-6"
                    >
                        <div
                            className="w-full max-w-[280px] sm:max-w-[400px] rounded-xl border-2 border-dashed border-red-500/25 px-6 py-6 text-center"
                            style={{ background: "rgba(239,68,68,0.03)" }}
                        >
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-dashed border-red-500/20 flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <p className="text-xs font-heading font-semibold text-red-400 mb-1.5">
                                Something went wrong
                            </p>
                            <p className="text-[11px] text-red-400/70 leading-relaxed">
                                {error}
                            </p>
                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    className="mt-4 px-5 py-2 rounded-lg text-xs font-heading font-semibold text-white bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                                >
                                    Try a different PDF
                                </button>
                            )}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}