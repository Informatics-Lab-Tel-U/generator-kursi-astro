/**
 * scheduleConfig.ts
 * Satu-satunya sumber kebenaran untuk semua konstanta bisnis.
 * Edit di sini → berlaku di seluruh aplikasi.
 */

// --- Jadwal Sesi Per Hari ---
// Index = getDay(): 0=Minggu, 1=Senin, ..., 6=Sabtu

export const DAY_SESSIONS: Record<number, { start: string; end: string }[]> = {
    1: [
        { start: "06:40", end: "08:20" },
        { start: "09:40", end: "11:20" },
        { start: "12:40", end: "14:20" },
        { start: "15:40", end: "17:20" },
    ],
    2: [
        { start: "06:40", end: "08:20" },
        { start: "09:40", end: "11:20" },
        { start: "12:40", end: "14:20" },
        { start: "15:40", end: "17:20" },
    ],
    3: [
        { start: "06:40", end: "08:20" },
        { start: "09:40", end: "11:20" },
        { start: "12:40", end: "14:20" },
        { start: "15:40", end: "17:20" },
    ],
    4: [
        { start: "06:40", end: "08:20" },
        { start: "09:40", end: "11:20" },
        { start: "12:40", end: "14:20" },
        { start: "15:40", end: "17:20" },
    ],
    5: [
        { start: "07:40", end: "09:20" },
        { start: "13:40", end: "15:20" },
    ],
    6: [
        { start: "07:40", end: "09:20" },
        { start: "10:40", end: "12:20" },
        { start: "13:40", end: "15:20" },
        { start: "16:40", end: "18:20" },
    ],
};

export const FALLBACK_SESSION = { start: "08:00", end: "10:00" } as const;

// --- Durasi Blok Template ---

export const TEMPLATE_DURATIONS = {
    JURNAL_MENIT: 90,
    GAP_AKHIR_MENIT: 5,
    TES_AKHIR_MENIT: 5,
    TES_AWAL_MENIT: 10,
} as const;

// --- Warna Blok ---

export const BLOCK_COLOR = {
    JURNAL:  "#6366f1",
    GAP:     "#f59e0b",
    TES:     "#10b981",
    PINK:    "#ec4899",
    BLUE:    "#3b82f6",
    VIOLET:  "#8b5cf6",
} as const;

export const BLOCK_COLOR_SEQUENCE = [
    "#6366f1",
    "#f59e0b",
    "#10b981",
    "#ec4899",
    "#3b82f6",
    "#8b5cf6",
] as const;

// --- Threshold Timer ---

export const TIMER_WARNING_MS = 603_000;
export const TIMER_DANGER_MS  =  63_000;

// --- Auto-Advance ---

export const AUTO_ADVANCE_DELAY_MS = 1_500;

// --- Deteksi Blok Gap ---

export const GAP_BLOCK_PATTERN = /gap|istirahat|jeda|persiapan|break/i;

// --- Channel Proyektor ---

export const PROJECTOR_CHANNEL_NAME = "kursi-gen-sync";
