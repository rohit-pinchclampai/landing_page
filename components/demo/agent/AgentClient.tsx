"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    Brain,
    Search,
    FileText,
    Cpu,
    PenTool,
    AlertTriangle,
    Play,
    Pause,
    Send,
    Sparkles,
    X,
    CheckCircle,
    Loader2,
    Database,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
    ReactFlow,
    Background,
    Controls,
    Handle,
    Position,
    NodeProps,
    Edge,
    Node,
    useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LogEntry {
    step: string;
    tool?: string;
    input?: string;
    message?: string;
    summary?: string;
}

interface StoredSession {
    prompt: string;
    logs: LogEntry[];
    report: string;
    createdAt: string;
}

type AgentStatus = "idle" | "loading" | "running" | "done" | "error" | "replay";

// ─── Preset Examples ───────────────────────────────────────────────────────────

const PRESETS = [
    {
        label: "Real Estate CRM",
        prompt: "My company is a new CRM for real estate agents. Run a competitive analysis.",
    },
    {
        label: "B2B E-commerce Platform",
        prompt: "We are building a highly customizable B2B e-commerce platform for wholesale distributors. Analyze our competitive landscape.",
    },
    {
        label: "Specialty Coffee Marketplace",
        prompt: "We run a direct-to-consumer online marketplace where independent specialty coffee roasters sell beans directly to consumers (similar to Trade Coffee or Driftaway). Analyze our direct competitors — other D2C coffee subscription/marketplace platforms.",
    },
];

// ─── Step Icon Mapping ─────────────────────────────────────────────────────────

function StepIcon({ step, className }: { step: string; className?: string }) {
    const cls = className || "w-4 h-4";
    switch (step) {
        case "thinking":
            return <Brain className={cls} />;
        case "tool_call":
            return <Search className={cls} />;
        case "tool_result":
            return <FileText className={cls} />;
        case "worker":
            return <Cpu className={cls} />;
        case "kill_switch":
            return <AlertTriangle className={cls} />;
        default:
            return <PenTool className={cls} />;
    }
}

function stepColor(step: string): string {
    switch (step) {
        case "thinking":
            return "text-pinch-cyan";
        case "tool_call":
            return "text-pinch-blue-2";
        case "tool_result":
            return "text-emerald-400";
        case "worker":
            return "text-pinch-orange";
        case "kill_switch":
            return "text-red-400";
        default:
            return "text-pinch-muted";
    }
}

function stepLabel(entry: LogEntry): string {
    if (entry.message) return entry.message;
    if (entry.summary) return entry.summary;
    return entry.step;
}

// ─── Custom React Flow Node ────────────────────────────────────────────────────

function AgentStepNode({ data }: NodeProps) {
    const isProcessing = data.isProcessing as boolean;
    const step = data.step as string;
    const label = data.label as string;

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-sm backdrop-blur-md transition-all ${isProcessing
                ? "border-pinch-cyan bg-pinch-cyan/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                : "border-[var(--overlay-border)] bg-[var(--overlay-subtle)]"
                }`}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-2 !h-2 !bg-pinch-muted !border-none"
            />

            {/* Icon */}
            <div className={`flex-shrink-0 ${stepColor(step)}`}>
                <StepIcon step={step} className="w-5 h-5" />
            </div>

            {/* Label */}
            <div className="flex flex-col min-w-[140px] max-w-[280px]">
                <span className="text-xs font-semibold text-pinch-muted uppercase tracking-wider mb-0.5">
                    {step}
                </span>
                <span className="text-sm font-medium text-pinch-text leading-snug w-full break-words whitespace-normal">
                    {label}
                </span>
            </div>

            {/* Active Indicator */}
            {isProcessing && (
                <div className="flex-shrink-0 ml-2">
                    <span className="block w-2.5 h-2.5 rounded-full bg-pinch-cyan animate-pulse" />
                </div>
            )}

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-2 !h-2 !bg-pinch-muted !border-none"
            />
        </div>
    );
}

const nodeTypes = {
    agentStep: AgentStepNode,
};

// ─── Auto-Centering Logic ──────────────────────────────────────────────────────

function AutoCenterGraph({ nodes }: { nodes: Node[] }) {
    const { setCenter } = useReactFlow();

    useEffect(() => {
        if (nodes.length === 0) return;

        // Current active node is the LAST one in the `nodes` array
        const activeNode = nodes[nodes.length - 1];

        // Center directly on active node
        const midX = activeNode.position.x + 150;
        const midY = activeNode.position.y + 50;

        setCenter(midX, midY, { zoom: 1, duration: 800 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes.length, setCenter]);

    return null;
}

// ─── Step Details Dictionary ───────────────────────────────────────────────────

const STEP_DETAILS: Record<string, { title: string; description: string }> = {
    thinking: {
        title: "Strategic Analysis",
        description: "The agent is interpreting your prompt, identifying key market segments, and forming a research strategy to uncover competitive insights.",
    },
    tool_call: {
        title: "Executing Search Query",
        description: "The agent is actively querying the web using targeted search parameters to find relevant competitors, industry reports, or pricing data.",
    },
    tool_result: {
        title: "Ingesting Data",
        description: "The agent has retrieved information from the web or scraped a specific competitor's website, and is currently parsing the raw data.",
    },
    worker: {
        title: "Data Extraction Worker",
        description: "A specialized sub-agent is filtering the raw scraped data, extracting only hard facts (core features, target audience, pricing) and removing marketing fluff.",
    },
    kill_switch: {
        title: "Forced Synthesis",
        description: "The agent has reached its maximum allowed actions and is now forced to synthesize a final report based on the data gathered so far.",
    },
    synthesis: {
        title: "Drafting Final Report",
        description: "The agent is compiling all gathered intelligence into a cohesive, structured competitive analysis report.",
    }
};

// ─── Markdown Renderer (matches chatbot pattern) ───────────────────────────────

function MarkdownContent({ content }: { content: string }) {
    // Sanitize: some models return literal \n instead of real newlines
    const sanitized = content.replace(/\\n/g, "\n");

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ children }) => (
                    <h1 className="text-2xl font-bold font-heading gradient-arc-text mt-1 mb-3">{children}</h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-lg font-bold font-heading text-pinch-cyan mt-6 mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-base font-bold font-heading text-pinch-text mt-4 mb-1.5">{children}</h3>
                ),
                p: ({ children }) => (
                    <p className="text-sm leading-relaxed text-pinch-text/85 mb-3">{children}</p>
                ),
                ul: ({ children }) => (
                    <ul className="list-disc list-inside text-sm space-y-1.5 mb-3 ml-1">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal list-inside text-sm space-y-1.5 mb-3 ml-1">{children}</ol>
                ),
                li: ({ children }) => (
                    <li className="text-sm leading-relaxed text-pinch-text/80">{children}</li>
                ),
                strong: ({ children }) => (
                    <strong className="font-semibold text-pinch-text">{children}</strong>
                ),
                em: ({ children }) => (
                    <em className="text-pinch-cyan/80">{children}</em>
                ),
                a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-pinch-blue-2 underline underline-offset-2 hover:text-pinch-cyan transition-colors">
                        {children}
                    </a>
                ),
                blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-pinch-cyan/40 pl-3 my-3 text-pinch-muted text-sm italic">
                        {children}
                    </blockquote>
                ),
                hr: () => (
                    <hr className="border-[var(--overlay-border)] my-5" />
                ),
                table: ({ children }) => (
                    <div className="overflow-x-auto my-4 rounded-lg border border-[var(--overlay-border)]">
                        <table className="w-full text-sm">{children}</table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead style={{ background: "var(--overlay-subtle)" }}>{children}</thead>
                ),
                th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-xs font-semibold text-pinch-cyan border-b border-[var(--overlay-border)]">{children}</th>
                ),
                td: ({ children }) => (
                    <td className="px-3 py-2 text-pinch-text/80 border-b border-[var(--overlay-border)]">{children}</td>
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
            {sanitized}
        </ReactMarkdown>
    );
}

// ─── EmailJS Config ────────────────────────────────────────────────────────────

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_CONTACT_TEMPLATE_ID!;
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

// ─── Markdown Renderer (matches chatbot pattern) ───────────────────────────────

export default function AgentClient() {
    const router = useRouter();
    const [status, setStatus] = useState<AgentStatus>("idle");
    const [prompt, setPrompt] = useState("");

    // UI states (animate slowly)
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [report, setReport] = useState("");

    // Raw states (ingest quickly)
    const [rawLogs, setRawLogs] = useState<LogEntry[]>([]);
    const [rawReport, setRawReport] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [storedSession, setStoredSession] = useState<StoredSession | null>(null);

    // Limit modal state
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [contactData, setContactData] = useState({ email: "", company: "" });
    const [contactSubmitting, setContactSubmitting] = useState(false);
    const [contactSubmitted, setContactSubmitted] = useState(false);

    const logEndRef = useRef<HTMLDivElement>(null);
    const reportRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Node Panel state
    const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null);

    // Replay pause state
    const [replayPaused, setReplayPaused] = useState(false);

    // ─── Check for existing session on mount ───────────────────────────────

    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/agent/session");
                if (res.ok) {
                    const data = await res.json();
                    const hasUses = (data.usesRemaining ?? 0) > 0;

                    if (data.exists && data.session && !hasUses) {
                        // No uses remaining — enter replay mode
                        setStoredSession(data.session);
                        setStatus("replay");
                        return;
                    }
                    // Has uses remaining — show live input
                }
            } catch {
                // Ignore session check errors
            }
            setStatus("idle");
        }
        checkSession();
    }, []);

    // ─── Queue Processors for Animation ───────────────────────────────────────────

    // Animate logs slowly
    useEffect(() => {
        if (replayPaused) return;
        if (rawLogs.length > logs.length) {
            const delay = logs.length === 0 ? 500 : 1800; // 1.8s per step
            const timer = setTimeout(() => {
                setLogs((prev) => [...prev, rawLogs[logs.length]]);
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [rawLogs, logs.length, replayPaused]);

    // Animate report sequentially after logs
    useEffect(() => {
        if (replayPaused) return;
        // Only start showing report once ALL known rawLogs are synced
        if (rawLogs.length > 0 && rawLogs.length === logs.length) {
            if (rawReport.length > report.length) {
                const timer = setTimeout(() => {
                    const chunkSize = 25; // Speed of typewriting
                    setReport(rawReport.slice(0, report.length + chunkSize));
                }, 16);
                return () => clearTimeout(timer);
            }
        }
    }, [rawLogs.length, logs.length, rawReport, report.length, replayPaused]);

    // ─── Graph data derivation (Scatter logic) ────────────────────────────────────
    const isReportFinished = report.length > 0 && report.length === rawReport.length;

    const nodes: Node[] = logs.map((log, index) => {
        // Create an organic "go down and then a little back" snaking pattern
        const xOffset = index * 260;
        const yOffset = (index % 2 === 0 ? 1 : -1) * (100 + (index % 3) * 40);

        return {
            id: `node-${index}`,
            type: "agentStep",
            position: { x: xOffset, y: 300 + yOffset },
            data: {
                step: log.step,
                label: stepLabel(log),
                isProcessing: (status === "running" || status === "replay") && index === logs.length - 1 && !isReportFinished,
                logIndex: index,
            },
        };
    });

    const edges: Edge[] = logs.slice(0, -1).map((_, index) => ({
        id: `edge-${index}-${index + 1}`,
        source: `node-${index}`,
        target: `node-${index + 1}`,
        type: "smoothstep",
        animated: (status === "running" || status === "replay") && index === logs.length - 2 && !isReportFinished, // Animate the edge leading into the active node
        style: { stroke: "var(--overlay-border)", strokeWidth: 2 },
    }));

    // ─── SSE Parser: Live Agent Run ────────────────────────────────────────

    const runAgent = useCallback(async (userPrompt: string) => {
        setStatus("running");
        setRawLogs([]);
        setRawReport("");
        setLogs([]);
        setReport("");
        setError(null);

        const abort = new AbortController();
        abortRef.current = abort;

        try {
            const res = await fetch("/api/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userPrompt }),
                signal: abort.signal,
            });

            // Handle 409 — already used (limit reached)
            if (res.status === 409) {
                const data = await res.json();
                if (data.session) {
                    setStoredSession(typeof data.session === "string" ? JSON.parse(data.session) : data.session);
                }
                setStatus("idle");
                setShowLimitModal(true);
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Agent failed to start.");
                setStatus("error");
                return;
            }

            // Parse SSE stream
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            if (!reader) {
                setError("No stream available.");
                setStatus("error");
                return;
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse complete SSE events from buffer
                const lines = buffer.split("\n");
                buffer = "";

                let currentEvent = "";
                for (const line of lines) {
                    if (line.startsWith("event: ")) {
                        currentEvent = line.slice(7).trim();
                    } else if (line.startsWith("data: ")) {
                        const jsonStr = line.slice(6);
                        try {
                            const data = JSON.parse(jsonStr);

                            if (currentEvent === "status") {
                                setRawLogs((prev) => [...prev, data as LogEntry]);
                            } else if (currentEvent === "token") {
                                setRawReport((prev) => prev + (data.content || ""));
                            } else if (currentEvent === "error") {
                                setError(data.message || "An error occurred.");
                                setStatus("error");
                                return;
                            } else if (currentEvent === "done") {
                                setStatus("done");
                            }
                        } catch {
                            // Incomplete JSON, push back to buffer
                            buffer = line + "\n";
                        }
                        currentEvent = "";
                    } else if (line !== "") {
                        // Incomplete line, push to buffer
                        buffer += line + "\n";
                    }
                }
            }

            if (status !== "error") {
                setStatus("done");
            }
        } catch (err) {
            if ((err as Error).name === "AbortError") return;
            setError(err instanceof Error ? err.message : "Connection lost.");
            setStatus("error");
        }
    }, [status]);

    // ─── Replay: Animate stored logs ───────────────────────────────────────

    const runReplay = useCallback(() => {
        if (!storedSession && rawLogs.length === 0) return;

        if (storedSession) {
            setRawLogs(storedSession.logs);
            setRawReport(storedSession.report);
            setPrompt(storedSession.prompt);
        }

        setSelectedLogIndex(null);
        setLogs([]);
        setReport("");
        setReplayPaused(false);
        setStatus("replay");
    }, [storedSession, rawLogs.length]);

    // ─── Limit Handlers ────────────────────────────────────────────────────

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setContactSubmitting(true);
        try {
            const emailjs = (await import("@emailjs/browser")).default;
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                {
                    first_name: "Agent Limit Reached",
                    last_name: "",
                    user_email: contactData.email,
                    company: contactData.company || "Not specified",
                    message: `[Agent Demo Limit Reached]\n\nThe user reached the Agent Demo limit and is requesting an extended demo.`,
                },
                { publicKey: EMAILJS_PUBLIC_KEY }
            );
            setContactSubmitted(true);
        } catch (err) {
            console.error("EmailJS error:", err);
        } finally {
            setContactSubmitting(false);
        }
    };

    const handleViewPrevious = () => {
        if (!storedSession) return;
        setRawLogs(storedSession.logs);
        setRawReport(storedSession.report);
        setLogs(storedSession.logs);
        setReport(storedSession.report);
        setPrompt(storedSession.prompt);
        setSelectedLogIndex(null);
        setStatus("done");
        setShowLimitModal(false);
    };

    // ─── Auto-start replay on mount if session exists ──────────────────────

    useEffect(() => {
        if (status === "replay" && storedSession && logs.length === 0 && !report) {
            runReplay();
        }
    }, [status, storedSession, logs.length, report, runReplay]);

    // ─── Handle submit ─────────────────────────────────────────────────────

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!prompt.trim() || status === "running") return;
        runAgent(prompt.trim());
    };

    const handlePreset = (presetPrompt: string) => {
        setPrompt(presetPrompt);
        runAgent(presetPrompt);
    };

    // ─── Determine if we should show the activity log ──────────────────────

    const showLogs = logs.length > 0;
    const showReport = report.length > 0;
    const showInput = status === "idle" || status === "error";
    const isReplayMode = storedSession !== null && status !== "running";

    const handleBack = () => {
        if (showLogs || showReport) {
            // Reset to input state
            setStatus("idle");
            setLogs([]);
            setReport("");
            setRawLogs([]);
            setRawReport("");
            setPrompt("");
            setSelectedLogIndex(null);
            setError(null);
        } else {
            // Already at input state, go home
            router.push("/");
        }
    };

    // ─── Render ────────────────────────────────────────────────────────────

    return (
        <LazyMotion features={domAnimation} strict>
            <div className="min-h-screen text-pinch-text flex flex-col relative w-full overflow-x-hidden">
                {/* Header */}
                <header className="border-b border-[var(--overlay-border)] bg-pinch-bg/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center h-16 gap-4">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-pinch-muted hover:text-pinch-cyan transition-colors duration-200 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                            <span className="text-sm font-medium">Back</span>
                        </button>

                        <div className="h-5 w-px bg-[var(--overlay-border)]" />

                        {!(showLogs || showReport) ? (
                            <div>
                                <h1 className="font-heading text-lg font-bold">
                                    <span className="gradient-arc-text">Competitive Intel</span> Agent
                                </h1>
                                <p className="text-xs text-pinch-muted -mt-0.5 hidden sm:block">
                                    Autonomous market research powered by AI
                                </p>
                            </div>
                        ) : (
                            <div>
                                <h1 className="font-heading text-lg font-bold">
                                    <span className="gradient-arc-text">Competitive Intel</span> Agent
                                </h1>
                                <p className="text-xs text-pinch-muted -mt-0.5 hidden sm:block truncate max-w-md">
                                    {prompt}
                                </p>
                            </div>
                        )}

                        {(showLogs || showReport) && isReportFinished && (
                            <button
                                onClick={runReplay}
                                className="ml-auto flex items-center gap-1.5 text-xs font-medium text-pinch-cyan border border-pinch-cyan/30 rounded-lg px-3 py-1.5 hover:bg-pinch-cyan/10 transition-all"
                            >
                                <Play className="w-3 h-3" />
                                Replay
                            </button>
                        )}

                        {!(showLogs || showReport) && storedSession && (
                            <button
                                onClick={handleViewPrevious}
                                className="ml-auto flex items-center gap-1.5 text-xs font-medium text-pinch-text border border-[var(--overlay-border)] rounded-lg px-3 py-1.5 hover:bg-[var(--overlay-subtle)] transition-all bg-[var(--overlay-card)]"
                            >
                                <ArrowRight className="w-3 h-3 text-pinch-muted" />
                                View Previous Research
                            </button>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className={`flex-1 flex flex-col relative w-full ${showLogs && !showReport ? 'h-[calc(100vh-4rem)] overflow-hidden' : ''}`}>
                    <AnimatePresence mode="wait">
                        {/* Loading State */}
                        {status === "loading" && (
                            <m.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center py-32"
                            >
                                <Loader2 className="w-6 h-6 text-pinch-cyan animate-spin" />
                            </m.div>
                        )}

                        {/* Input Stage */}
                        {showInput && (
                            <m.div
                                key="input"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Hero Section */}
                                <div className="text-center mb-10 pt-10">
                                    <h2 className="font-heading text-4xl sm:text-5xl font-bold mb-4">
                                        Describe your company.
                                    </h2>
                                    <p className="text-pinch-muted max-w-xl mx-auto text-lg mb-12">
                                        We'll autonomously map your competitive landscape.
                                    </p>

                                    <div className="max-w-2xl mx-auto relative group mt-10">
                                        <form onSubmit={handleSubmit} className="relative flex flex-col items-center">
                                            <textarea
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder="My company is a new CRM for real estate agents. Run a competitive analysis..."
                                                rows={4}
                                                className="w-full rounded-2xl border border-[var(--overlay-border)] bg-[var(--overlay-subtle)] backdrop-blur-sm px-6 py-5 text-base text-pinch-text transition-all placeholder:text-pinch-muted/50 focus:border-pinch-cyan/50 focus:outline-none resize-none"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!prompt.trim() || prompt.trim().length < 10}
                                                className="btn-primary rounded-xl px-6 py-3 mt-6 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                                            >
                                                <Send className="w-4 h-4 mr-2" />
                                                Run Analysis
                                            </button>
                                        </form>
                                    </div>

                                    {/* Presets */}
                                    <div className="mt-12">
                                        <p className="text-xs font-medium text-pinch-muted/60 mb-3 uppercase tracking-wider">
                                            Or try an example
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                                            {PRESETS.map((p) => (
                                                <button
                                                    key={p.label}
                                                    onClick={() => handlePreset(p.prompt)}
                                                    className="text-xs px-4 py-2 rounded-xl border border-[var(--overlay-border)] bg-[var(--overlay-subtle)]/30 text-pinch-muted hover:text-pinch-cyan hover:border-pinch-cyan/30 hover:bg-pinch-cyan/5 transition-all duration-200"
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </m.div>
                        )}

                        {/* Running / Done / Replay Stage */}
                        {(status === "running" ||
                            status === "done" ||
                            status === "replay") && (
                                <m.div
                                    key="agent"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Activity Node Graph (Fixed Background layer) */}
                                    {showLogs && !showReport && (
                                        <div className="fixed inset-0 z-0 pointer-events-none mt-16">
                                            <div className="absolute inset-0 z-0 pointer-events-auto">
                                                <ReactFlow
                                                    nodes={nodes}
                                                    edges={edges}
                                                    nodeTypes={nodeTypes}
                                                    proOptions={{ hideAttribution: true }}
                                                    fitView
                                                    fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                                                    autoPanOnNodeDrag={false}
                                                    nodesDraggable={true}
                                                    nodesConnectable={false}
                                                    elementsSelectable={true}
                                                    onNodeClick={(_, node) => setSelectedLogIndex(node.data.logIndex as number)}
                                                    onPaneClick={() => setSelectedLogIndex(null)}
                                                >
                                                    <Background color="var(--overlay-border)" gap={24} size={2} />
                                                    <AutoCenterGraph nodes={nodes} />
                                                </ReactFlow>

                                                {/* Replay Pause/Play Controls */}
                                                {status === "replay" && !isReportFinished && (
                                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                                                        <button
                                                            onClick={() => setReplayPaused((p) => !p)}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border backdrop-blur-md transition-all hover:scale-105"
                                                            style={{
                                                                background: replayPaused
                                                                    ? 'rgba(34, 211, 238, 0.15)'
                                                                    : 'rgba(15, 23, 42, 0.7)',
                                                                borderColor: replayPaused
                                                                    ? 'rgba(34, 211, 238, 0.4)'
                                                                    : 'var(--overlay-border)',
                                                                color: replayPaused
                                                                    ? 'hsl(187 80% 48%)'
                                                                    : 'var(--text-muted)',
                                                            }}
                                                        >
                                                            {replayPaused ? (
                                                                <><Play className="w-3.5 h-3.5" /> Resume</>
                                                            ) : (
                                                                <><Pause className="w-3.5 h-3.5" /> Pause</>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Details Panel */}
                                                <AnimatePresence>
                                                    {selectedLogIndex !== null && (
                                                        <m.div
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 20 }}
                                                            className="absolute top-4 right-4 bottom-4 w-80 rounded-xl p-6 shadow-[var(--shadow-card)] flex flex-col z-10 pointer-events-auto"
                                                            style={{ background: 'var(--overlay-card)', border: '1px solid var(--overlay-border)' }}
                                                        >
                                                            <div className="flex items-center justify-between mb-4 border-b border-[var(--overlay-border)] pb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={stepColor(logs[selectedLogIndex].step)}>
                                                                        <StepIcon step={logs[selectedLogIndex].step} />
                                                                    </div>
                                                                    <h4 className="font-heading font-semibold text-sm text-pinch-text uppercase tracking-wider">
                                                                        {logs[selectedLogIndex].step}
                                                                    </h4>
                                                                </div>
                                                                <button
                                                                    onClick={() => setSelectedLogIndex(null)}
                                                                    className="text-pinch-muted hover:text-pinch-text transition-colors"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                                                <div className="mb-6">
                                                                    <h5 className="text-sm font-semibold text-pinch-cyan mb-1.5 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                                                                        {STEP_DETAILS[logs[selectedLogIndex].step]?.title || "Executing Step"}
                                                                    </h5>
                                                                    <p className="text-xs text-pinch-muted leading-relaxed">
                                                                        {STEP_DETAILS[logs[selectedLogIndex].step]?.description || "The agent is performing an autonomous action based on the current context."}
                                                                    </p>
                                                                </div>
                                                                <div className="h-px w-full bg-[var(--overlay-border)] mb-5" />
                                                                <p className="text-sm font-medium text-pinch-text mb-4">
                                                                    {stepLabel(logs[selectedLogIndex])}
                                                                </p>
                                                                {logs[selectedLogIndex].input && (
                                                                    <div className="mb-4">
                                                                        <span className="text-xs text-pinch-muted uppercase tracking-wider font-semibold block mb-1.5">Inputs</span>
                                                                        <pre className="bg-[var(--overlay-subtle)] border border-[var(--overlay-border)] p-3 rounded-lg text-xs font-mono text-pinch-text/80 whitespace-pre-wrap">
                                                                            {logs[selectedLogIndex].input}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                                {logs[selectedLogIndex].summary && logs[selectedLogIndex].step !== "kill_switch" && (
                                                                    <div>
                                                                        <span className="text-xs text-pinch-muted uppercase tracking-wider font-semibold block mb-1.5">Output</span>
                                                                        <div className="bg-[var(--overlay-subtle)] border border-[var(--overlay-border)] p-3 rounded-lg text-xs leading-relaxed text-pinch-text/80">
                                                                            {logs[selectedLogIndex].summary}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </m.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    )}

                                    {/* Report Overlay Layer */}
                                    {showReport && (
                                        <div className="w-full relative z-10 py-12 px-4 scroll-m-20 min-h-[calc(100vh-4rem)] flex flex-col items-center">
                                            <m.div
                                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                                                ref={reportRef}
                                                className="w-full max-w-4xl"
                                            >
                                                <div
                                                    className="rounded-xl p-8 sm:p-12 shadow-[var(--shadow-card)] transition-colors duration-300"
                                                    style={{ background: 'var(--overlay-card)', border: '1px solid var(--overlay-border)' }}
                                                >
                                                    <MarkdownContent content={report} />

                                                    {/* Completion Info */}
                                                    {isReportFinished && !isReplayMode && (
                                                        <m.div
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 1 }}
                                                            className="mt-8 pt-6 border-t border-[var(--overlay-border)] flex items-center gap-2 text-sm text-pinch-muted"
                                                        >
                                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                            Analysis securely stored for future references.
                                                        </m.div>
                                                    )}
                                                </div>
                                            </m.div>
                                        </div>
                                    )}

                                    {/* Running indicator (no logs yet) */}
                                    {status === "running" && !showLogs && (
                                        <div className="flex items-center justify-center py-16">
                                            <Loader2 className="w-6 h-6 text-pinch-cyan animate-spin" />
                                            <span className="ml-3 text-sm text-pinch-muted">
                                                Starting agent...
                                            </span>
                                        </div>
                                    )}
                                </m.div>
                            )}
                    </AnimatePresence>

                    {/* ─── Limit Exhausted Modal ─────────────────── */}
                    <AnimatePresence>
                        {showLimitModal && (
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                            >
                                {/* Backdrop */}
                                <div
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                    onClick={() => setShowLimitModal(false)}
                                />

                                {/* Modal */}
                                <m.div
                                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 40, scale: 0.95 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className="relative glass-card p-6 sm:p-8 w-full max-w-md z-10"
                                >
                                    <button
                                        onClick={() => setShowLimitModal(false)}
                                        className="absolute top-4 right-4 text-pinch-muted hover:text-pinch-text transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>

                                    {contactSubmitted ? (
                                        <div className="text-center py-6">
                                            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                                            <h3 className="font-heading text-lg font-bold text-pinch-text mb-2">
                                                Thank you!
                                            </h3>
                                            <p className="text-sm text-pinch-muted mb-6">
                                                Our team will reach out shortly to assist with extended demos.
                                            </p>
                                            <div className="flex flex-col gap-3">
                                                {storedSession && (
                                                    <button
                                                        onClick={handleViewPrevious}
                                                        className="btn-primary w-full justify-center text-xs"
                                                    >
                                                        View previous research conducted
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setShowLimitModal(false)}
                                                    className="btn-outline w-full justify-center text-xs"
                                                >
                                                    Return to Prompt
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-5">
                                                <h3 className="font-heading text-lg font-bold text-pinch-text mb-1">
                                                    You've used your{" "}
                                                    <span className="gradient-arc-text">1 demo</span>{" "}
                                                    allowance.
                                                </h3>
                                                <p className="text-sm text-pinch-muted">
                                                    For extended demos give us your email and company name and we'll be in touch soon.
                                                </p>
                                            </div>

                                            <form onSubmit={handleContactSubmit} className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-pinch-muted mb-1.5">
                                                        Email
                                                    </label>
                                                    <input
                                                        required
                                                        type="email"
                                                        value={contactData.email}
                                                        onChange={(e) => setContactData((d) => ({ ...d, email: e.target.value }))}
                                                        placeholder="your.email@company.com"
                                                        className="w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-pinch-text placeholder:text-pinch-muted/40 focus:border-pinch-cyan focus:shadow-[0_0_0_1px_hsl(187_80%_48%/0.3)] focus:outline-none"
                                                        style={{ borderColor: "var(--border-field)" }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-pinch-muted mb-1.5">
                                                        Company
                                                    </label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={contactData.company}
                                                        onChange={(e) => setContactData((d) => ({ ...d, company: e.target.value }))}
                                                        placeholder="Your Company"
                                                        className="w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-pinch-text placeholder:text-pinch-muted/40 focus:border-pinch-cyan focus:shadow-[0_0_0_1px_hsl(187_80%_48%/0.3)] focus:outline-none"
                                                        style={{ borderColor: "var(--border-field)" }}
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={contactSubmitting}
                                                    className="btn-primary w-full justify-center mt-6"
                                                >
                                                    {contactSubmitting ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Send className="w-4 h-4 mr-2" />
                                                            Request Extended Demo
                                                        </>
                                                    )}
                                                </button>
                                            </form>

                                            {storedSession && (
                                                <div className="mt-6 pt-6 border-t border-[var(--overlay-border)] text-center">
                                                    <p className="text-xs text-pinch-muted mb-3">
                                                        Or review the research you just ran
                                                    </p>
                                                    <button
                                                        onClick={handleViewPrevious}
                                                        className="text-xs font-medium text-pinch-cyan hover:text-pinch-cyan/80 transition-colors w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--overlay-subtle)] border border-[var(--overlay-border)]"
                                                    >
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                        View previous research conducted
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </m.div>
                            </m.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </LazyMotion>
    );
}
