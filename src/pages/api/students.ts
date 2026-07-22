import type { APIRoute } from "astro";
import { fetchBackendApi } from "../../lib/apiHelper";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const kelas = url.searchParams.get("kelas");
        const matkul = url.searchParams.get("mata_kuliah");

        if (!kelas || !matkul) {
            return new Response(JSON.stringify({ error: "Missing kelas or mata_kuliah" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        return await fetchBackendApi(`/api/praktikan?kelas=${encodeURIComponent(kelas)}&mata_kuliah=${encodeURIComponent(matkul)}`, request.headers);
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
