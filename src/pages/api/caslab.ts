import type { APIRoute } from "astro";
import { fetchBackendApi } from "../../lib/apiHelper";

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        const res = await fetchBackendApi("/api/web-config/caslab_plotting_state");
        const headers = new Headers(res.headers);
        headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        return new Response(res.body, {
            status: res.status,
            headers,
        });
    } catch (e) {
        return new Response(
            JSON.stringify({ ok: false, error: "Server Error", details: String(e) }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
};

export const PUT: APIRoute = async ({ request }) => {
    try {
        const body = await request.text();
        return await fetchBackendApi("/api/web-config/caslab_plotting_state", {
            method: "PUT",
            body,
        });
    } catch (e) {
        return new Response(
            JSON.stringify({ ok: false, error: "Server Error", details: String(e) }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
};

