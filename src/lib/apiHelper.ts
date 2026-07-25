// Cloudflare Workers: runtime env harus dibaca via 'cloudflare:workers', BUKAN import.meta.env
// import.meta.env di server-side CF Workers = build-time substitution only
// Ref: https://docs.astro.build/en/guides/integrations-guide/cloudflare/
import { env as cfEnv } from 'cloudflare:workers';

const FETCH_TIMEOUT_MS = 10_000; // 10 detik

export async function fetchBackendApi(pathAndQuery: string, reqHeaders?: Headers) {
    // Runtime env dari Cloudflare Workers bindings/vars (wrangler.jsonc vars section)
    const runtimeApiKey: string = (cfEnv as any).PUBLIC_PRAKTIKAN_GET_API_KEY
        || (cfEnv as any).PRAKTIKAN_GET_API_KEY
        || '';
    const runtimeApiUrl: string = (cfEnv as any).PUBLIC_PRAKTIKAN_API_URL
        || (cfEnv as any).PRAKTIKAN_API_URL
        || '';

    // Fallback ke build-time import.meta.env (untuk local dev / astro dev)
    const apiKey = runtimeApiKey
        || import.meta.env.PUBLIC_PRAKTIKAN_GET_API_KEY
        || import.meta.env.PRAKTIKAN_GET_API_KEY
        || "";
    const apiUrl = runtimeApiUrl
        || import.meta.env.PUBLIC_PRAKTIKAN_API_URL
        || import.meta.env.PRAKTIKAN_API_URL
        || "https://manajemenasprak-backend.workers.dev";

    if (!apiKey) {
        console.warn("[apiHelper] WARNING: API key tidak tersedia (PUBLIC_PRAKTIKAN_GET_API_KEY kosong)");
    }

    const targetUrl = `${apiUrl}${pathAndQuery}`;
    console.info("[apiHelper] Fetching:", targetUrl);

    const headers = new Headers(reqHeaders);
    headers.delete("host");
    headers.set("x-praktikan-api-key", apiKey);
    headers.set("x-api-key", apiKey);
    headers.set("Authorization", `Bearer ${apiKey}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const res = await fetch(targetUrl, {
            headers,
            signal: controller.signal,
        });

        console.info("[apiHelper] Response status:", res.status, "for", targetUrl);

        const proxyHeaders = new Headers(res.headers);
        proxyHeaders.delete("content-encoding");
        proxyHeaders.delete("content-length");

        return new Response(res.body, {
            status: res.status,
            headers: {
                "Content-Type": "application/json",
                ...Object.fromEntries(proxyHeaders.entries()),
            },
        });
    } catch (e: any) {
        if (e?.name === "AbortError") {
            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "Request timeout",
                    details: `Backend tidak merespons dalam ${FETCH_TIMEOUT_MS / 1000} detik`,
                }),
                {
                    status: 504,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
        console.error("[apiHelper] unhandled error:", e?.name, e?.message, e?.stack);
        throw e;
    } finally {
        clearTimeout(timeoutId);
    }
}
