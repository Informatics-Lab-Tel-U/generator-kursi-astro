import type { APIRoute } from "astro";
import { fetchBackendApi } from "@/lib/apiHelper";

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        return await fetchBackendApi("/api/praktikan/mata-kuliah");
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
