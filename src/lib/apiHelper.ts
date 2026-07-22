import { env } from "cloudflare:workers";

export async function fetchBackendApi(pathAndQuery: string, reqHeaders?: Headers) {
    const apiKey = env.PRAKTIKAN_GET_API_KEY || process.env["PRAKTIKAN_GET_API_KEY"] || "";
    const apiUrl = env.PRAKTIKAN_API_URL || process.env["PRAKTIKAN_API_URL"] || "https://manajemenasprak.abiyyurahid20.workers.dev";

    const targetUrl = `${apiUrl}${pathAndQuery}`;

    const headers = new Headers(reqHeaders);
    headers.delete("host");
    headers.set("x-praktikan-api-key", apiKey);
    headers.set("x-api-key", apiKey);
    headers.set("Authorization", `Bearer ${apiKey}`);

    let fetcher = typeof env.MANAJEMEN_ASPRAK !== "undefined" ? env.MANAJEMEN_ASPRAK : globalThis;
    let res = await fetcher.fetch(targetUrl, { headers });

    if (res.status === 503 && fetcher !== globalThis) {
        res = await globalThis.fetch(targetUrl, { headers });
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
}
