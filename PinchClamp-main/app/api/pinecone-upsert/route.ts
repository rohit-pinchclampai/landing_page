import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";

const INDEX_NAME = "rag-demo";
const INDEX_REGION = "us-east-1";
const DIMENSION = 384; // MiniLM-L6-v2 outputs 384D vectors

/**
 * POST /api/pinecone-upsert
 *
 * Receives a batch of embedded vectors from the client and pushes them to Pinecone.
 * On the first batch (isFirstBatch=true), clears old data and ensures the index exists.
 * Subsequent batches skip straight to upsert.
 */
export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "PINECONE_API_KEY not configured" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { vectors, isFirstBatch = true } = body as {
            vectors: Array<{ id: string; values: number[]; metadata: { text: string } }>;
            isFirstBatch?: boolean;
        };

        if (!vectors || !Array.isArray(vectors) || vectors.length === 0) {
            return NextResponse.json(
                { error: "No vectors provided" },
                { status: 400 }
            );
        }

        const pc = new Pinecone({ apiKey });
        const index = pc.index(INDEX_NAME);

        // Only on first batch: ensure index exists and clear old data
        if (isFirstBatch) {
            const existingIndexes = await pc.listIndexes();
            const indexNames = existingIndexes.indexes?.map((i) => i.name) || [];

            if (!indexNames.includes(INDEX_NAME)) {
                await pc.createIndex({
                    name: INDEX_NAME,
                    dimension: DIMENSION,
                    metric: "cosine",
                    spec: {
                        serverless: {
                            cloud: "aws",
                            region: INDEX_REGION,
                        },
                    },
                });
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }

            // Clear existing vectors (demo mode)
            try {
                await index.namespace("").deleteAll();
                // Pinecone serverless deletion is async — wait for it
                await new Promise((resolve) => setTimeout(resolve, 2000));
            } catch {
                // Index might be empty, ignore
            }
        }

        // Upsert the batch directly (client already pre-batches at 100)
        await index.namespace("").upsert({
            records: vectors.map((v) => ({
                id: v.id,
                values: v.values,
                metadata: v.metadata,
            })),
        });

        return NextResponse.json({
            success: true,
            count: vectors.length,
        });
    } catch (error) {
        console.error("Pinecone upsert error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
