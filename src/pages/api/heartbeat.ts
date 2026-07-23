import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        
        const MA_URL = import.meta.env.PUBLIC_MANAJEMENASPRAK_URL || "https://manajemenasprak.iflabdev.workers.dev";
        const API_KEY = import.meta.env.PRAKTIKAN_GET_API_KEY;

        if (!API_KEY) {
            return new Response(JSON.stringify({ error: "Missing API KEY in server env" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        const response = await fetch(`${MA_URL}/api/monitoring/heartbeat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-praktikan-api-key": API_KEY
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return new Response(JSON.stringify({ error: "Upstream error" }), { status: response.status, headers: { "Content-Type": "application/json" } });
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
};
