import type { APIRoute } from "astro";
import { fetchBackendApi } from "@/lib/apiHelper";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const mataKuliah = url.searchParams.get("mata_kuliah") || url.searchParams.get("matakuliah");

        if (!mataKuliah) {
            return new Response(JSON.stringify({ ok: false, error: "mata_kuliah wajib diisi" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        return await fetchBackendApi(`/api/praktikan/kelas?mata_kuliah=${encodeURIComponent(mataKuliah)}`);
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
