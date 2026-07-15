import { parse } from 'node-html-parser';
import { kv } from '@vercel/kv';

const prerender = false;
const ALL = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning, Authorization"
      }
    });
  }
  return new Response(null, { status: 405 });
};
const POST = async ({ request, url }) => {
  try {
    const room = url.searchParams.get("room") || "default";
    const body = await request.json();
    const html = body.html;
    if (!html) {
      return new Response(JSON.stringify({ error: "No HTML provided" }), { status: 400 });
    }
    const root = parse(html);
    root.querySelectorAll(".accesshide, .reviewlink, .commands").forEach((el) => el.remove());
    const rows = root.querySelectorAll("tbody tr");
    const headers = root.querySelectorAll("thead th").map((th) => th.textContent.trim().replace(/\s+/g, " "));
    const data = [];
    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      if (cells.length === 0) continue;
      const rowData = {};
      let isRelevant = false;
      cells.forEach((cell, index) => {
        const header = headers[index] || `Column ${index}`;
        let text = cell.textContent.trim().replace(/\s+/g, " ");
        rowData[header] = text;
        if (text && text !== "-" && text !== "Not yet graded") {
          isRelevant = true;
        }
      });
      const firstName = rowData["First name"] || rowData["Nama depan"] || "";
      const surname = rowData["Surname"] || rowData["Nama akhir"] || "";
      if (firstName || surname) {
        rowData["NAME"] = `${firstName} ${surname}`.trim();
      } else if (rowData["First name / Last name"]) {
        rowData["NAME"] = rowData["First name / Last name"];
      } else if (rowData["Nama depan / Nama akhir"]) {
        rowData["NAME"] = rowData["Nama depan / Nama akhir"];
      } else if (rowData["Name"]) {
        rowData["NAME"] = rowData["Name"];
      } else if (rowData["Nama"]) {
        rowData["NAME"] = rowData["Nama"];
      }
      if (rowData["State"]) {
        rowData["STATE"] = rowData["State"];
      } else if (rowData["Keadaan"]) {
        if (rowData["Keadaan"].toLowerCase().includes("selesai")) {
          rowData["STATE"] = "Finished";
        } else if (rowData["Keadaan"].toLowerCase().includes("sedang")) {
          rowData["STATE"] = "In progress";
        } else {
          rowData["STATE"] = rowData["Keadaan"];
        }
      }
      if (rowData["Time taken"]) {
        rowData["TIME TAKEN"] = rowData["Time taken"];
      } else if (rowData["Waktu yang diperlukan"]) {
        rowData["TIME TAKEN"] = rowData["Waktu yang diperlukan"];
      }
      if (isRelevant && rowData["NAME"]) {
        data.push(rowData);
      }
    }
    await kv.set(`leaderboard:${room}`, data, { ex: 60 * 60 * 24 });
    return new Response(JSON.stringify({ success: true, count: data.length }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Server Error", details: String(e) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    ALL,
    POST,
    prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
