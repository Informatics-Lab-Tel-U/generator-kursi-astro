import type { APIRoute } from "astro";
import { fetchBackendApi } from "../../../lib/apiHelper";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.text();
        return await fetchBackendApi("/api/monitoring/heartbeat", {
            method: "POST",
            body,
        });
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Monitoring Proxy Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
