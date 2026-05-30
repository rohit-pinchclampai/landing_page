import { NextRequest } from "next/server";

// ─── POST /api/request-vip ─────────────────────────────────────────────────────
//
// Server-side VIP pass request handler.
// The client sends only { email }. The server extracts the IP from headers
// and dispatches both to the admin inbox via the EmailJS REST API.
//
// This solves the "client-side IP paradox" — the browser doesn't know its
// own public IP, but the server can read it from x-forwarded-for / x-real-ip.

function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();

    const realIP = req.headers.get("x-real-ip");
    if (realIP) return realIP.trim();

    return "127.0.0.1";
}

export async function POST(req: NextRequest) {
    try {
        const serviceId = process.env.EMAILJS_SERVICE_ID;
        const templateId = process.env.EMAILJS_VIP_TEMPLATE_ID;
        const publicKey = process.env.EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
            return new Response(
                JSON.stringify({ error: "EmailJS not configured on server" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await req.json();
        const { email, persona } = body as { email: string; persona?: string };

        if (!email || !email.includes("@")) {
            return new Response(
                JSON.stringify({ error: "Invalid email address" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const ip = getClientIP(req);
        const isAgentDemo = (persona || "").startsWith("Agent Demo");
        const redisCommand = isAgentDemo
            ? `DECRBY agent_count:${ip} 5`
            : `SET vip_pass:${ip} "true" EX 86400`;

        // Dispatch via the EmailJS REST API (no npm package needed server-side)
        const emailjsRes = await fetch(
            "https://api.emailjs.com/api/v1.0/email/send",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    service_id: serviceId,
                    template_id: templateId,
                    user_id: publicKey,
                    template_params: {
                        user_email: email,
                        user_ip: ip,
                        active_persona: persona || "Unknown",
                        redis_command: redisCommand,
                    },
                }),
            }
        );

        if (!emailjsRes.ok) {
            const errText = await emailjsRes.text();
            console.error("EmailJS error:", errText);
            return new Response(
                JSON.stringify({ error: "Failed to send VIP request" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: "VIP request sent" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("VIP request error:", error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
