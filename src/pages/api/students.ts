import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const kelas = url.searchParams.get("kelas");
        const matkul = url.searchParams.get("mata_kuliah");
        
        if (!kelas || !matkul) {
            return new Response(JSON.stringify({ error: "Missing kelas or mata_kuliah" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        const apiKey = env.PRAKTIKAN_GET_API_KEY || process.env["PRAKTIKAN_GET_API_KEY"] || "";
        const apiUrl = env.PRAKTIKAN_API_URL || process.env["PRAKTIKAN_API_URL"] || "http://localhost:3001";
        
        const backendUrl = `${apiUrl}/api/praktikan?kelas=${encodeURIComponent(kelas)}&mata_kuliah=${encodeURIComponent(matkul)}`;
        
        const headers = new Headers(request.headers);
        headers.delete("host");
        headers.set("x-praktikan-api-key", apiKey);
        headers.set("x-api-key", apiKey);
        headers.set("Authorization", `Bearer ${apiKey}`);
        
        console.log(`[EXTERNAL_API] Requesting students from: GET ${backendUrl}`);
        
        let fetcher = typeof env.MANAJEMEN_ASPRAK !== "undefined" ? env.MANAJEMEN_ASPRAK : globalThis;
        let res = await fetcher.fetch(backendUrl, { headers });
        if (res.status === 503 && fetcher !== globalThis) {
            console.log(`[EXTERNAL_API] Service binding returned 503, falling back to globalThis.fetch`);
            res = await globalThis.fetch(backendUrl, { headers });
        }
        
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
        return new Response(JSON.stringify({ error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
