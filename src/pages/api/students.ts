import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
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
        
        const env = (locals as any)?.runtime?.env || {};
        const apiKey = env.PRAKTIKAN_GET_API_KEY || process.env["PRAKTIKAN_GET_API_KEY"] || import.meta.env.PRAKTIKAN_GET_API_KEY || "";
        const apiUrl = env.PRAKTIKAN_API_URL || process.env["PRAKTIKAN_API_URL"] || import.meta.env.PRAKTIKAN_API_URL || "http://localhost:3001";
        
        const backendUrl = `${apiUrl}/api/praktikan?kelas=${encodeURIComponent(kelas)}&mata_kuliah=${encodeURIComponent(matkul)}`;
        
        const headers = new Headers(request.headers);
        headers.delete("host");
        headers.set("x-praktikan-api-key", apiKey);
        headers.set("x-api-key", apiKey);
        headers.set("Authorization", `Bearer ${apiKey}`);
        
        console.log(`[EXTERNAL_API] Requesting students from: GET ${backendUrl}`);
        
        const res = await fetch(backendUrl, {
            headers
        });
        
        const data = await res.json();
        
        return new Response(JSON.stringify(data), {
            status: res.status,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
