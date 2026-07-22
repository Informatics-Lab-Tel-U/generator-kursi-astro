import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
    try {
        const room = url.searchParams.get("room") || "default";

        // Gunakan Cloudflare KV binding. Jika belum dikonfigurasi, return array kosong
        // agar leaderboard tidak hang/freeze.
        const kvStore = (env as any).LEADERBOARD_KV;
        if (!kvStore) {
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "X-KV-Status": "not-configured",
                },
            });
        }

        const raw = await kvStore.get(`leaderboard:${room}`, { type: "json" });

        return new Response(JSON.stringify(raw || []), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
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
}

