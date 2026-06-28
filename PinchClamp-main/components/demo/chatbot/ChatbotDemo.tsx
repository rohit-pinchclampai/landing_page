"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
    Send,
    Bot,
    User,
    Loader2,
    ArrowLeft,
    Check,
    ShieldAlert,
    Sparkles,
    Headset,
    Mail,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import type { PersonaKey } from "@/lib/chatbot-context";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Message {
    role: "user" | "assistant";
    content: string;
}

type DemoState = "chatting" | "lead_capture" | "submitted";

// ─── Email trigger detection ───────────────────────────────────────────────────

const EMAIL_TRIGGER_PHRASES = [
    "drop your work email",
    "provide your email",
    "share your email",
    "leave your email",
    "form that just appeared below",
    "form below",
    "email in the form",
];

function shouldShowEmailCapture(content: string): boolean {
    const lower = content.toLowerCase();
    return EMAIL_TRIGGER_PHRASES.some((phrase) => lower.includes(phrase));
}

// Build context summary from chat history for the lead email
function buildConversationContext(messages: Message[]): string {
    const userMessages = messages
        .filter((m) => m.role === "user")
        .map((m) => m.content);

    if (userMessages.length === 0) return "No conversation context available.";

    const lastFew = userMessages.slice(-5);
    return lastFew.join(" → ");
}

// ─── Markdown Renderer ─────────────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ children }) => (
                    <h1 className="text-lg font-bold text-pinch-text mt-3 mb-1">{children}</h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-base font-bold text-pinch-text mt-3 mb-1">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-sm font-bold text-pinch-text mt-2 mb-1">{children}</h3>
                ),
                p: ({ children }) => (
                    <p className="text-sm leading-relaxed mb-2">{children}</p>
                ),
                ul: ({ children }) => (
                    <ul className="list-disc list-inside text-sm space-y-1 mb-2 ml-1">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal list-inside text-sm space-y-1 mb-2 ml-1">{children}</ol>
                ),
                li: ({ children }) => (
                    <li className="text-sm leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                    <strong className="font-semibold text-pinch-text">{children}</strong>
                ),
                em: ({ children }) => (
                    <em className="text-pinch-cyan/80">{children}</em>
                ),
                blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-pinch-cyan/40 pl-3 my-2 text-pinch-muted text-sm italic">
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
                            <pre className="rounded-lg p-3 my-2 text-xs overflow-x-auto" style={{ background: "var(--overlay-subtle)" }}>
                                <code>{children}</code>
                            </pre>
                        );
                    }
                    return (
                        <code className="rounded px-1.5 py-0.5 text-xs text-pinch-cyan" style={{ background: "var(--overlay-subtle)" }}>
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

// ─── Floating Glass Toggle ─────────────────────────────────────────────────────

function PersonaToggle({
    active,
    onChange,
    disabled,
}: {
    active: PersonaKey;
    onChange: (key: PersonaKey) => void;
    disabled: boolean;
}) {
    return (
        <div
            className="inline-flex rounded-full p-1 backdrop-blur-xl border border-white/10 shadow-lg"
            style={{
                background: "rgba(15, 23, 42, 0.6)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            }}
        >
            {([
                { key: "sales" as PersonaKey, label: "Sales", icon: Sparkles },
                { key: "support" as PersonaKey, label: "Support", icon: Headset },
            ]).map((p) => {
                const Icon = p.icon;
                const isActive = active === p.key;
                return (
                    <button
                        key={p.key}
                        onClick={() => onChange(p.key)}
                        disabled={disabled}
                        className={`
                            relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium
                            transition-all duration-300 cursor-pointer
                            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                            ${isActive ? "text-[#0F172A]" : "text-pinch-muted hover:text-pinch-text"}
                        `}
                    >
                        {isActive && (
                            <m.div
                                layoutId="persona-pill"
                                className="absolute inset-0 rounded-full gradient-arc"
                                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5" />
                            {p.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({
    message,
    isStreaming,
}: {
    message: Message;
    isStreaming?: boolean;
}) {
    const isUser = message.role === "user";

    return (
        <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
        >
            <div
                className={`
                    flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                    ${isUser ? "bg-pinch-cyan/20" : ""}
                `}
                style={!isUser ? { background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255,255,255,0.06)" } : undefined}
            >
                {isUser ? (
                    <User className="w-4 h-4 text-pinch-cyan" />
                ) : (
                    <Bot className="w-4 h-4 text-pinch-cyan" />
                )}
            </div>
            <div
                className={`
                    max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed
                    ${isUser
                        ? "bg-pinch-cyan/10 text-pinch-text border border-pinch-cyan/20"
                        : "text-pinch-text border border-white/[0.06]"
                    }
                `}
                style={!isUser ? { background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(8px)" } : undefined}
            >
                {isUser ? (
                    <p>{message.content}</p>
                ) : (
                    <MarkdownContent content={message.content} />
                )}
                {isStreaming && (
                    <span className="inline-block w-1.5 h-4 bg-pinch-cyan/60 animate-pulse ml-0.5 rounded-full" />
                )}
            </div>
        </m.div>
    );
}

// ─── Inline Email Capture (appears in chat) ────────────────────────────────────

function InlineEmailCapture({
    onSubmit,
    submitted,
    savedName,
    savedCompany,
    savedEmail,
    onFieldChange,
}: {
    onSubmit: (data: { name: string; company: string; email: string }) => void;
    submitted: boolean;
    savedName: string;
    savedCompany: string;
    savedEmail: string;
    onFieldChange: (field: "name" | "company" | "email", value: string) => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!savedEmail || !savedEmail.includes("@") || !savedName.trim()) return;
        setIsSubmitting(true);
        onSubmit({ name: savedName, company: savedCompany, email: savedEmail });
    };

    return (
        <m.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="ml-11"
        >
            <div
                className="rounded-xl border border-white/10 p-4 backdrop-blur-xl max-w-[80%]"
                style={{
                    background: "rgba(15, 23, 42, 0.7)",
                    boxShadow: "0 0 24px -8px hsl(187 80% 48% / 0.12)",
                }}
            >
                {submitted ? (
                    <m.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-8 h-8 rounded-full gradient-arc flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-[#0F172A]" />
                        </div>
                        <p className="text-pinch-text text-sm font-medium">
                            Got it! Our team will be in touch shortly.
                        </p>
                    </m.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-2.5">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-pinch-cyan/50 flex-shrink-0" />
                            <p className="text-pinch-muted text-xs">Drop your details and we&apos;ll reach out</p>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                required
                                value={savedName}
                                onChange={(e) => onFieldChange("name", e.target.value)}
                                placeholder="Your name"
                                className="flex-1 bg-transparent border-b border-white/10 py-1.5 text-sm text-pinch-text transition-all placeholder:text-pinch-muted/40 focus:border-pinch-cyan focus:outline-none"
                            />
                            <input
                                type="text"
                                value={savedCompany}
                                onChange={(e) => onFieldChange("company", e.target.value)}
                                placeholder="Company"
                                className="flex-1 bg-transparent border-b border-white/10 py-1.5 text-sm text-pinch-text transition-all placeholder:text-pinch-muted/40 focus:border-pinch-cyan focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="email"
                                required
                                value={savedEmail}
                                onChange={(e) => onFieldChange("email", e.target.value)}
                                placeholder="you@company.com"
                                className="flex-1 bg-transparent border-b border-white/10 py-1.5 text-sm text-pinch-text transition-all placeholder:text-pinch-muted/40 focus:border-pinch-cyan focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting || !savedEmail.includes("@") || !savedName.trim()}
                                className="btn-primary rounded-full px-4 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    "Send"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </m.div>
    );
}

// ─── Rate Limit Lead Capture ───────────────────────────────────────────────────

function LeadCaptureOverlay({
    onSubmit,
    state,
}: {
    onSubmit: (email: string) => void;
    state: "lead_capture" | "submitted";
}) {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes("@")) return;
        setIsSubmitting(true);
        onSubmit(email);
    };

    return (
        <m.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-xl border border-white/10 p-6 text-center backdrop-blur-xl"
            style={{
                background: "rgba(15, 23, 42, 0.7)",
                boxShadow: "0 0 40px -10px hsl(187 80% 48% / 0.15)",
            }}
        >
            {state === "submitted" ? (
                <m.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex flex-col items-center gap-3 py-4"
                >
                    <div className="w-12 h-12 rounded-full gradient-arc flex items-center justify-center">
                        <Check className="w-6 h-6 text-[#0F172A]" />
                    </div>
                    <p className="text-pinch-text font-heading font-semibold">Request sent!</p>
                    <p className="text-pinch-muted text-sm max-w-xs">
                        Our team will review your request and email you a VIP pass within a few hours.
                    </p>
                </m.div>
            ) : (
                <>
                    <div className="flex justify-center mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <ShieldAlert className="w-5 h-5 text-pinch-orange" />
                        </div>
                    </div>
                    <h3 className="font-heading font-semibold text-pinch-text mb-1">Demo limit reached</h3>
                    <p className="text-pinch-muted text-sm mb-5 max-w-sm mx-auto">
                        Enter your work email to request a 24-hour VIP pass from our team.
                    </p>
                    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-pinch-text transition-all placeholder:text-pinch-muted/40 focus:border-pinch-cyan focus:shadow-[0_0_0_1px_hsl(187_80%_48%/0.3)] focus:outline-none backdrop-blur-sm"
                        />
                        <button type="submit" disabled={isSubmitting} className="btn-primary px-5 py-2.5 whitespace-nowrap">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Pass"}
                        </button>
                    </form>
                </>
            )}
        </m.div>
    );
}

// ─── Auto-expanding Textarea ───────────────────────────────────────────────────

function ExpandingTextarea({
    value,
    onChange,
    onSubmit,
    disabled,
    inputRef,
}: {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    disabled: boolean;
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
    const MAX_HEIGHT = 120; // ~5 lines

    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    }, [value, inputRef]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-pinch-text transition-all placeholder:text-pinch-muted/40 focus:border-pinch-cyan focus:shadow-[0_0_0_1px_hsl(187_80%_48%/0.3)] focus:outline-none disabled:opacity-50 backdrop-blur-sm resize-none overflow-hidden"
            style={{ maxHeight: MAX_HEIGHT }}
        />
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ChatbotDemo() {
    const [persona, setPersona] = useState<PersonaKey>("sales");
    const [messages, setMessages] = useState<Message[]>([]);
    const [demoState, setDemoState] = useState<DemoState>("chatting");
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [emailCaptureSubmitted, setEmailCaptureSubmitted] = useState(false);
    const [savedName, setSavedName] = useState("");
    const [savedCompany, setSavedCompany] = useState("");
    const [savedEmail, setSavedEmail] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingContent]);

    // Focus input
    useEffect(() => {
        if (demoState === "chatting") inputRef.current?.focus();
    }, [demoState, persona]);

    // Persona switch
    const handlePersonaChange = useCallback((key: PersonaKey) => {
        setPersona(key);
        setMessages([]);
        setStreamingContent("");
        setIsStreaming(false);
        setDemoState("chatting");
        setInputValue("");
        setError(null);
        setEmailCaptureSubmitted(false);
        setSavedName("");
        setSavedCompany("");
        setSavedEmail("");
    }, []);

    // Send message
    const handleSendMessage = useCallback(
        async (question: string) => {
            if (!question.trim() || isStreaming) return;

            setMessages((prev) => [...prev, { role: "user", content: question }]);
            setIsStreaming(true);
            setStreamingContent("");
            setError(null);
            setEmailCaptureSubmitted(false);

            try {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        persona,
                        question,
                        chatHistory: messages.slice(-10),
                    }),
                });

                if (res.status === 429) {
                    const data = await res.json();
                    if (data.status === "limit_reached") {
                        setDemoState("lead_capture");
                        setMessages((prev) => prev.slice(0, -1));
                        return;
                    }
                }

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to get response");
                }

                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                let fullContent = "";
                let revealedLen = 0;
                let animFrame = 0;
                const CHARS_PER_FRAME = 12;

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

                setMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : "Failed to get response";
                setError(errMsg);
                setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${errMsg}` }]);
            } finally {
                setIsStreaming(false);
                setStreamingContent("");
            }
        },
        [persona, messages, isStreaming]
    );

    // Inline email capture — sends via EmailJS client-side with conversation context
    const handleInlineEmailCapture = useCallback(
        async (data: { name: string; company: string; email: string }) => {
            try {
                const emailjs = (await import("@emailjs/browser")).default;
                const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
                const templateId = process.env.NEXT_PUBLIC_EMAILJS_CONTACT_TEMPLATE_ID;
                const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

                if (!serviceId || !templateId || !publicKey) {
                    throw new Error("EmailJS not configured");
                }

                const context = buildConversationContext(messages);

                // Determine intent from conversation
                const lastBotMsg = [...messages].reverse().find((m) => m.role === "assistant")?.content || "";
                let intent = "General inquiry";
                if (/demo/i.test(lastBotMsg)) intent = "Requested a demo";
                else if (/call|schedule/i.test(lastBotMsg)) intent = "Wants to schedule a call";
                else if (/escalat|ticket|issue/i.test(lastBotMsg)) intent = "Support escalation";
                else if (/consult/i.test(lastBotMsg)) intent = "Consultation request";

                await emailjs.send(
                    serviceId,
                    templateId,
                    {
                        first_name: data.name,
                        last_name: "",
                        user_email: data.email,
                        company: data.company || "Not specified",
                        message: `📌 Intent: ${intent}\n\n💬 Conversation summary:\n${context}\n\n🤖 Persona: ${persona}`,
                    },
                    { publicKey }
                );

                setEmailCaptureSubmitted(true);
            } catch (err) {
                console.error("Inline email capture error:", err);
                setError("Failed to submit email. Please try again.");
            }
        },
        [messages, persona]
    );

    // VIP email (rate limit bypass)
    const handleVIPRequest = useCallback(
        async (email: string) => {
            try {
                const res = await fetch("/api/request-vip", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, persona }),
                });
                if (!res.ok) throw new Error("Failed to submit request");
                setDemoState("submitted");
            } catch (err) {
                console.error("VIP request error:", err);
                setError("Failed to submit request. Please try again.");
            }
        },
        [persona]
    );

    // Form submit
    const handleSubmit = useCallback(() => {
        if (!inputValue.trim()) return;
        const q = inputValue;
        setInputValue("");
        handleSendMessage(q);
    }, [inputValue, handleSendMessage]);

    // Check if inline email should show after the latest assistant message
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
    const showInlineEmail =
        lastAssistantMsg &&
        shouldShowEmailCapture(lastAssistantMsg.content) &&
        !isStreaming;

    return (
        <div className="flex flex-col h-screen text-pinch-text overflow-hidden">
            {/* ─── Floating Header ──────────────────────────────────────── */}
            <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-pinch-muted hover:text-pinch-cyan transition-colors duration-200 group rounded-full px-4 py-2 backdrop-blur-xl border border-white/10"
                    style={{ background: "rgba(15, 23, 42, 0.6)" }}
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                    <span className="text-sm font-medium">Back</span>
                </Link>

                <PersonaToggle active={persona} onChange={handlePersonaChange} disabled={isStreaming} />

                <div className="w-[88px]" />
            </header>

            {/* ─── Chat Area ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto pt-20 pb-4 px-4 sm:px-6">
                <div className="mx-auto max-w-3xl space-y-4">
                    {/* Empty state */}
                    {messages.length === 0 && !isStreaming && (
                        <m.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center text-center py-32"
                        >
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border border-white/[0.06]"
                                style={{ background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(12px)" }}
                            >
                                <Bot className="w-8 h-8 text-pinch-cyan/50" />
                            </div>
                            <h2 className="font-heading text-xl font-bold mb-2">
                                <span className="gradient-arc-text">AI</span> Chatbot Demo
                            </h2>
                            <p className="text-pinch-muted text-sm max-w-sm leading-relaxed">
                                Ask about our AI services, pricing, tech stack, or anything you&apos;d like to know about PinchClamp AI.
                            </p>
                            <p className="text-pinch-muted/50 text-xs mt-3">
                                Switch between <strong className="text-pinch-text/60">Sales</strong> and <strong className="text-pinch-text/60">Support</strong> personas above
                            </p>
                            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-pinch-cyan animate-pulse" />
                                <span className="text-[10px] text-pinch-muted/60 font-mono">GPT-OSS 20B via Groq</span>
                            </div>
                        </m.div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, i) => (
                        <MessageBubble key={i} message={msg} />
                    ))}

                    {/* Inline email capture — appears after the last message if triggered */}
                    {showInlineEmail && (
                        <InlineEmailCapture
                            onSubmit={handleInlineEmailCapture}
                            submitted={emailCaptureSubmitted}
                            savedName={savedName}
                            savedCompany={savedCompany}
                            savedEmail={savedEmail}
                            onFieldChange={(field, value) => {
                                if (field === "name") setSavedName(value);
                                else if (field === "company") setSavedCompany(value);
                                else if (field === "email") setSavedEmail(value);
                            }}
                        />
                    )}

                    {/* Streaming message */}
                    {isStreaming && streamingContent && (
                        <MessageBubble
                            message={{ role: "assistant", content: streamingContent }}
                            isStreaming
                        />
                    )}

                    {/* Typing indicator */}
                    {isStreaming && !streamingContent && (
                        <m.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3"
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/[0.06]"
                                style={{ background: "rgba(15, 23, 42, 0.5)" }}
                            >
                                <Bot className="w-4 h-4 text-pinch-cyan" />
                            </div>
                            <div
                                className="rounded-xl px-4 py-3 border border-white/[0.06]"
                                style={{ background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(8px)" }}
                            >
                                <div className="flex gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-pinch-cyan/40 animate-pulse" />
                                    <span className="w-2 h-2 rounded-full bg-pinch-cyan/40 animate-pulse [animation-delay:150ms]" />
                                    <span className="w-2 h-2 rounded-full bg-pinch-cyan/40 animate-pulse [animation-delay:300ms]" />
                                </div>
                            </div>
                        </m.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* ─── Input Bar ─────────────────────────────────────────────── */}
            <div className="border-t border-white/[0.06] px-4 sm:px-6 py-4" style={{ background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(16px)" }}>
                <div className="mx-auto max-w-3xl">
                    <AnimatePresence mode="wait">
                        {demoState === "chatting" ? (
                            <m.div
                                key="chat-input"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-end gap-2"
                            >
                                <ExpandingTextarea
                                    value={inputValue}
                                    onChange={setInputValue}
                                    onSubmit={handleSubmit}
                                    disabled={isStreaming}
                                    inputRef={inputRef}
                                />
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isStreaming || !inputValue.trim()}
                                    className="btn-primary rounded-full px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                >
                                    {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </m.div>
                        ) : (
                            <m.div
                                key="lead-capture"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <LeadCaptureOverlay onSubmit={handleVIPRequest} state={demoState} />
                            </m.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {error && (
                            <m.p
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-2 text-center text-xs text-red-400"
                            >
                                {error}
                            </m.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
