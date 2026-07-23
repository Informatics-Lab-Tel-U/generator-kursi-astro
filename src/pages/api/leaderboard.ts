import type { APIRoute } from "astro";
import { leaderboardStore } from "../../../lib/store";


export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
    try {
        const room = url.searchParams.get("room") || "default";

        const data = leaderboardStore.get(room) || [];
        
        return new Response(JSON.stringify(data), {
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

