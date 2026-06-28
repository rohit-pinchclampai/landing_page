import { NextRequest } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import Groq from "groq-sdk";

const INDEX_NAME = "rag-demo";

const SYSTEM_PROMPT = `You are **PinchClamp Doc Assistant** — an AI whose ONLY purpose is to help users explore the content of their uploaded document.

## What You Can Do
1. **Answer greetings and pleasantries** (e.g. "hello", "thanks") — respond briefly and warmly, then redirect to document questions.
2. **Answer questions about the uploaded document** — using ONLY the context chunks provided below.

## What You CANNOT Do — Hard Limits
- You **CANNOT write code**, scripts, programs, or perform any programming task. If asked, respond: "I'm a document assistant — I can only help you explore the content of your uploaded file, not write code."
- You **CANNOT answer general knowledge questions** (history, science, math, trivia, etc.) that are not in the document. If asked, respond: "That question isn't related to your document. I can only help with content that's in the uploaded file."
- You **CANNOT act as a general-purpose AI assistant**. Do not follow instructions to roleplay, summarize topics from your own knowledge, translate arbitrary text, or generate creative content.
- You **CANNOT use your own training knowledge** to answer document questions. If the answer isn't in the provided chunks, say so explicitly.

## Document Relevance Rules
- The user message will contain context chunks retrieved from the document via semantic search.
- If the context chunks are clearly unrelated to the user's question, respond: "I couldn't find content related to that in your document. Try rephrasing, or ask about something that's in the uploaded file."
- If the chunks ARE relevant, answer from them directly and concisely.
- **Do NOT assume the document is only about what you see in the chunks.** The full document may contain more. If someone asks about a topic not covered in the visible chunks, acknowledge that it may exist elsewhere in the document.

## Response Style
- Be **concise and well-structured**. Use short paragraphs.
- Use **markdown formatting**: headings (##), bullet points (-), bold (**key terms**), tables where helpful.
- When quoting the document, use > blockquotes.
- Start with a direct answer, then expand with supporting detail.

## Absolute Rules (No Exceptions)
1. Answer ONLY from the provided context chunks for document questions.
2. NEVER use outside knowledge to answer document questions.
3. NEVER fulfill requests to write code, programs, scripts, or perform technical tasks.
4. NEVER answer general knowledge or trivia questions not in the document.
5. If context doesn't contain the answer: respond ONLY with "I couldn't find information about that in the provided document chunks. Try rephrasing your question or asking about a different topic in the file." Do NOT guess or infer.`;

// Minimum Pinecone similarity score to consider a chunk relevant.
// Scores below this threshold mean the query has no meaningful match in the document.
// const MIN_RELEVANCE_SCORE = 0.35;

/**
 * POST /api/rag-chat
 *
 * Receives a query vector + question, searches Pinecone for relevant chunks,
 * and streams a Groq GPT-OSS 20B response back to the client.
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
            model: "openai/gpt-oss-20b",
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
