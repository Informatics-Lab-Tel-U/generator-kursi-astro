import type { APIRoute } from "astro";
import { normalizeRoomId } from "../../lib/leaderboardStorage";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async ({ url, request }) => {
    const rawRoom = url.searchParams.get("room") || "default";
    const room = normalizeRoomId(rawRoom);

    const upgradeHeader = request.headers.get("Upgrade");
    const do_ = env.LEADERBOARD_DO;

    if (!do_) {
        console.error("[Leaderboard API] ❌ LEADERBOARD_DO binding not available");
        return new Response("LEADERBOARD_DO binding not available", { status: 503 });
    }

    const doId = do_.idFromName(room);
    const stub = do_.get(doId);
    const doUrl = new URL(request.url);
    doUrl.pathname = "/";

    if (upgradeHeader === "websocket") {
        console.log(`[Leaderboard API] 🔌 WebSocket upgrade request for room: ${room}`);
        try {
            const response = await stub.fetch(request);
            console.log(`[Leaderboard API] ✅ WebSocket upgrade successful for room: ${room}`);
            return response;
        } catch (err: any) {
            console.error("[Leaderboard API] ❌ WebSocket connection error:", err);
            return new Response("WebSocket connection error", { status: 500 });
        }
    }

    // Fallback: HTTP GET untuk /api/leaderboard?room=... tanpa WebSocket
    console.log(`[Leaderboard API] 📥 HTTP GET request for room: ${room}`);
    const resp = await stub.fetch(new Request(doUrl.toString(), { method: "GET" }));
    const data = await resp.json() as any[];

    const normalized = Array.isArray(data)
        ? data.map((row: Record<string, any>) => ({
            NAME: row["NAME"] || "Unknown",
            STATE: row["STATE"] || "-",
            "TIME TAKEN": row["TIME TAKEN"] || "-",
        }))
        : [];

    return new Response(JSON.stringify(normalized), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    });
};
