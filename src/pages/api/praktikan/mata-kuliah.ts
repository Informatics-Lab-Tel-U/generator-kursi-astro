import type { APIRoute } from "astro";
import { fetchBackendApi } from "../../../lib/apiHelper";

export const prerender = false;

type MataKuliahApiResponse = {
    ok?: boolean;
    data?: {
        mata_kuliah?: unknown[];
    };
};

export const GET: APIRoute = async () => {
    try {
        const res = await fetchBackendApi("/api/praktikan?action=options");
        const json = (await res.clone().json().catch(() => null)) as MataKuliahApiResponse | null;

        if (json?.ok && Array.isArray(json?.data?.mata_kuliah)) {
            return new Response(
                JSON.stringify({ ok: true, data: json.data.mata_kuliah }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        return res;
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
