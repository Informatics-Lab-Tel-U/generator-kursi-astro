import type { APIRoute } from "astro";
import { fetchBackendApi } from "@/lib/apiHelper";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const kelas = url.searchParams.get("kelas");
        const matkul = url.searchParams.get("mata_kuliah");

        const params = new URLSearchParams();
        if (matkul) params.set("mata_kuliah", matkul);
        if (kelas) params.set("kelas", kelas);

        return await fetchBackendApi(`/api/praktikan?${params.toString()}`);
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
