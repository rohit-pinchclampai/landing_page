/**
 * rag-worker.js — ES Module Web Worker for PDF processing + Transformers.js embedding
 *
 * Runs off the main thread so the React UI stays responsive.
 * Lives in /public so Next.js serves it as a static asset.
 *
 * Protocol:
 *   Main → Worker: { type: 'PROCESS_PDF', payload: { fileBuffer: ArrayBuffer, strategy: 'recursive'|'semantic' } }
 *   Worker → Main: { type: 'STATUS', step: number, label: string }
 *   Worker → Main: { type: 'CHUNKS_READY', payload: { chunks: [{text, vector}] } }
 *
 *   Main → Worker: { type: 'EMBED_QUERY', payload: { text: string } }
 *   Worker → Main: { type: 'QUERY_VECTOR', payload: { vector: number[] } }
 */

import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.4.1/dist/transformers.min.js";

// Tell transformers.js to NOT use local files, always fetch from HF Hub
env.allowLocalModels = false;

let extractor = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sendStatus(step, label) {
    self.postMessage({ type: "STATUS", step, label });
}

function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

// ─── PDF Text Extraction (pure JS, no dependency) ────────────────────────────

async function extractTextFromPDF(buffer) {
    // Use pdf.js loaded dynamically
    const pdfjsLib = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs");

    // Point PDF.js to its worker file from CDN (suppresses the warning)
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item) => item.str).join(" ");
        pages.push(text);
    }
    return pages.join("\n\n");
}

// ─── Chunking Strategies ──────────────────────────────────────────────────────

function recursiveSplit(text, chunkSize = 500, overlap = 50) {
    const separators = ["\n\n", "\n", ". ", " "];
    const chunks = [];

    function splitRecursive(text, sepIdx) {
        if (text.length <= chunkSize) {
            if (text.trim()) chunks.push(text.trim());
            return;
        }

        const sep = separators[sepIdx] || "";
        const parts = sep ? text.split(sep) : [text];

        let current = "";
        for (const part of parts) {
            const candidate = current ? current + sep + part : part;
            if (candidate.length > chunkSize && current) {
                chunks.push(current.trim());
                const overlapText = current.slice(-overlap);
                current = overlapText + sep + part;
            } else {
                current = candidate;
            }
        }

        if (current.trim()) {
            if (current.length > chunkSize && sepIdx < separators.length - 1) {
                splitRecursive(current, sepIdx + 1);
            } else {
                chunks.push(current.trim());
            }
        }
    }

    splitRecursive(text, 0);
    return chunks;
}

function splitIntoSentences(text) {
    return text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);
}

async function semanticChunk(text, embedFn, threshold = 0.45, onProgress) {
    const sentences = splitIntoSentences(text);
    if (sentences.length === 0) return [];

    const embeddings = [];
    for (let i = 0; i < sentences.length; i++) {
        const vec = await embedFn(sentences[i]);
        embeddings.push(vec);
        if (onProgress) onProgress(i + 1, sentences.length);
    }

    const chunks = [];
    let currentChunk = [sentences[0]];

    for (let i = 1; i < sentences.length; i++) {
        const sim = cosineSimilarity(embeddings[i - 1], embeddings[i]);
        if (sim < threshold) {
            chunks.push(currentChunk.join(" "));
            currentChunk = [sentences[i]];
        } else {
            currentChunk.push(sentences[i]);
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
    }

    return chunks;
}

// ─── Embedding ────────────────────────────────────────────────────────────────

async function initModel() {
    if (extractor) return extractor;
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    return extractor;
}

async function embed(text) {
    const model = await initModel();
    const output = await model(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
}

async function embedBatch(chunks, onProgress) {
    const results = [];
    for (let i = 0; i < chunks.length; i++) {
        const vector = await embed(chunks[i]);
        results.push({ text: chunks[i], vector });
        if (onProgress) onProgress(i + 1, chunks.length);
    }
    return results;
}

// ─── Message Handler ──────────────────────────────────────────────────────────

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    if (type === "PROCESS_PDF") {
        try {
            const { fileBuffer, strategy } = payload;

            // Step 1: Extract text
            sendStatus(1, "Extracting text from PDF...");
            const tick1 = setInterval(() => sendStatus(1, "Extracting text from PDF..."), 300);
            const text = await extractTextFromPDF(fileBuffer);
            clearInterval(tick1);

            if (!text || text.trim().length < 20) {
                self.postMessage({
                    type: "ERROR",
                    error: "Could not extract meaningful text from this PDF. It may be scanned/image-based.",
                });
                return;
            }

            // Step 2: Download/init model
            sendStatus(2, "Downloading MiniLM-L6-v2 model...");
            const tick2 = setInterval(() => sendStatus(2, "Downloading MiniLM-L6-v2 model..."), 300);
            await initModel();
            clearInterval(tick2);

            // Step 3: Chunk
            let chunks;
            if (strategy === "semantic") {
                sendStatus(3, "Semantic Chunking (0/?)...");
                chunks = await semanticChunk(text, embed, 0.45, (done, total) => {
                    sendStatus(3, `Semantic Chunking (${done}/${total})...`);
                });
            } else {
                sendStatus(3, "Executing Recursive Splitter...");
                chunks = recursiveSplit(text, 500, 50);
            }

            if (chunks.length === 0) {
                self.postMessage({
                    type: "ERROR",
                    error: "No text chunks could be generated from this document.",
                });
                return;
            }

            // Step 4: Embed all chunks
            sendStatus(4, `Generating 384D vectors (0/${chunks.length})...`);
            const embedded = await embedBatch(chunks, (done, total) => {
                sendStatus(4, `Generating 384D vectors (${done}/${total})...`);
            });

            // Done
            self.postMessage({
                type: "CHUNKS_READY",
                payload: { chunks: embedded },
            });
        } catch (err) {
            self.postMessage({ type: "ERROR", error: err.message || String(err) });
        }
    }

    if (type === "EMBED_QUERY") {
        try {
            const { text } = payload;
            await initModel();
            const vector = await embed(text);
            self.postMessage({ type: "QUERY_VECTOR", payload: { vector } });
        } catch (err) {
            self.postMessage({ type: "ERROR", error: err.message || String(err) });
        }
    }
};
