import { env } from "cloudflare:workers";

const FETCH_TIMEOUT_MS = 10_000; // 10 detik — cukup untuk cold start CF Worker

export async function fetchBackendApi(pathAndQuery: string, reqHeaders?: Headers) {
    const anyEnv = env as any;
    const apiKey = anyEnv.PRAKTIKAN_GET_API_KEY || process.env["PRAKTIKAN_GET_API_KEY"] || "";
    const apiUrl = anyEnv.PRAKTIKAN_API_URL || process.env["PRAKTIKAN_API_URL"] || "https://manajemenasprak.abiyyurahid20.workers.dev";

    console.log("[apiHelper] apiKey present:", Boolean(apiKey), "| len:", apiKey.length, "| from env:", Boolean(anyEnv.PRAKTIKAN_GET_API_KEY), "| from process.env:", Boolean(process.env["PRAKTIKAN_GET_API_KEY"]));
    const targetUrl = `${apiUrl}${pathAndQuery}`;

    const headers = new Headers(reqHeaders);
    headers.delete("host");
    headers.set("x-praktikan-api-key", apiKey);
    headers.set("x-api-key", apiKey);
    headers.set("Authorization", `Bearer ${apiKey}`);

    const hasSvcBinding = typeof anyEnv.MANAJEMEN_ASPRAK !== "undefined";

    // AbortController hanya untuk globalThis.fetch (public URL).
    // Service binding CF tidak support AbortSignal — jika signal dipakai, langsung throw TypeError.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        let res: Response | null = null;

        // 1. Coba via service binding (tanpa signal — CF tidak support)
        if (hasSvcBinding) {
            try {
                res = await anyEnv.MANAJEMEN_ASPRAK.fetch(targetUrl, { headers });
            } catch (bindingErr) {
                // Binding gagal (service tidak ada di local dev, dll) → fallback ke public URL
                console.error("[apiHelper] service binding error:", bindingErr);
                res = null;
            }
        }

        // 2. Fallback ke public URL: saat binding tidak ada, binding throw error, atau binding return 503
        if (!res || res.status === 503) {
            console.log("[apiHelper] using globalThis.fetch →", targetUrl);
            res = await globalThis.fetch(targetUrl, {
                headers,
                signal: controller.signal, // timeout hanya untuk public fetch
            });
            console.log("[apiHelper] globalThis.fetch status:", res.status);
        }

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
        // AbortError = timeout 10 detik — kembalikan 504 yang jelas daripada biarkan hang
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
