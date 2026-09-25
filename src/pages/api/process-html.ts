import type { APIRoute } from "astro";
import { parse } from "node-html-parser";
import { leaderboardStore, lastHtmlStore } from "../../lib/store";
import { saveLeaderboardData, normalizeRoomId } from "../../lib/leaderboardStorage";


export const prerender = false;

export const OPTIONS: APIRoute = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, ngrok-skip-browser-warning, *",
            "Access-Control-Max-Age": "86400",
        }
    });
};

export const ALL: APIRoute = async ({ request }) => {
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, ngrok-skip-browser-warning, *",
                "Access-Control-Max-Age": "86400",
            }
        });
    }
    return new Response(null, { status: 405 });
};

export const POST: APIRoute = async ({ request, url, locals }) => {
    try {
        const rawRoom = url.searchParams.get("room") || "default";
        const room = normalizeRoomId(rawRoom);
        
        // Security: Prevent DoS from excessively large HTML payloads (max 3 MB)
        const MAX_PAYLOAD_BYTES = 3 * 1024 * 1024;
        let body: any;
        try {
            const raw = await request.text();
            if (raw.length > MAX_PAYLOAD_BYTES) {
                return new Response(JSON.stringify({ error: "Payload too large. Maximum size is 3MB." }), {
                    status: 413,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                });
            }
            body = raw ? JSON.parse(raw) : {};
        } catch {
            body = {};
        }
        const html = body.html;

        if (!html) {
            return new Response(JSON.stringify({ error: "No HTML provided" }), { 
                status: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }

        // Optimasi Cloudflare Workers: Jika HTML identik dengan sebelumnya, skip CPU-heavy parsing
        if (lastHtmlStore.get(room) === html) {
            const cachedData = leaderboardStore.get(room) || [];
            return new Response(JSON.stringify({ success: true, count: cachedData.length, unchanged: true }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }
        lastHtmlStore.set(room, html);

        const root = parse(html);
        
        // Clean up noise elements that mess up textContent extraction
        root.querySelectorAll('.accesshide, .reviewlink, .commands').forEach(el => el.remove());

        const rows = root.querySelectorAll("tbody tr");
        const headers = root.querySelectorAll("thead th").map(th => th.textContent.trim().replace(/\s+/g, ' '));
        
        const data = [];

        for (const row of rows) {
            // Skip empty rows and divider rows
            if (row.classList.contains("emptyrow") || row.querySelector(".tabledivider")) continue;

            const cells = row.querySelectorAll("td");
            if (cells.length === 0) continue;

            const rowData: Record<string, string> = {};
            let isRelevant = false;

            cells.forEach((cell, index) => {
                const header = headers[index] || `Column ${index}`;
                // Some nodes like icons might still be there, but textContent will ignore them
                let text = cell.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
                
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

            // Handle standard Moodle columns across English and Indonesian LMS
            const firstName = getValue("First name", "Nama depan");
            const surname = getValue("Surname", "Last name", "Nama akhir", "Nama belakang");
            if (firstName || surname) {
                rowData["NAME"] = `${firstName} ${surname}`.trim();
            } else {
                const combinedName = getValue(
                    "First name / Surname",
                    "First name / Last name",
                    "Nama depan / Nama akhir",
                    "Nama depan / Nama belakang",
                    "Nama Lengkap",
                    "Nama Mahasiswa",
                    "Nama Siswa",
                    "User full name",
                    "Full name",
                    "Name",
                    "Nama"
                );
                if (combinedName) rowData["NAME"] = combinedName;
            }

            // Exclude summary rows such as 'Overall average' or 'Rata-rata keseluruhan'
            if (!rowData["NAME"] || /overall average|rata-rata/i.test(rowData["NAME"])) {
                continue;
            }

            // Translate state/status for consistency (supports English & Indonesian LMS)
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

            // Duration / Time taken
            const rawDuration = getValue("Duration", "Time taken", "Durasi", "Waktu yang diperlukan");
            if (rawDuration) {
                rowData["TIME TAKEN"] = rawDuration;
            }

            // ID number / NIM
            const rawNim = getValue("ID number", "Nomor ID", "NIM");
            if (rawNim) {
                rowData["NIM"] = rawNim;
                rowData["ID NUMBER"] = rawNim;
            }

            // Grade
            const gradeKey = Object.keys(rowData).find(k => /^(grade|nilai)/i.test(k));
            if (gradeKey && rowData[gradeKey]) {
                rowData["GRADE"] = rowData[gradeKey];
            }

            if (isRelevant && rowData["NAME"]) {
                const lowerName = rowData["NAME"].toLowerCase();
                const isAggregate = (lowerName.includes("overall") && lowerName.includes("average")) || lowerName.includes("rata-rata");
                if (!isAggregate) {
                    data.push(rowData);
                }
            }
        }

        const { kvSaved } = await saveLeaderboardData(room, data, locals);

        return new Response(JSON.stringify({ 
            success: true, 
            count: data.length, 
            kvSaved 
        }), {
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
