import type { APIRoute } from "astro";
import { parse } from "node-html-parser";
import { lastHtmlStore, leaderboardStore } from "../../lib/store";
import { normalizeRoomId } from "../../lib/leaderboardStorage";
import { env } from "cloudflare:workers";

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

export const POST: APIRoute = async ({ request, url }) => {
    try {
        const rawRoom = url.searchParams.get("room") || "default";
        const room = normalizeRoomId(rawRoom);

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

        if (lastHtmlStore.get(room) === html) {
            const cachedData = leaderboardStore.get(room) || [];
            return new Response(JSON.stringify({ success: true, count: cachedData.length, unchanged: true }), {
                status: 200,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }
        lastHtmlStore.set(room, html);

        const root = parse(html);
        root.querySelectorAll('.accesshide, .reviewlink, .commands').forEach(el => el.remove());

        const rows = root.querySelectorAll("tbody tr");
        const headers = root.querySelectorAll("thead th").map(th => th.textContent.trim().replace(/\s+/g, ' '));

        const data = [];

        for (const row of rows) {
            if (row.classList.contains("emptyrow") || row.querySelector(".tabledivider")) continue;

            const cells = row.querySelectorAll("td");
            if (cells.length === 0) continue;

            const rowData: Record<string, string> = {};
            let isRelevant = false;

            cells.forEach((cell, index) => {
                const header = headers[index] || `Column ${index}`;
                const text = cell.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
                rowData[header] = text;
                if (text && text !== '-' && text !== 'Not yet graded') {
                    isRelevant = true;
                }
            });

            // Header lookup: exact match first, then startsWith to handle
            // Moodle's sort link text appended to TH (e.g. "StatusSort by Status Ascending")
            const getValue = (...keys: string[]) => {
                for (const k of keys) {
                    const kLower = k.toLowerCase();
                    const exact = Object.keys(rowData).find(rk => rk.trim().toLowerCase() === kLower);
                    if (exact && rowData[exact]) return rowData[exact];
                    const starts = Object.keys(rowData).find(rk => rk.trim().toLowerCase().startsWith(kLower));
                    if (starts && rowData[starts]) return rowData[starts];
                }
                return "";
            };

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

            if (!rowData["NAME"] || /overall average|rata-rata/i.test(rowData["NAME"])) continue;

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

            const rawDuration = getValue("Duration", "Time taken", "Durasi", "Waktu yang diperlukan");
            if (rawDuration) rowData["TIME TAKEN"] = rawDuration;

            const rawNim = getValue("ID number", "Nomor ID", "NIM");
            if (rawNim) rowData["NIM"] = rawNim;

            const gradeKey = Object.keys(rowData).find(k => /^(grade|nilai)/i.test(k));
            if (gradeKey && rowData[gradeKey]) rowData["GRADE"] = rowData[gradeKey];

            if (isRelevant) data.push(rowData);
        }

        let doPushed = false;
        const do_ = env.LEADERBOARD_DO;
        if (do_) {
            try {
                const doId = do_.idFromName(room);
                const stub = do_.get(doId);
                await stub.fetch(new Request("https://do/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ data }),
                }));
                doPushed = true;
            } catch (e) {
                console.warn("[LeaderboardDO] push error:", e);
            }
        }

        return new Response(JSON.stringify({ success: true, count: data.length, doPushed }), {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server Error", details: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    }
}
