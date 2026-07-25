import type { APIRoute } from "astro";
import { fetchBackendApi } from "../../../lib/apiHelper";

export const prerender = false;

export const GET: APIRoute = async () => {
    console.log("[mata-kuliah] Handler dipanggil");
    console.log("[mata-kuliah] import.meta.env.PUBLIC_PRAKTIKAN_GET_API_KEY present:", !!import.meta.env.PUBLIC_PRAKTIKAN_GET_API_KEY);
    console.log("[mata-kuliah] import.meta.env.PUBLIC_PRAKTIKAN_GET_API_KEY length:", (import.meta.env.PUBLIC_PRAKTIKAN_GET_API_KEY || "").length);
    console.log("[mata-kuliah] import.meta.env.PUBLIC_PRAKTIKAN_API_URL:", import.meta.env.PUBLIC_PRAKTIKAN_API_URL || "(empty)");

    try {
        console.log("[mata-kuliah] Memanggil fetchBackendApi...");
        const res = await fetchBackendApi("/api/praktikan?action=options");
        console.log("[mata-kuliah] fetchBackendApi selesai, status:", res.status);

        const cloned = res.clone();
        console.log("[mata-kuliah] Response di-clone, membaca JSON...");
        const json = await cloned.json().catch((e: any) => {
            console.log("[mata-kuliah] JSON parse gagal:", e?.message);
            return null;
        });
        console.log("[mata-kuliah] JSON result:", JSON.stringify(json)?.slice(0, 100));

        if (json?.ok && Array.isArray(json?.data?.mata_kuliah)) {
            console.log("[mata-kuliah] Data mata_kuliah ditemukan, jumlah:", json.data.mata_kuliah.length);
            return new Response(
                JSON.stringify({ ok: true, data: json.data.mata_kuliah }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log("[mata-kuliah] Fallback: return original response as-is (status:", res.status, ")");
        return res;
    } catch (e: any) {
        console.error("[mata-kuliah] CATCH ERROR:", e?.name, e?.message, e?.stack);
        return new Response(JSON.stringify({ ok: false, error: "Server Error", details: String(e), name: e?.name }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
