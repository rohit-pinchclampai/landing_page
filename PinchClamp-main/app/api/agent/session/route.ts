import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

// ─── Config ────────────────────────────────────────────────────────────────────

const LIMIT_PER_IP = parseInt(process.env.AGENT_LIMIT_PER_IP || "1", 10);

// IPs that bypass rate limiting (localhost / dev)
const DEV_IPS = new Set(["::1", "127.0.0.1", "localhost"]);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const realIP = req.headers.get("x-real-ip");
    if (realIP) return realIP.trim();
    return "127.0.0.1";
}

// ─── GET /api/agent/session ────────────────────────────────────────────────────
// Check if the current IP already has a stored agent session.
// Returns: { exists, session?, usesRemaining, isDev }

export async function GET(req: NextRequest) {
    try {
        const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!redisUrl || !redisToken) {
            return Response.json({ error: "Redis not configured" }, { status: 500 });
        }

        const redis = new Redis({ url: redisUrl, token: redisToken });
        const ip = getClientIP(req);
        const isDev = DEV_IPS.has(ip);
        const sessionKey = `agent_session:${ip}`;
        const countKey = `agent_count:${ip}`;

        const session = await redis.get(sessionKey);
        const count = (await redis.get<number>(countKey)) || 0;
        const usesRemaining = isDev ? 99 : Math.max(0, LIMIT_PER_IP - count);

        if (session) {
            const parsed = typeof session === "string" ? JSON.parse(session) : session;
            return Response.json({
                exists: true,
                session: parsed,
                usesRemaining,
            });
        }

        return Response.json({ exists: false, usesRemaining });
    } catch (error) {
        console.error("Session check error:", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
