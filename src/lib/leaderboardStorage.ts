import { leaderboardStore } from "./store";

export function normalizeRoomId(room?: string | null): string {
    if (!room) return "DEFAULT";
    const cleaned = room.trim().toUpperCase();
    return cleaned || "DEFAULT";
}

async function getKV(): Promise<any | null> {
    try {
        const { env } = await import("cloudflare:workers");
        const kv = (env as any)?.LEADERBOARD_KV;
        if (kv && typeof kv.put === "function") return kv;
    } catch {
        // Not a Cloudflare Workers environment (e.g. local dev)
    }
    return null;
}

export async function saveLeaderboardData(
    room: string,
    data: any[],
): Promise<{ kvSaved: boolean }> {
    const normalizedRoom = normalizeRoomId(room);
    const key = `leaderboard:${normalizedRoom}`;

    leaderboardStore.set(normalizedRoom, data);

    try {
        const kv = await getKV();
        if (kv) {
            await kv.put(key, JSON.stringify(data), {
                expirationTtl: 60 * 60 * 6, // 6 jam
            });
            return { kvSaved: true };
        }
    } catch (err) {
        console.warn("[LeaderboardStorage] KV put error:", err);
    }

    return { kvSaved: false };
}

export async function getLeaderboardData(
    room: string,
): Promise<any[]> {
    const normalizedRoom = normalizeRoomId(room);
    const key = `leaderboard:${normalizedRoom}`;

    try {
        const kv = await getKV();
        if (kv) {
            const raw = await kv.get(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    leaderboardStore.set(normalizedRoom, parsed);
                    return parsed;
                }
            }
        }
    } catch (err) {
        console.warn("[LeaderboardStorage] KV get error:", err);
    }

    return leaderboardStore.get(normalizedRoom) || [];
}
