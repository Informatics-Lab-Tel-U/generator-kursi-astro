import type { APIRoute } from "astro";


export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
    try {
        const room = url.searchParams.get("room") || "default";

        return new Response(JSON.stringify([]), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "X-KV-Status": "not-configured",
            },
        });



    } catch (e) {
        return new Response(JSON.stringify({ error: "Server Error", details: String(e) }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
}

