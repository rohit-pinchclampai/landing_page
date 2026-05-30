import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import Groq from "groq-sdk";

// ─── Config ────────────────────────────────────────────────────────────────────

const AGENT_MODEL = process.env.AGENT_MODEL || "llama-3.3-70b-versatile";
const WORKER_MODEL = process.env.AGENT_WORKER_MODEL || "llama-3.1-8b-instant";
const MAX_ACTIONS = parseInt(process.env.AGENT_MAX_ACTIONS || "4", 10);
const LIMIT_PER_IP = parseInt(process.env.AGENT_LIMIT_PER_IP || "1", 10);
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

// IPs that bypass rate limiting (localhost / dev) — DISABLED FOR TESTING
// const DEV_IPS = new Set(["::1", "127.0.0.1", "localhost"]);

// ─── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a **Senior Corporate Strategist** (think McKinsey or Bain) building a competitive intelligence brief for an executive audience. You are an autonomous AI agent with access to web search and website scraping tools.

## Your Process
1. **THINK FIRST** (mandatory internal reasoning before ANY tool call): Before touching any tools, you MUST explicitly reason about:
   - What exactly does this company DO? (e.g., "They are a B2B e-commerce platform" or "They are a D2C marketplace")
   - What is their business model? (marketplace, SaaS, subscription, retail, etc.)
   - Who are their ACTUAL competitors? (companies that do the SAME thing, not tangentially related content sites, news publishers, or industry blogs)
   - What search queries will find companies with the SAME business model, NOT just companies in the same broad industry?
   Output this reasoning as your first "thinking" step.
2. Use search_web to find the top DIRECT competitors — companies with the same business model targeting similar customers. **Search smart**: use queries like "best [exact business type] platforms 2025", "[business model] competitors comparison", or "alternatives to [known competitor]". NEVER search for generic industry terms like "coffee market" or "e-commerce trends" — those return news articles, not competitors.
3. Then, scrape exactly **2** competitor websites to extract hard data about their features, pricing, and positioning. Do NOT scrape more than 2. **CRITICAL**: Only scrape actual competitor businesses. NEVER scrape news sites, blogs, or industry publications — those are NOT competitors.
4. Finally, synthesize ALL collected data (search snippets + scraped intel) into a razor-sharp competitive intelligence brief.

## Competitor Relevance Rules
- A competitor MUST have the same core business model as the user's company. If the user runs a marketplace, competitors are OTHER marketplaces — not news sites about that industry.
- If a search result is a blog, news publication, or industry association, it is NOT a competitor. Skip it.
- If you cannot find 2 direct competitors with the same business model, state this explicitly rather than padding with irrelevant companies.

## Output Quality Mandates
- **NEVER** use generic filler phrases. The following are BANNED: "The market is competitive", "They are a leading provider", "In today's fast-paced", "offers a wide range of", "comprehensive solution". If you catch yourself writing filler, delete it.
- **HIGH-INFORMATION DENSITY**: Every sentence must contain a specific fact, number, or insight. If a sentence could apply to any company in any industry, it is useless — rewrite or delete it.
- **DEPTH OVER BREADTH**: 2 deeply analyzed competitors with real data points are infinitely more valuable than 5 with recycled marketing copy.
- If data is missing, state **"Insufficient data available"**. Do NOT guess, infer, or hallucinate.
- Use information from BOTH search snippets AND scraped pages. Competitors you didn't scrape can appear if search results provided useful intel.
- **ABSOLUTE BAN on intro/outro sentences**: Do NOT write "Here is the report", "In conclusion", "This report provides", "Based on our analysis", or any meta-commentary about the report itself. Start directly with content. End with the last recommendation. Nothing else.
- If a target audience cannot be defined specifically, output **"Broad Consumer Base"** rather than listing generic terms.

## Report Format
Your final report MUST be formatted in proper Markdown. Use blank lines between all sections.

# Competitive Intelligence Brief

## Executive Summary
The Executive Summary MUST be exactly 3 bullet points, no more, no less:
- **Market Shift**: The single biggest recent change or trend in this industry.
- **Incumbent Strategy**: What the dominant players are currently doing to maintain position.
- **The White Space**: The exact gap the user's business can fill, stated as a concrete opportunity.

## Competitor Deep-Dives

For each competitor:

### [Competitor Name]

- **Website**: URL
- **Core Offering**: List specific products, technologies, or unique mechanics — not marketing adjectives. What do they actually sell/do?
- **Target Audience**: Be hyper-specific (e.g., "Mid-market B2B SaaS companies with 50-500 employees", not "Businesses").
- **Pricing & Tiers**: Extract exact numbers and tier names. If not found, state "Pricing: Not publicly listed" and note what can be inferred from positioning.
- **Competitive Strengths**: For each strength, explain the specific mechanism that makes it defensible. What would it cost a new entrant to replicate?
- **Exploitable Weaknesses**: For each weakness, describe the specific gap and how the user's business could exploit it. Be surgical.

## Competitive Positioning Matrix

Present a comparison table in proper Markdown table format:

| Dimension | Competitor A | Competitor B | Gap / Opportunity |
|-----------|-------------|-------------|-------------------|
| Pricing | $X/mo | $Y/mo | Undercut by Z% |

## Strategic Recommendations
Provide 3-5 hyper-specific, actionable recommendations based ONLY on the competitor weaknesses you discovered above. Each recommendation must: (a) name the specific weakness it exploits, (b) describe the concrete action to take, (c) explain the expected competitive advantage. Do NOT give generic business advice like "Invest in digital marketing."

## Hard Rules
- Use ONLY data gathered from your tools. ZERO hallucination.
- If you cannot find pricing, state "Not publicly listed" — do NOT guess.
- Always put blank lines between headings, paragraphs, and table rows.
- **CRITICAL**: Call tools ONE AT A TIME, sequentially. First call search_web, wait for results, then call scrape_website for one URL, wait, then scrape_website for another. NEVER call multiple tools in a single response.
- **CRITICAL**: Do NOT output raw XML or pseudo-XML tags like \`<function=...>\`. You MUST use the official JSON function calling mechanism provided by the API.`;

// ─── Tool Definitions for Groq Function Calling ───────────────────────────────

const TOOLS: Groq.Chat.Completions.ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "search_web",
            description:
                "Search the web for information. Use this to find competitors, market data, and relevant URLs. Returns top search results with titles, URLs, and snippets.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description:
                            "The search query to find relevant information about competitors or markets.",
                    },
                },
                required: ["query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "scrape_website",
            description:
                "Read and extract information from a specific webpage. Use this to gather detailed information about a competitor's features, pricing, and positioning from their website.",
            parameters: {
                type: "object",
                properties: {
                    url: {
                        type: "string",
                        description: "The full URL of the webpage to read and extract information from.",
                    },
                },
                required: ["url"],
            },
        },
    },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const realIP = req.headers.get("x-real-ip");
    if (realIP) return realIP.trim();
    return "127.0.0.1";
}

/** Format an SSE event */
function sseEvent(event: string, data: object): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ─── Tool Execution: search_web (Tavily) ───────────────────────────────────────

interface TavilyResult {
    title: string;
    url: string;
    content: string;
}

async function executeSearchWeb(query: string): Promise<string> {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return "Error: Search API not configured. Proceed with available data.";

    try {
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                query,
                max_results: 5,
                search_depth: "basic",
            }),
        });

        if (!res.ok) {
            return `Error: Search returned status ${res.status}. Proceed with available data or try a different query.`;
        }

        const data = await res.json();
        const results = (data.results || []) as TavilyResult[];

        if (results.length === 0) {
            return "No search results found. Try a different or broader query.";
        }

        return results
            .map(
                (r: TavilyResult, i: number) =>
                    `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.content?.slice(0, 200) || "No snippet available."}`
            )
            .join("\n\n");
    } catch (err) {
        return `Error: Search failed (${err instanceof Error ? err.message : "unknown error"}). Proceed with available data.`;
    }
}

// ─── Tool Execution: scrape_website (Jina Reader → 8B Worker Summarizer) ──────

async function executeScrapeWebsite(url: string, groq: Groq): Promise<string> {
    // Step 1: Fetch raw markdown via Jina Reader
    let rawMarkdown: string;
    try {
        const jinaUrl = `https://r.jina.ai/${url}`;
        const res = await fetch(jinaUrl, {
            headers: {
                Accept: "text/markdown",
                "X-No-Cache": "true",
            },
            signal: AbortSignal.timeout(15000), // 15s timeout
        });

        if (!res.ok) {
            return `Error: Could not read website (HTTP ${res.status}). The site may be protected by anti-bot measures. Proceed with your research using other data, or search for a different competitor.`;
        }

        rawMarkdown = await res.text();

        if (!rawMarkdown || rawMarkdown.trim().length < 100) {
            return `Error: Website returned very little content. It may require JavaScript rendering. Proceed with other sources.`;
        }
    } catch (err) {
        return `Error: Failed to read website (${err instanceof Error ? err.message : "timeout or network error"}). Proceed with your research using other data, or search for a different competitor.`;
    }

    // Step 2: Guardrail 1 — 8B Worker Node summarization
    // Truncate raw content to 10k chars to stay within 8B context window (approx 5.5k tokens)
    const truncatedRaw = rawMarkdown.slice(0, 10000);

    try {
        const workerResponse = await groq.chat.completions.create({
            model: WORKER_MODEL,
            messages: [
                {
                    role: "system",
                    content: `You are a ruthless, highly-analytical data extraction algorithm. Read the following scraped website markdown. DO NOT write paragraphs. DO NOT use generic marketing fluff. Extract hard data into dense bullet points.

You MUST extract:
- **Core Features/Offerings**: List specific products, technologies, or unique mechanics. Name them.
- **Target Audience**: Be hyper-specific (e.g., "Enterprise B2B SaaS", not "Businesses").
- **Pricing & Tiers**: Extract exact numbers, plan names, and billing cycles. If none exist, output "Pricing: Not publicly listed".

Output ONLY the extracted bullet points. No intro, no outro, no conversational text. No summaries. Just data.`,
                },
                {
                    role: "user",
                    content: `Extract competitive intelligence from this website:\n\n${truncatedRaw}`,
                },
            ],
            temperature: 0.1,
            max_tokens: 1500,
        });

        const summary = workerResponse.choices[0]?.message?.content;
        if (summary) return summary;

        // Fallback: return truncated raw if worker fails
        return truncatedRaw.slice(0, 6000);
    } catch {
        // Fallback: return truncated raw content if worker model fails
        return truncatedRaw.slice(0, 6000);
    }
}

// ─── SSE Log Entry Type ────────────────────────────────────────────────────────

interface LogEntry {
    step: string;
    tool?: string;
    input?: string;
    message?: string;
    summary?: string;
}

// ─── POST /api/agent ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!groqKey) {
            return Response.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
        }
        if (!redisUrl || !redisToken) {
            return Response.json({ error: "Redis not configured" }, { status: 500 });
        }

        const body = await req.json();
        const { prompt } = body as { prompt: string };

        if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
            return Response.json(
                { error: "Please provide a business description (at least 10 characters)." },
                { status: 400 }
            );
        }

        // ─── Redis: Per-IP Usage Limit ──────────────────────────────────────────

        const redis = new Redis({ url: redisUrl, token: redisToken });
        const ip = getClientIP(req);
        // const isDev = DEV_IPS.has(ip);
        const countKey = `agent_count:${ip}`;
        // Use a unique session key per run so replays can show the latest
        const sessionKey = `agent_session:${ip}`;

        {
            const currentCount = (await redis.get<number>(countKey)) || 0;
            if (currentCount >= LIMIT_PER_IP) {
                // Return the stored session for replay
                const existingSession = await redis.get(sessionKey);
                return Response.json(
                    { status: "already_used", session: existingSession },
                    { status: 409 }
                );
            }
        }

        // ─── SSE Stream Setup ──────────────────────────────────────────────────

        const groq = new Groq({ apiKey: groqKey });
        const encoder = new TextEncoder();
        const logs: LogEntry[] = [];

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Helper to send SSE + record log
                    const sendStatus = (entry: LogEntry) => {
                        logs.push(entry);
                        controller.enqueue(encoder.encode(sseEvent("status", entry)));
                    };

                    // ─── Initialize the conversation ───────────────────────────

                    sendStatus({ step: "thinking", message: "Analyzing your request..." });

                    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: prompt },
                    ];

                    // ─── ReAct Loop ────────────────────────────────────────────

                    let actionCount = 0;
                    let finalReport = "";

                    while (actionCount < MAX_ACTIONS) {
                        // Call the 70B Manager with tools (retry on malformed tool calls)
                        // Use "required" on the first call to anchor the model into native tool-calling mode
                        const isFirstCall = actionCount === 0 && messages.length <= 3;

                        let response: Groq.Chat.Completions.ChatCompletion | null = null;
                        for (let attempt = 0; attempt < 3; attempt++) {
                            try {
                                response = await groq.chat.completions.create({
                                    model: AGENT_MODEL,
                                    messages,
                                    tools: TOOLS,
                                    tool_choice: (isFirstCall || attempt > 0) ? "required" : "auto",
                                    parallel_tool_calls: false,
                                    temperature: 0.3 + attempt * 0.15, // bump temp on retry
                                    max_tokens: 4096,
                                });
                                break; // success
                            } catch (groqErr) {
                                const errMsg = groqErr instanceof Error ? groqErr.message : String(groqErr);
                                const isToolUseFailed = errMsg.includes("tool_use_failed") || errMsg.includes("Failed to call a function");
                                if (isToolUseFailed && attempt < 2) {
                                    sendStatus({ step: "thinking", message: `Retrying (model produced malformed tool call, attempt ${attempt + 2}/3)...` });
                                    // Inject a coaching message to fix the model's behavior
                                    messages.push({
                                        role: "user",
                                        content: "Your previous response resulted in a `tool_use_failed` error because you output raw XML-like text (`<function=...`). You MUST use the proper JSON tool calling format provided by the API. Call exactly ONE tool now.",
                                    });
                                    continue;
                                }
                                throw groqErr; // re-throw if not retryable or out of retries
                            }
                        }

                        if (!response) throw new Error("Failed to get a response from the model after retries.");

                        const choice = response.choices[0];
                        const assistantMessage = choice.message;

                        // Append the assistant's message to conversation
                        messages.push(assistantMessage);

                        // If no tool calls → this is the final response
                        if (
                            !assistantMessage.tool_calls ||
                            assistantMessage.tool_calls.length === 0
                        ) {
                            finalReport = assistantMessage.content || "";
                            break;
                        }

                        // Execute each tool call
                        for (const toolCall of assistantMessage.tool_calls) {
                            const fnName = toolCall.function.name;
                            let args: Record<string, string>;
                            try {
                                args = JSON.parse(toolCall.function.arguments);
                            } catch {
                                args = {};
                            }

                            let toolResult: string;

                            if (fnName === "search_web") {
                                const query = args.query || "";
                                sendStatus({
                                    step: "tool_call",
                                    tool: "search_web",
                                    input: query,
                                    message: `Searching: "${query}"`,
                                });
                                toolResult = await executeSearchWeb(query);
                                sendStatus({
                                    step: "tool_result",
                                    tool: "search_web",
                                    summary: toolResult.startsWith("Error")
                                        ? toolResult
                                        : `Found ${(toolResult.match(/\d+\./g) || []).length} results`,
                                });
                            } else if (fnName === "scrape_website") {
                                const url = args.url || "";
                                sendStatus({
                                    step: "tool_call",
                                    tool: "scrape_website",
                                    input: url,
                                    message: `Reading: ${new URL(url).hostname}`,
                                });
                                sendStatus({
                                    step: "worker",
                                    message: `Summarizing ${new URL(url).hostname} via 8B worker...`,
                                });
                                toolResult = await executeScrapeWebsite(url, groq);
                                sendStatus({
                                    step: "tool_result",
                                    tool: "scrape_website",
                                    summary: toolResult.startsWith("Error")
                                        ? toolResult
                                        : `Intel summary ready (${toolResult.length} chars)`,
                                });
                            } else {
                                toolResult = `Error: Unknown tool "${fnName}". Use search_web or scrape_website.`;
                            }

                            // Append tool result to conversation
                            messages.push({
                                role: "tool",
                                tool_call_id: toolCall.id,
                                content: toolResult,
                            });

                            actionCount++;
                        }
                    }

                    // ─── Guardrail 2: Kill-Switch ──────────────────────────────

                    if (!finalReport && actionCount >= MAX_ACTIONS) {
                        sendStatus({
                            step: "kill_switch",
                            message: "Research limit reached. Synthesizing report...",
                        });

                        messages.push({
                            role: "system",
                            content:
                                "Research window closed. Synthesize ALL collected data into the final Competitive Intelligence Brief NOW. Follow the report format exactly. Remember: ZERO filler phrases, HIGH information density, and strategic recommendations must directly exploit specific competitor weaknesses you found. Do not call any more tools.",
                        });

                        const finalResponse = await groq.chat.completions.create({
                            model: AGENT_MODEL,
                            messages,
                            temperature: 0.3,
                            max_tokens: 4096,
                        });

                        finalReport = finalResponse.choices[0]?.message?.content || "";
                    }

                    // ─── Stream the final report token by token ────────────────

                    if (finalReport) {
                        sendStatus({ step: "thinking", message: "Writing final report..." });

                        // Stream report in chunks for a nice typing effect
                        const chunkSize = 20;
                        for (let i = 0; i < finalReport.length; i += chunkSize) {
                            const chunk = finalReport.slice(i, i + chunkSize);
                            controller.enqueue(
                                encoder.encode(sseEvent("token", { content: chunk }))
                            );
                        }
                    }

                    // ─── Save session to Redis ─────────────────────────────────

                    const session = {
                        prompt: prompt.trim(),
                        logs,
                        report: finalReport,
                        createdAt: new Date().toISOString(),
                    };

                    await redis.set(sessionKey, JSON.stringify(session), { ex: SESSION_TTL });

                    // Increment usage counter
                    {
                        const newCount = await redis.incr(countKey);
                        if (newCount === 1) {
                            await redis.expire(countKey, SESSION_TTL);
                        }
                    }

                    // Done event
                    controller.enqueue(encoder.encode(sseEvent("done", {})));
                    controller.close();
                } catch (err) {
                    console.error("Agent stream error:", err);
                    controller.enqueue(
                        encoder.encode(
                            sseEvent("error", {
                                message:
                                    err instanceof Error
                                        ? err.message
                                        : "An unexpected error occurred.",
                            })
                        )
                    );
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        console.error("Agent API error:", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
