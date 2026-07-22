import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const mataKuliah = url.searchParams.get("mata_kuliah") || url.searchParams.get("matakuliah");

        if (!mataKuliah) {
            return new Response(JSON.stringify({ ok: false, error: "mata_kuliah wajib diisi" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const apiKey = env.PRAKTIKAN_GET_API_KEY || process.env["PRAKTIKAN_GET_API_KEY"] || "";
        const apiUrl = env.PRAKTIKAN_API_URL || process.env["PRAKTIKAN_API_URL"] || "http://localhost:3001";

        const headers = new Headers();
        headers.set("x-praktikan-api-key", apiKey);
        headers.set("x-api-key", apiKey);
        headers.set("Authorization", `Bearer ${apiKey}`);

        const targetUrl = `${apiUrl}/api/praktikan/kelas?mata_kuliah=${encodeURIComponent(mataKuliah)}`;
        console.log(`[EXTERNAL_API] Requesting kelas from: GET ${targetUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(targetUrl, { headers, signal: controller.signal });
        clearTimeout(timeoutId);

        return new Response(res.body, {
            status: res.status,
            headers: {
                "Content-Type": "application/json",
                ...Object.fromEntries(res.headers.entries())
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
