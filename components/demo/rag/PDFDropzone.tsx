"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { m, AnimatePresence } from "framer-motion";
import { Upload, FileText, Zap, Brain, ChevronDown } from "lucide-react";

type ChunkStrategy = "recursive" | "semantic";

interface PDFDropzoneProps {
    onSubmit: (file: File, strategy: ChunkStrategy) => void;
    isProcessing: boolean;
}

export default function PDFDropzone({ onSubmit, isProcessing }: PDFDropzoneProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [strategy, setStrategy] = useState<ChunkStrategy>("recursive");
    const [hoveredStrategy, setHoveredStrategy] = useState<ChunkStrategy | null>(null);

    const onDrop = useCallback((accepted: File[]) => {
        if (accepted.length > 0) {
            setSelectedFile(accepted[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        maxSize: 20 * 1024 * 1024, // 20MB
        multiple: false,
        disabled: isProcessing,
    });

    const handleSubmit = () => {
        if (selectedFile && !isProcessing) {
            onSubmit(selectedFile, strategy);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`
          relative rounded-xl border-2 border-dashed p-6 sm:p-10 text-center cursor-pointer
          transition-all duration-300 group
          ${isDragActive
                        ? "border-pinch-cyan bg-pinch-cyan/5 scale-[1.02]"
                        : selectedFile
                            ? "border-pinch-cyan/40 bg-[var(--overlay-subtle)]"
                            : "border-[var(--overlay-border)] bg-[var(--overlay-subtle)] hover:border-pinch-cyan/30 hover:bg-[var(--overlay-hover-light)]"
                    }
          ${isProcessing ? "pointer-events-none opacity-50" : ""}
        `}
            >
                <input {...getInputProps()} />

                <AnimatePresence mode="wait">
                    {selectedFile ? (
                        <m.div
                            key="file-selected"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <div className="w-14 h-14 rounded-xl bg-pinch-cyan/10 flex items-center justify-center">
                                <FileText className="w-7 h-7 text-pinch-cyan" />
                            </div>
                            <div>
                                <p className="font-heading font-semibold text-pinch-text">
                                    {selectedFile.name}
                                </p>
                                <p className="text-sm text-pinch-muted mt-1">
                                    {formatFileSize(selectedFile.size)} • Click or drag to replace
                                </p>
                            </div>
                        </m.div>
                    ) : (
                        <m.div
                            key="dropzone-empty"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <div className="w-14 h-14 rounded-xl bg-[var(--overlay-card)] flex items-center justify-center group-hover:bg-pinch-cyan/10 transition-colors duration-300">
                                <Upload className="w-7 h-7 text-pinch-muted group-hover:text-pinch-cyan transition-colors duration-300" />
                            </div>
                            <div>
                                <p className="font-heading font-semibold text-pinch-text">
                                    {isDragActive ? "Drop your PDF here" : "Upload a PDF document"}
                                </p>
                                <p className="text-sm text-pinch-muted mt-1">
                                    Drag and drop or click to browse • Max 20MB
                                </p>
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Chunking Strategy Selector */}
            <div className="rounded-xl border border-[var(--overlay-border)] bg-[var(--overlay-subtle)] p-5">
                <div className="flex items-center gap-2 mb-4">
                    <ChevronDown className="w-4 h-4 text-pinch-cyan" />
                    <span className="text-sm font-heading font-medium text-pinch-text">
                        Engine Configuration
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Recursive Splitter */}
                    <div className="relative">
                        <button
                            onClick={() => setStrategy("recursive")}
                            onMouseEnter={() => setHoveredStrategy("recursive")}
                            onMouseLeave={() => setHoveredStrategy(null)}
                            disabled={isProcessing}
                            className={`
                                relative w-full rounded-lg border p-4 text-left transition-all duration-300
                                ${strategy === "recursive"
                                    ? "border-pinch-cyan bg-pinch-cyan/5"
                                    : "border-[var(--overlay-border)] bg-transparent hover:border-[var(--overlay-hover)]"
                                }
                            `}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <Zap className={`w-4 h-4 ${strategy === "recursive" ? "text-pinch-cyan" : "text-pinch-muted"}`} />
                                <span className={`text-sm font-heading font-semibold ${strategy === "recursive" ? "text-pinch-text" : "text-pinch-muted"}`}>
                                    Recursive Splitter
                                </span>
                            </div>
                            <p className="text-[11px] text-pinch-muted/70 leading-snug">
                                Best for structured documents.
                            </p>
                            {strategy === "recursive" && (
                                <m.div
                                    layoutId="strategy-indicator"
                                    className="absolute top-3 right-3 w-2 h-2 rounded-full bg-pinch-cyan"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>

                        {/* Tooltip — slides LEFT */}
                        <AnimatePresence>
                            {hoveredStrategy === "recursive" && (
                                <m.div
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 8 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-56 z-50 hidden sm:block"
                                >
                                    <div
                                        className="rounded-lg border border-white/[0.08] p-3"
                                        style={{
                                            background: "rgba(15,18,25,0.95)",
                                            backdropFilter: "blur(16px)",
                                            boxShadow: "0 8px 32px -4px rgba(0,0,0,0.5)",
                                        }}
                                    >
                                        <p className="text-[11px] text-pinch-muted leading-relaxed">
                                            Optimized for syllabi, technical manuals, and reports. Preserves human formatting like bullet points, paragraphs, and lists by splitting text at natural structural boundaries.
                                        </p>
                                    </div>
                                    {/* Arrow pointing right */}
                                    <div
                                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0"
                                        style={{
                                            borderTop: "6px solid transparent",
                                            borderBottom: "6px solid transparent",
                                            borderLeft: "6px solid rgba(15,18,25,0.95)",
                                        }}
                                    />
                                </m.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Semantic Chunker */}
                    <div className="relative">
                        <button
                            onClick={() => setStrategy("semantic")}
                            onMouseEnter={() => setHoveredStrategy("semantic")}
                            onMouseLeave={() => setHoveredStrategy(null)}
                            disabled={isProcessing}
                            className={`
                                relative w-full rounded-lg border p-4 text-left transition-all duration-300
                                ${strategy === "semantic"
                                    ? "border-pinch-cyan bg-pinch-cyan/5"
                                    : "border-[var(--overlay-border)] bg-transparent hover:border-[var(--overlay-hover)]"
                                }
                            `}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <Brain className={`w-4 h-4 ${strategy === "semantic" ? "text-pinch-cyan" : "text-pinch-muted"}`} />
                                <span className={`text-sm font-heading font-semibold ${strategy === "semantic" ? "text-pinch-text" : "text-pinch-muted"}`}>
                                    Semantic Chunker
                                </span>
                            </div>
                            <p className="text-[11px] text-pinch-muted/70 leading-snug">
                                Best for erratic or unstructured text.
                            </p>
                            {strategy === "semantic" && (
                                <m.div
                                    layoutId="strategy-indicator"
                                    className="absolute top-3 right-3 w-2 h-2 rounded-full bg-pinch-cyan"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>

                        {/* Tooltip — slides RIGHT */}
                        <AnimatePresence>
                            {hoveredStrategy === "semantic" && (
                                <m.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-56 z-50 hidden sm:block"
                                >
                                    <div
                                        className="rounded-lg border border-white/[0.08] p-3"
                                        style={{
                                            background: "rgba(15,18,25,0.95)",
                                            backdropFilter: "blur(16px)",
                                            boxShadow: "0 8px 32px -4px rgba(0,0,0,0.5)",
                                        }}
                                    >
                                        <p className="text-[11px] text-pinch-muted leading-relaxed">
                                            Optimized for transcripts, novels, and dense essays. Uses local AI models to mathematically detect topic shifts and slice paragraphs exactly where the context changes. Note: CPU intensive.
                                        </p>
                                    </div>
                                    {/* Arrow pointing left */}
                                    <div
                                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-0 h-0"
                                        style={{
                                            borderTop: "6px solid transparent",
                                            borderBottom: "6px solid transparent",
                                            borderRight: "6px solid rgba(15,18,25,0.95)",
                                        }}
                                    />
                                </m.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <m.button
                onClick={handleSubmit}
                disabled={!selectedFile || isProcessing}
                className={`
          w-full py-3 sm:py-3.5 rounded-xl font-heading font-semibold text-sm tracking-wide
          transition-all duration-300
          ${selectedFile && !isProcessing
                        ? "btn-primary justify-center"
                        : "bg-[var(--overlay-card)] text-pinch-muted cursor-not-allowed border border-[var(--overlay-border)]"
                    }
        `}
                whileHover={selectedFile && !isProcessing ? { scale: 1.01 } : {}}
                whileTap={selectedFile && !isProcessing ? { scale: 0.99 } : {}}
            >
                {isProcessing ? "Processing..." : "Start RAG Engine"}
            </m.button>
        </div>
    );
}
