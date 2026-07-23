import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";


export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
    try {
        const room = url.searchParams.get("room") || "default";

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

        const data = await kvStore.get(`leaderboard:${room}`);
        
        return new Response(data || "[]", {
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

