import type { APIRoute } from "astro";
import { getLeaderboardData, normalizeRoomId } from "../../lib/leaderboardStorage";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
    try {
        const rawRoom = url.searchParams.get("room") || "default";
        const room = normalizeRoomId(rawRoom);

        const rawData = await getLeaderboardData(room, locals);
        const data = Array.isArray(rawData)
            ? rawData.map((row: Record<string, any>) => ({
                NAME: row["NAME"] || "Unknown",
                STATE: row["STATE"] || "-",
                "TIME TAKEN": row["TIME TAKEN"] || "-",
            }))
            : [];

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=2, s-maxage=3, stale-while-revalidate=5",
            },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server Error", details: String(e) }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
};

