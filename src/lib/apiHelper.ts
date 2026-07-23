const FETCH_TIMEOUT_MS = 10_000; // 10 detik

export async function fetchBackendApi(pathAndQuery: string, reqHeaders?: Headers) {
    // Menggunakan import.meta.env (Astro) atau process.env sebagai fallback
    const apiKey = import.meta.env.PUBLIC_PRAKTIKAN_GET_API_KEY || import.meta.env.PRAKTIKAN_GET_API_KEY || process.env.PUBLIC_PRAKTIKAN_GET_API_KEY || process.env.PRAKTIKAN_GET_API_KEY || "";
    const apiUrl = import.meta.env.PRAKTIKAN_API_URL || process.env.PRAKTIKAN_API_URL || "https://manajemenasprak.iflabdev.workers.dev";

    const targetUrl = `${apiUrl}${pathAndQuery}`;

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
