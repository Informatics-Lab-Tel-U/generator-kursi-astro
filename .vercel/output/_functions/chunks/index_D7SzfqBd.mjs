const prerender = false;
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const kelas = url.searchParams.get("kelas");
    const matkul = url.searchParams.get("mata_kuliah");
    const apiKey = process.env["PRAKTIKAN_GET_API_KEY"] || "YOUR_PRAKTIKAN_GET_API_KEY";
    const apiUrl = process.env["PRAKTIKAN_API_URL"] || "http://localhost:3000";
    const headers = new Headers();
    headers.set("x-praktikan-api-key", apiKey);
    headers.set("x-api-key", apiKey);
    headers.set("Authorization", `Bearer ${apiKey}`);
    const params = new URLSearchParams();
    if (matkul) params.set("mata_kuliah", matkul);
    if (kelas) params.set("kelas", kelas);
    const targetUrl = `${apiUrl}/api/praktikan?${params.toString()}`;
    console.log(`[EXTERNAL_API] Requesting praktikan from: GET ${targetUrl}`);
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
