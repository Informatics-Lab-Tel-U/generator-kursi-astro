import type { APIRoute } from "astro";
import { parse } from "node-html-parser";
import { leaderboardStore } from "../../lib/store";


export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning, Authorization",
            }
        });
    }
    return new Response(null, { status: 405 });
};

export const POST: APIRoute = async ({ request, url }) => {
    try {
        const room = url.searchParams.get("room") || "default";
        const body = await request.json();
        const html = body.html;

        if (!html) {
            return new Response(JSON.stringify({ error: "No HTML provided" }), { status: 400 });
        }

        const root = parse(html);
        
        // Clean up noise elements that mess up textContent extraction
        root.querySelectorAll('.accesshide, .reviewlink, .commands').forEach(el => el.remove());

        const rows = root.querySelectorAll("tbody tr");
        const headers = root.querySelectorAll("thead th").map(th => th.textContent.trim().replace(/\s+/g, ' '));
        
        const data = [];

        for (const row of rows) {
            const cells = row.querySelectorAll("td");
            if (cells.length === 0) continue;

            const rowData: Record<string, string> = {};
            let isRelevant = false;

            cells.forEach((cell, index) => {
                const header = headers[index] || `Column ${index}`;
                // Some nodes like icons might still be there, but textContent will ignore them
                let text = cell.textContent.trim().replace(/\s+/g, ' ');
                
                rowData[header] = text;
                if (text && text !== '-' && text !== 'Not yet graded') {
                    isRelevant = true;
                }
            });

            // Helper to get value case-insensitively
            const getValue = (...keys: string[]) => {
                for (const k of keys) {
                    const foundKey = Object.keys(rowData).find(
                        (rk) => rk.trim().toLowerCase() === k.toLowerCase()
                    );
                    if (foundKey && rowData[foundKey]) return rowData[foundKey];
                }
                return "";
            };

            // Handle standard Moodle columns
            const firstName = getValue("First name", "Nama depan");
            const surname = getValue("Surname", "Nama akhir");
            if (firstName || surname) {
                rowData["NAME"] = `${firstName} ${surname}`.trim();
            } else {
                const combinedName = getValue(
                    "First name / Last name",
                    "Nama depan / Nama akhir",
                    "Name",
                    "Nama"
                );
                if (combinedName) rowData["NAME"] = combinedName;
            }

            // Translate state for consistency
            const rawState = getValue("Status", "State", "Keadaan");
            if (rawState) {
                const lower = rawState.toLowerCase();
                if (lower.includes("selesai") || lower.includes("finish")) {
                    rowData["STATE"] = "Finished";
                } else if (lower.includes("sedang") || lower.includes("progress")) {
                    rowData["STATE"] = "In progress";
                } else {
                    rowData["STATE"] = rawState;
                }
            }

            const rawTime = getValue("Duration", "Time taken", "Durasi", "Waktu yang diperlukan");
            if (rawTime) {
                rowData["TIME TAKEN"] = rawTime;
            }

            if (isRelevant && rowData["NAME"]) {
                const lowerName = rowData["NAME"].toLowerCase();
                const isAggregate = (lowerName.includes("overall") && lowerName.includes("average")) || lowerName.includes("rata-rata");
                if (!isAggregate) {
                    data.push(rowData);
                }
            }
        }

        // Simpan ke in-memory store (murni temporary)
        leaderboardStore.set(room, data);

        return new Response(JSON.stringify({ success: true, count: data.length, kvSaved: false }), {
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
}
