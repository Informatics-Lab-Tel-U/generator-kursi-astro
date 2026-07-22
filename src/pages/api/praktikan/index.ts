import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const kelas = url.searchParams.get("kelas");
        const matkul = url.searchParams.get("mata_kuliah");

        const apiKey = env.PRAKTIKAN_GET_API_KEY || process.env["PRAKTIKAN_GET_API_KEY"] || "";
        const apiUrl = env.PRAKTIKAN_API_URL || process.env["PRAKTIKAN_API_URL"] || "http://localhost:3001";

        const headers = new Headers();
        headers.set("x-praktikan-api-key", apiKey);
        headers.set("x-api-key", apiKey);
        headers.set("Authorization", `Bearer ${apiKey}`);

        const params = new URLSearchParams();
        if (matkul) params.set("mata_kuliah", matkul);
        if (kelas) params.set("kelas", kelas);

        const targetUrl = `${apiUrl}/api/praktikan?${params.toString()}`;
        console.log(`[EXTERNAL_API] Requesting praktikan from: GET ${targetUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const fetcher = typeof env.MANAJEMEN_ASPRAK !== "undefined" ? env.MANAJEMEN_ASPRAK : globalThis;
        const res = await fetcher.fetch(targetUrl, { headers, signal: controller.signal });
        clearTimeout(timeoutId);

        const proxyHeaders = new Headers(res.headers);
        proxyHeaders.delete("content-encoding");
        proxyHeaders.delete("content-length");

        return new Response(res.body, {
            status: res.status,
            headers: {
                "Content-Type": "application/json",
                ...Object.fromEntries(proxyHeaders.entries())
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
