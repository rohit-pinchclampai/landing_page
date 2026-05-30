import { NextRequest } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import Groq from "groq-sdk";

const INDEX_NAME = "rag-demo";

const SYSTEM_PROMPT = `You are **PinchClamp Doc Assistant** — a sharp, friendly AI that helps users explore their uploaded documents.

## Conversation
- For **greetings, small talk, or general chat** (e.g. "hello", "how are you", "thanks"), respond naturally and warmly. You don't need document context for these.
- For **factual questions about the document's content**, answer ONLY from the provided context chunks. Never use outside knowledge for these.

## Document Awareness
- You are only shown the **5 most relevant chunks** retrieved via semantic search. The full document likely contains many more sections and topics.
- **Do NOT assume the document is only about what you see.** If the context chunks mention multiple subjects (e.g. a syllabus with many courses), acknowledge that the document covers multiple areas.
- When asked to summarize or describe the document, clarify that you can only describe what's visible in the retrieved chunks, and suggest the user ask about specific topics for more detail.

## Response Style
- Be **concise and well-structured**. Use short paragraphs, not walls of text.
- Use **markdown formatting**: headings (##), bullet points (-), bold (**key terms**), and numbered lists where appropriate.
- When quoting the document, use > blockquotes.
- Start with a brief direct answer, then expand with supporting details if needed.

## Rules
1. For document-related questions, answer ONLY from the provided context chunks.
2. If the context doesn't contain the answer, respond ONLY with: "I couldn't find information about that in the provided document chunks. Try rephrasing your question or asking about a different topic." **Do NOT guess, infer, or describe what the document might cover.** Do NOT say things like "the document focuses on X" or "the document covers Y" unless that is explicitly stated in the context chunks.
3. **NEVER use outside knowledge** to answer document questions. Do not offer general information as a substitute.
4. Keep answers focused — aim for 2-4 short paragraphs max unless the question requires more.
5. When referencing specific information, **quote the relevant passage** from the context using > blockquotes so the user can see exactly where the answer comes from.`;

/**
 * POST /api/rag-chat
 *
 * Receives a query vector + question, searches Pinecone for relevant chunks,
 * and streams a Groq LLaMA-3 response back to the client.
 */
export async function POST(req: NextRequest) {
    try {
        const pineconeKey = process.env.PINECONE_API_KEY;
        const groqKey = process.env.GROQ_API_KEY;

        if (!pineconeKey || !groqKey) {
            return new Response(
                JSON.stringify({ error: "API keys not configured" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await req.json();
        const { queryVector, question, chatHistory } = body as {
            queryVector: number[];
            question: string;
            chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
        };

        if (!queryVector || !question) {
            return new Response(
                JSON.stringify({ error: "Missing queryVector or question" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // 1. Search Pinecone for the 5 most relevant chunks
        const pc = new Pinecone({ apiKey: pineconeKey });
        const index = pc.index(INDEX_NAME);

        const queryResult = await index.namespace("").query({
            vector: queryVector,
            topK: 5,
            includeMetadata: true,
        });

        const contextChunks =
            queryResult.matches
                ?.map((m) => (m.metadata as { text: string })?.text)
                .filter(Boolean) || [];

        if (contextChunks.length === 0) {
            return new Response(
                JSON.stringify({
                    error: "No relevant context found. Please upload a document first.",
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // 2. Build the prompt with context
        const contextBlock = contextChunks
            .map((chunk, i) => `[Chunk ${i + 1}]:\n${chunk}`)
            .join("\n\n");

        const userMessage = `Context from the uploaded document (showing the 5 most relevant chunks out of the full document):\n\n${contextBlock}\n\n---\n\nUser Question: ${question}`;

        // 3. Build message history
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: SYSTEM_PROMPT },
        ];

        // Include recent chat history (last 10 messages for follow-up context)
        if (chatHistory && chatHistory.length > 0) {
            const recentHistory = chatHistory.slice(-10);
            for (const msg of recentHistory) {
                messages.push({ role: msg.role, content: msg.content });
            }
        }

        messages.push({ role: "user", content: userMessage });

        // 4. Call Groq with streaming
        const groq = new Groq({ apiKey: groqKey });
        const chatStream = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages,
            temperature: 0.1,
            max_tokens: 1024,
            stream: true,
        });

        // 5. Stream the response back
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
        console.error("RAG chat error:", error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
