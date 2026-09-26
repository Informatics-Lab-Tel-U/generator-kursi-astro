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

// L1 in-memory read cache: skip KV read jika data masih fresh (< 2.5 detik)
// TTL harus lebih pendek dari polling interval script Moodle (5s) dan browser (5s)
const readCache = new Map<string, { data: any[]; expiry: number }>();
const READ_CACHE_TTL_MS = 2_500;

export async function saveLeaderboardData(
    room: string,
    data: any[],
): Promise<{ kvSaved: boolean }> {
    const normalizedRoom = normalizeRoomId(room);
    const key = `leaderboard:${normalizedRoom}`;

    leaderboardStore.set(normalizedRoom, data);
    // Invalidate read cache so next GET langsung ambil dari KV
    readCache.delete(normalizedRoom);

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
    const now = Date.now();

    // L1 hit: kembalikan cache tanpa sentuh KV
    const cached = readCache.get(normalizedRoom);
    if (cached && now < cached.expiry) {
        return cached.data;
    }

    try {
        const kv = await getKV();
        if (kv) {
            const raw = await kv.get(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    leaderboardStore.set(normalizedRoom, parsed);
                    readCache.set(normalizedRoom, { data: parsed, expiry: now + READ_CACHE_TTL_MS });
                    return parsed;
                }
            }
        }
    } catch (err) {
        console.warn("[LeaderboardStorage] KV get error:", err);
    }

    return leaderboardStore.get(normalizedRoom) || [];
}
