import type { APIRoute } from "astro";

export const prerender = false;

/**
 * DEBUG ENDPOINT — hapus setelah selesai debugging
 * GET /api/debug
 * Returns: env var status, tidak expose nilai asli (hanya first 6 char)
 */
export const GET: APIRoute = async ({ request }) => {
    const apiKey = import.meta.env.PUBLIC_PRAKTIKAN_GET_API_KEY
        || import.meta.env.PRAKTIKAN_GET_API_KEY
        || "";
    const apiUrl = import.meta.env.PUBLIC_PRAKTIKAN_API_URL
        || import.meta.env.PRAKTIKAN_API_URL
        || "";

    // Test fetch langsung ke backend
    let fetchTest: any = { status: "not_run" };
    try {
        const targetUrl = `${apiUrl || "https://manajemenasprak-backend.workers.dev"}/api/praktikan?action=options`;
        console.log("[debug] Testing fetch to:", targetUrl);
        console.log("[debug] API key present:", !!apiKey, "length:", apiKey.length);

        const res = await fetch(targetUrl, {
            headers: {
                "Content-Type": "application/json",
                "x-praktikan-api-key": apiKey,
                "x-api-key": apiKey,
                "Authorization": `Bearer ${apiKey}`,
            },
            signal: AbortSignal.timeout(8000),
        });

        const bodyText = await res.text();
        fetchTest = {
            status: res.status,
            ok: res.ok,
            bodyPreview: bodyText.slice(0, 200),
        };
    } catch (e: any) {
        fetchTest = {
            status: "error",
            name: e?.name,
            message: e?.message,
        };
    }

    return new Response(
        JSON.stringify({
            timestamp: new Date().toISOString(),
            env: {
                PUBLIC_PRAKTIKAN_GET_API_KEY_present: !!apiKey,
                PUBLIC_PRAKTIKAN_GET_API_KEY_length: apiKey.length,
                PUBLIC_PRAKTIKAN_GET_API_KEY_prefix: apiKey ? apiKey.slice(0, 6) + "..." : "(empty)",
                PUBLIC_PRAKTIKAN_API_URL_present: !!apiUrl,
                PUBLIC_PRAKTIKAN_API_URL_value: apiUrl || "(empty — will use default)",
                BUILD_MODE: import.meta.env.MODE,
                DEV: import.meta.env.DEV,
            },
            fetchTest,
        }, null, 2),
        {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }
    );
};
