import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        const apiKey = env.PRAKTIKAN_GET_API_KEY || process.env["PRAKTIKAN_GET_API_KEY"] || "";
        const apiUrl = env.PRAKTIKAN_API_URL || process.env["PRAKTIKAN_API_URL"] || "http://localhost:3001";
        
        const headers = new Headers(request.headers);
        headers.delete("host");
        headers.set("x-praktikan-api-key", apiKey);
        headers.set("x-api-key", apiKey);
        headers.set("Authorization", `Bearer ${apiKey}`);
        
        const targetUrl = `${apiUrl}/api/praktikan?action=options`;
        console.log(`[EXTERNAL_API] Requesting options from: GET ${targetUrl}`);
        
        const res = await fetch(targetUrl, {
            headers
        });
        
        return new Response(res.body, {
            status: res.status,
            headers: {
                "Content-Type": "application/json",
                ...Object.fromEntries(res.headers.entries())
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
