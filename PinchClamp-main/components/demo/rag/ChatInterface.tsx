"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ChatInterfaceProps {
    onSendMessage: (question: string) => Promise<void>;
    onBack: () => void;
    messages: Message[];
    isStreaming: boolean;
    streamingContent: string;
}

/* ─── Markdown Renderer ────────────────────────────────────────────────────── */

function MarkdownContent({ content }: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ children }) => (
                    <h1 className="text-base font-heading font-bold text-pinch-text mt-3 mb-1.5">{children}</h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-sm font-heading font-bold text-pinch-text mt-2.5 mb-1">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-sm font-heading font-semibold text-pinch-text mt-2 mb-1">{children}</h3>
                ),
                p: ({ children }) => (
                    <p className="text-sm text-pinch-text leading-relaxed mb-2 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5">{children}</ol>
                ),
                li: ({ children }) => (
                    <li className="text-sm text-pinch-text leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                    <strong className="font-semibold text-pinch-text">{children}</strong>
                ),
                em: ({ children }) => (
                    <em className="italic text-pinch-muted">{children}</em>
                ),
                blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-pinch-cyan/30 pl-3 my-2 text-pinch-muted italic text-sm">
                        {children}
                    </blockquote>
                ),
                hr: () => (
                    <hr className="border-white/[0.06] my-3" />
                ),
                table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-lg border border-white/[0.08]">
                        <table className="w-full text-xs">{children}</table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead className="bg-white/[0.04]">{children}</thead>
                ),
                th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-xs font-semibold text-pinch-cyan border-b border-white/[0.08] whitespace-nowrap">{children}</th>
                ),
                td: ({ children }) => (
                    <td className="px-3 py-2 text-pinch-text/80 border-b border-white/[0.05] align-top">{children}</td>
                ),
                code: ({ children, className }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                        return (
                            <pre className="bg-black/30 rounded-lg p-3 my-2 overflow-x-auto">
                                <code className="text-xs text-pinch-text font-mono">{children}</code>
                            </pre>
                        );
                    }
                    return (
                        <code className="bg-white/[0.06] rounded px-1.5 py-0.5 text-xs font-mono text-pinch-cyan">
                            {children}
                        </code>
                    );
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

export default function ChatInterface({
    onSendMessage,
    onBack,
    messages,
    isStreaming,
    streamingContent,
}: ChatInterfaceProps) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingContent, scrollToBottom]);

    useEffect(() => {
        if (!isStreaming) inputRef.current?.focus();
    }, [isStreaming]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const question = input.trim();
        if (!question || isStreaming) return;
        setInput("");
        await onSendMessage(question);
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* ── Card Window ──────────────────────────────────────────── */}
            <div
                className="rounded-2xl border border-white/[0.06] flex flex-col"
                style={{
                    background: "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    boxShadow: "0 8px 40px -8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
                    height: "calc(100vh - 180px)",
                    minHeight: "400px",
                }}
            >
                {/* ── Header ───────────────────────────────────────────── */}
                <div
                    className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                >
                    <button
                        onClick={onBack}
                        className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors flex-shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 text-pinch-muted" />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-pinch-cyan/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-pinch-cyan" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-heading text-sm font-semibold text-pinch-text truncate">
                            Document Assistant
                        </h3>
                        <p className="text-[11px] text-pinch-muted/70 truncate">
                            GPT-OSS 20B via Groq
                        </p>
                    </div>
                </div>

                {/* ── Messages ─────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
                    {/* Welcome */}
                    {messages.length === 0 && !isStreaming && (
                        <m.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-pinch-cyan/10 flex items-center justify-center mx-auto mb-4">
                                <Bot className="w-8 h-8 text-pinch-cyan" />
                            </div>
                            <h4 className="font-heading text-lg font-semibold text-pinch-text mb-2">
                                Your document is ready
                            </h4>
                            <p className="text-sm text-pinch-muted max-w-md mx-auto">
                                The vector database has been primed with your document.
                                Ask any question and I&apos;ll retrieve the most relevant context to answer it.
                            </p>
                        </m.div>
                    )}

                    {/* Message bubbles */}
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            <m.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-pinch-cyan/10 flex items-center justify-center mt-1">
                                        <Bot className="w-4 h-4 text-pinch-cyan" />
                                    </div>
                                )}
                                <div
                                    className={`
                                        max-w-[80%] rounded-xl px-4 py-3
                                        ${msg.role === "user"
                                            ? "bg-pinch-cyan/10 text-pinch-text border border-pinch-cyan/20"
                                            : "bg-white/[0.03] text-pinch-text border border-white/[0.06]"
                                        }
                                    `}
                                >
                                    {msg.role === "assistant" ? (
                                        <MarkdownContent content={msg.content} />
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    )}
                                </div>
                                {msg.role === "user" && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center mt-1 border border-white/[0.06]">
                                        <User className="w-4 h-4 text-pinch-muted" />
                                    </div>
                                )}
                            </m.div>
                        ))}
                    </AnimatePresence>

                    {/* Streaming response */}
                    {isStreaming && (
                        <m.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3 justify-start"
                        >
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-pinch-cyan/10 flex items-center justify-center mt-1">
                                <Bot className="w-4 h-4 text-pinch-cyan" />
                            </div>
                            <div className="max-w-[80%] rounded-xl px-4 py-3 bg-white/[0.03] text-pinch-text border border-white/[0.06]">
                                {streamingContent ? (
                                    <div>
                                        <MarkdownContent content={streamingContent} />
                                        <span className="inline-block w-0.5 h-4 bg-pinch-cyan animate-pulse align-middle" />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-pinch-muted">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span className="text-sm">Thinking...</span>
                                    </div>
                                )}
                            </div>
                        </m.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* ── Input Bar ────────────────────────────────────────── */}
                <div className="px-5 pb-4 pt-2">
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 transition-colors focus-within:border-pinch-cyan/30"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your document..."
                            disabled={isStreaming}
                            className="flex-1 bg-transparent text-sm text-pinch-text placeholder:text-pinch-muted/50 outline-none px-2 py-1.5 font-sans disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isStreaming}
                            className={`
                                w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0
                                ${input.trim() && !isStreaming
                                    ? "bg-pinch-cyan text-pinch-bg hover:bg-pinch-cyan/80"
                                    : "bg-white/[0.04] text-pinch-muted cursor-not-allowed"
                                }
                            `}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
