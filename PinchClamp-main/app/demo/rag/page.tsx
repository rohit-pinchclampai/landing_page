"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import PDFDropzone from "@/components/demo/rag/PDFDropzone";
import ProcessingTimeline, { type TimelineStep, MIN_STEP_DISPLAY_MS } from "@/components/demo/rag/ProcessingTimeline";
import ChatInterface from "@/components/demo/rag/ChatInterface";

type Stage = "upload" | "processing" | "chat";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const STEP_SUMMARIES = [
    "Mozilla PDF.js parses the binary PDF and extracts raw text content from every page.",
    "Transformers.js downloads the 23MB ONNX model weights into browser IndexedDB cache.",
    "Text is split into overlapping chunks optimized for embedding context windows.",
    "Each chunk is run through the MiniLM-L6-v2 neural network to produce a 384-dimensional vector.",
    "Vectors and metadata are pushed to a Pinecone HNSW index for approximate nearest-neighbor search.",
];

const SEMANTIC_CHUNK_SUMMARY =
    "Each sentence is embedded and cosine similarity is measured between consecutive pairs. When similarity drops below the threshold, a new chunk boundary is created — producing semantically coherent segments.";

const STEP_ICONS: TimelineStep["icon"][] = ["extract", "model", "chunk", "embed", "upsert"];

function makeSteps(labels: string[], strategy: "recursive" | "semantic" = "recursive", statuses?: TimelineStep["status"][], progresses?: number[]): TimelineStep[] {
    return labels.map((label, i) => ({
        label,
        status: statuses?.[i] || "pending",
        progress: progresses?.[i] || 0,
        summary: i === 2 && strategy === "semantic" ? SEMANTIC_CHUNK_SUMMARY : STEP_SUMMARIES[i],
        icon: STEP_ICONS[i],
    }));
}

const INITIAL_LABELS = [
    "Extracting text...",
    "Loading MiniLM-L6-v2...",
    "Chunking...",
    "Generating 384D vectors...",
    "Upserting to Pinecone...",
];

function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

export default function RAGDemoPage() {
    const [stage, setStage] = useState<Stage>("upload");
    const [steps, setSteps] = useState<TimelineStep[]>(makeSteps(INITIAL_LABELS));
    const [error, setError] = useState<string | null>(null);
    const [activeStrategy, setActiveStrategy] = useState<"recursive" | "semantic">("recursive");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");

    const workerRef = useRef<Worker | null>(null);

    // ─── Get or create worker ──────────────────────────────────────────────────
    const getWorker = useCallback(() => {
        if (!workerRef.current) {
            workerRef.current = new Worker("/rag-worker.js", { type: "module" });
        }
        return workerRef.current;
    }, []);

    const updateStep = useCallback((stepIndex: number, status: TimelineStep["status"], label?: string, progress?: number) => {
        setSteps((prev) =>
            prev.map((s, i) => {
                if (i === stepIndex) return {
                    ...s,
                    status,
                    label: label || s.label,
                    progress: progress ?? (status === "done" ? 100 : s.progress),
                };
                return s;
            })
        );
    }, []);

    // ─── Phase 1: Process PDF ──────────────────────────────────────────────────
    const handleSubmit = useCallback(
        async (file: File, strategy: "recursive" | "semantic") => {
            setStage("processing");
            setError(null);
            setActiveStrategy(strategy);

            // Reset steps with correct strategy label
            const strategyLabel =
                strategy === "semantic"
                    ? "Semantic Chunking..."
                    : "Recursive Splitter...";

            const labels = [
                "Extracting text...",
                "Loading MiniLM-L6-v2...",
                strategyLabel,
                "Generating 384D vectors...",
                "Upserting to Pinecone...",
            ];
            setSteps(makeSteps(labels, strategy));

            const worker = getWorker();
            const fileBuffer = await file.arrayBuffer();

            // Track which step was last active so we only delay on step *transitions*
            let lastActiveStep = 0;
            let stepStartTime = Date.now();

            // Listen for worker messages
            worker.onmessage = async (e) => {
                const { type, step, label, payload, error: workerError } = e.data;

                if (type === "STATUS") {
                    // Parse progress from labels like "(5/20)"
                    let parsedProgress = 0;
                    const match = label?.match(/\((\d+)\/(\d+)\)/);
                    if (match) {
                        parsedProgress = Math.round((parseInt(match[1]) / parseInt(match[2])) * 100);
                    }

                    // Only delay when transitioning to a NEW step
                    if (step !== lastActiveStep) {
                        const elapsed = Date.now() - stepStartTime;
                        if (elapsed < MIN_STEP_DISPLAY_MS) {
                            await delay(MIN_STEP_DISPLAY_MS - elapsed);
                        }
                        stepStartTime = Date.now();
                        lastActiveStep = step;
                    }

                    setSteps((prev) =>
                        prev.map((s, i) => {
                            if (i < step - 1) return { ...s, status: "done", progress: 100 };
                            if (i === step - 1) {
                                if (match) {
                                    // Steps with (n/m) in label use parsed progress
                                    return { ...s, status: "active", label: label || s.label, progress: parsedProgress };
                                }
                                // Steps without granular progress: simulate gradual fill
                                // Ramps quickly to ~80% then slows down, caps at 90%
                                const elapsed = Date.now() - stepStartTime;
                                const simulated = Math.min(90, Math.round(80 * (1 - Math.exp(-elapsed / 2000))));
                                return { ...s, status: "active", label: label || s.label, progress: simulated || 5 };
                            }
                            return s;
                        })
                    );
                }

                if (type === "CHUNKS_READY") {
                    // Ensure step 4 animates before transitioning
                    const elapsed = Date.now() - stepStartTime;
                    if (elapsed < MIN_STEP_DISPLAY_MS) {
                        await delay(MIN_STEP_DISPLAY_MS - elapsed);
                    }

                    // Mark step 4 as done
                    updateStep(3, "done");

                    // Step 5: Upsert to Pinecone (client-side batching for progress)
                    updateStep(4, "active", "Upserting to Pinecone...", 0);

                    try {
                        const vectors = payload.chunks.map(
                            (chunk: { text: string; vector: number[] }, idx: number) => ({
                                id: `chunk-${idx}`,
                                values: chunk.vector,
                                metadata: { text: chunk.text },
                            })
                        );

                        // Batch upsert with progress
                        const BATCH_SIZE = 100;
                        const totalBatches = Math.ceil(vectors.length / BATCH_SIZE);

                        for (let b = 0; b < totalBatches; b++) {
                            const batch = vectors.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
                            updateStep(4, "active", `Upserting (${b + 1}/${totalBatches})...`, Math.round(((b + 1) / totalBatches) * 100));

                            const res = await fetch("/api/pinecone-upsert", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ vectors: batch, isFirstBatch: b === 0 }),
                            });

                            if (!res.ok) {
                                const data = await res.json();
                                throw new Error(data.error || "Failed to upsert vectors");
                            }
                        }

                        updateStep(4, "done");

                        // Transition to chat
                        setTimeout(() => setStage("chat"), 800);
                    } catch (err) {
                        setError(
                            err instanceof Error ? err.message : "Failed to push vectors to Pinecone"
                        );
                        updateStep(4, "pending");
                    }
                }

                if (type === "ERROR") {
                    setError(workerError);
                }
            };

            worker.onerror = (err) => {
                setError(`Worker error: ${err.message}`);
            };

            // Start processing
            worker.postMessage({
                type: "PROCESS_PDF",
                payload: { fileBuffer, strategy },
            });
        },
        [getWorker, updateStep]
    );

    // ─── Phase 3: Send chat message ────────────────────────────────────────────
    const handleSendMessage = useCallback(
        async (question: string) => {
            // Add user message
            setMessages((prev) => [...prev, { role: "user", content: question }]);
            setIsStreaming(true);
            setStreamingContent("");

            try {
                // Rewrite follow-up questions into standalone queries for better retrieval
                let searchQuery = question;
                if (messages.length > 0) {
                    try {
                        const rewriteRes = await fetch("/api/rewrite-query", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                question,
                                chatHistory: messages.slice(-4),
                            }),
                        });
                        if (rewriteRes.ok) {
                            const { rewritten } = await rewriteRes.json();
                            if (rewritten) searchQuery = rewritten;
                        }
                    } catch {
                        // Fallback: use original question
                    }
                }

                // Embed the (potentially rewritten) query in the worker
                const worker = getWorker();

                const queryVector = await new Promise<number[]>((resolve, reject) => {
                    const handler = (e: MessageEvent) => {
                        if (e.data.type === "QUERY_VECTOR") {
                            worker.removeEventListener("message", handler);
                            resolve(e.data.payload.vector);
                        }
                        if (e.data.type === "ERROR") {
                            worker.removeEventListener("message", handler);
                            reject(new Error(e.data.error));
                        }
                    };
                    worker.addEventListener("message", handler);
                    worker.postMessage({ type: "EMBED_QUERY", payload: { text: searchQuery } });
                });

                // Send to RAG chat API
                const res = await fetch("/api/rag-chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        queryVector,
                        question,
                        chatHistory: messages.slice(-10),
                    }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to get response");
                }

                // Stream with smooth character-by-character reveal
                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                let fullContent = "";
                let revealedLen = 0;
                let animFrame = 0;
                const CHARS_PER_FRAME = 15;

                const reveal = () => {
                    if (revealedLen < fullContent.length) {
                        revealedLen = Math.min(revealedLen + CHARS_PER_FRAME, fullContent.length);
                        setStreamingContent(fullContent.slice(0, revealedLen));
                        animFrame = requestAnimationFrame(reveal);
                    }
                };

                if (reader) {
                    animFrame = requestAnimationFrame(reveal);
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        fullContent += decoder.decode(value, { stream: true });
                    }
                    cancelAnimationFrame(animFrame);

                    // Flush remaining buffer smoothly
                    await new Promise<void>((resolve) => {
                        const flush = () => {
                            if (revealedLen < fullContent.length) {
                                revealedLen = Math.min(revealedLen + CHARS_PER_FRAME, fullContent.length);
                                setStreamingContent(fullContent.slice(0, revealedLen));
                                requestAnimationFrame(flush);
                            } else {
                                resolve();
                            }
                        };
                        flush();
                    });
                }

                // Add assistant message
                setMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);
            } catch (err) {
                const errMsg =
                    err instanceof Error ? err.message : "Failed to get response";
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: `Error: ${errMsg}` },
                ]);
            } finally {
                setIsStreaming(false);
                setStreamingContent("");
            }
        },
        [getWorker, messages]
    );

    return (
        <div className="min-h-screen text-pinch-text">
            {/* Header */}
            <header className="border-b border-[var(--overlay-border)] bg-pinch-bg/80 backdrop-blur-md sticky top-0 z-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center h-16 gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-pinch-muted hover:text-pinch-cyan transition-colors duration-200 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                        <span className="text-sm font-medium">Back</span>
                    </Link>

                    <div className="h-5 w-px bg-[var(--overlay-border)]" />

                    <div>
                        <h1 className="font-heading text-lg font-bold">
                            <span className="gradient-arc-text">RAG</span> Chatbot
                        </h1>
                        <p className="text-xs text-pinch-muted -mt-0.5 hidden sm:block">
                            Based on your documents
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <AnimatePresence mode="wait">
                    {/* Upload Stage */}
                    {stage === "upload" && (
                        <m.div
                            key="upload"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >

                            <PDFDropzone onSubmit={handleSubmit} isProcessing={false} />
                        </m.div>
                    )}

                    {/* Processing Stage */}
                    {stage === "processing" && (
                        <m.div
                            key="processing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ProcessingTimeline steps={steps} error={error} strategy={activeStrategy} onRetry={() => setStage("upload")} />
                        </m.div>
                    )}

                    {/* Chat Stage */}
                    {stage === "chat" && (
                        <m.div
                            key="chat"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChatInterface
                                onSendMessage={handleSendMessage}
                                onBack={() => {
                                    setStage("upload");
                                    setMessages([]);
                                    setIsStreaming(false);
                                    setStreamingContent("");
                                }}
                                messages={messages}
                                isStreaming={isStreaming}
                                streamingContent={streamingContent}
                            />
                        </m.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
