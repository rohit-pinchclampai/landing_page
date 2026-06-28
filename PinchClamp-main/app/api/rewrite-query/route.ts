import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

/**
 * POST /api/rewrite-query
 *
 * Takes a follow-up question + recent chat history and rewrites the question
 * into a standalone, context-rich query suitable for embedding search.
 * This prevents vague follow-ups like "tell me more" from retrieving garbage.
 */
export async function POST(req: NextRequest) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
        }

        const { question, chatHistory } = (await req.json()) as {
            question: string;
            chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
        };

        // If no chat history, the question is already standalone
        if (!chatHistory || chatHistory.length === 0) {
            return NextResponse.json({ rewritten: question });
        }

        // Build a concise history summary (last 4 messages max)
        const recent = chatHistory.slice(-4);
        const historyBlock = recent
            .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content.slice(0, 300)}`)
            .join("\n");

        const groq = new Groq({ apiKey: groqKey });
        const result = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [
                {
                    role: "system",
                    content:
                        `You are a minimal query rewriter. Your ONLY job is to resolve vague references like pronouns ("it", "that", "this", "those") or phrases like "tell me more", "elaborate", "what about" into concrete terms using conversation context.

Rules:
- If the question is ALREADY clear and self-contained (e.g. "list all mathematics courses"), return it EXACTLY as-is. Do NOT add topics from previous questions.
- ONLY rewrite when the question contains unresolved references (pronouns, "it", "that", "the same thing", etc.) that would be meaningless without context.
- Keep rewrites minimal — change as few words as possible.
- Output ONLY the final question, nothing else.`,
                },
                {
                    role: "user",
                    content: `Conversation:\n${historyBlock}\n\nFollow-up question: ${question}\n\nRewritten standalone question:`,
                },
            ],
            temperature: 0,
            max_tokens: 100,
        });

        const rewritten = result.choices[0]?.message?.content?.trim() || question;

        return NextResponse.json({ rewritten });
    } catch (error) {
        console.error("Query rewrite error:", error);
        // Fallback: return original question if rewrite fails
        const { question } = await req.json().catch(() => ({ question: "" }));
        return NextResponse.json({ rewritten: question || "" });
    }
}
