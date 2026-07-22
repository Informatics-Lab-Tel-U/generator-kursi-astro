import type { APIRoute } from "astro";
import { fetchBackendApi } from "../../lib/apiHelper";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        return await fetchBackendApi("/api/praktikan?action=options", request.headers);
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
