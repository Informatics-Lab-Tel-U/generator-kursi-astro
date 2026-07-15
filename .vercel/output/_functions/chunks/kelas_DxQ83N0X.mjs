const prerender = false;
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const mataKuliah = url.searchParams.get("mata_kuliah") || url.searchParams.get("matakuliah");
    if (!mataKuliah) {
      return new Response(JSON.stringify({ ok: false, error: "mata_kuliah wajib diisi" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const apiKey = process.env["PRAKTIKAN_GET_API_KEY"] || "YOUR_PRAKTIKAN_GET_API_KEY";
    const apiUrl = process.env["PRAKTIKAN_API_URL"] || "http://localhost:3000";
    const headers = new Headers();
    headers.set("x-praktikan-api-key", apiKey);
    headers.set("x-api-key", apiKey);
    headers.set("Authorization", `Bearer ${apiKey}`);
    const targetUrl = `${apiUrl}/api/praktikan/kelas?mata_kuliah=${encodeURIComponent(mataKuliah)}`;
    console.log(`[EXTERNAL_API] Requesting kelas from: GET ${targetUrl}`);
    const res = await fetch(targetUrl, { headers });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "Server Error", details: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    GET,
    prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
