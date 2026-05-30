import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import Groq from "groq-sdk";
import { buildSystemMessage, type PersonaKey } from "@/lib/chatbot-context";

// ─── Config ────────────────────────────────────────────────────────────────────

const MAX_QUERIES = parseInt(process.env.MAX_QUERIES_PER_IP || "10", 10);
const TTL_SECONDS = 86400; // 24 hours

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();

    const realIP = req.headers.get("x-real-ip");
    if (realIP) return realIP.trim();

    return "127.0.0.1";
}

// ─── POST /api/chat ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!groqKey) {
            return new Response(
                JSON.stringify({ error: "GROQ_API_KEY not configured" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        if (!redisUrl || !redisToken || redisUrl === "your-upstash-url") {
            return new Response(
                JSON.stringify({ error: "Upstash Redis not configured" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Parse request body
        const body = await req.json();
        const { persona, question, chatHistory } = body as {
            persona: PersonaKey;
            question: string;
            chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
        };

        if (!persona || !question) {
            return new Response(
                JSON.stringify({ error: "Missing persona or question" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Validate persona
        if (!["sales", "support"].includes(persona)) {
            return new Response(
                JSON.stringify({ error: "Invalid persona" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // ─── Redis: Rate Limiting ──────────────────────────────────────────────

        const redis = new Redis({ url: redisUrl, token: redisToken });
        const ip = getClientIP(req);
        const ipKey = `demo_count:${ip}`;
        const vipKey = `vip_pass:${ip}`;

        // VIP check — bypass rate limit entirely
        const isVIP = await redis.get(vipKey);
        if (!isVIP) {
            // INCR the counter — returns the new value
            const count = await redis.incr(ipKey);

            // Set TTL only on the FIRST request (count === 1)
            // This prevents resetting the 24h window on subsequent messages
            if (count === 1) {
                await redis.expire(ipKey, TTL_SECONDS);
            }

            // Check if over quota
            if (count > MAX_QUERIES) {
                return new Response(
                    JSON.stringify({
                        status: "limit_reached",
                        message: "Demo quota exhausted.",
                    }),
                    { status: 429, headers: { "Content-Type": "application/json" } }
                );
            }
        }

        // ─── Build Messages ────────────────────────────────────────────────────

        const systemMessage = buildSystemMessage(persona);

        const messages: Array<{
            role: "system" | "user" | "assistant";
            content: string;
        }> = [{ role: "system", content: systemMessage }];

        // Append recent chat history for context
        if (chatHistory && chatHistory.length > 0) {
            const recent = chatHistory.slice(-10);
            for (const msg of recent) {
                messages.push({ role: msg.role, content: msg.content });
            }
        }

        messages.push({ role: "user", content: question });

        // ─── Groq Streaming ────────────────────────────────────────────────────

        const groq = new Groq({ apiKey: groqKey });
        const chatStream = await groq.chat.completions.create({
            model: process.env.CHATBOT_MODEL || "llama-3.1-70b-versatile",
            messages,
            temperature: 0.6,
            max_tokens: 512,
            stream: true,
        });

        // Stream raw text back to the client
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of chatStream) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            controller.enqueue(encoder.encode(content));
                        }
                    }
                    controller.close();
                } catch (err) {
                    controller.error(err);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        console.error("Chat API error:", error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
