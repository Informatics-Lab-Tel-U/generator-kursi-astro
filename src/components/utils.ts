import type { SeatData } from './types';
import {
  DAY_SESSIONS,
  FALLBACK_SESSION,
  TEMPLATE_DURATIONS,
  BLOCK_COLOR,
  GAP_BLOCK_PATTERN,
} from './scheduleConfig';

export { GAP_BLOCK_PATTERN } from './scheduleConfig';

export function formatTimeWithMs(remainMs: number): { main: string; centi: string } {
  if (remainMs < 0) remainMs = 0;
  const totalSeconds = Math.floor(remainMs / 1000);
  const centi = Math.floor((remainMs % 1000) / 10);

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const centiStr = String(centi).padStart(2, '0');

  if (h > 0) {
    return { main: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, centi: centiStr };
  }
  if (m === 0) {
    return { main: `${String(s).padStart(2, '0')}`, centi: centiStr };
  }
  return { main: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, centi: centiStr };
}

export function formatMiniTime(remainMs: number): string {
  if (remainMs < 0) remainMs = 0;
  const totalSeconds = Math.floor(remainMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function formatClockTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function makeEmptySeats(totalSeats: number = 50): SeatData[] {
  return Array.from({ length: totalSeats }, (_, i) => ({
    seatNo: i + 1,
    student: null,
  }));
}

export function getDefaultTimerSession(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const daySessions = DAY_SESSIONS[day] ?? [];

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let targetSession = null;
  for (const session of daySessions) {
    const [endH, endM] = session.end.split(":").map(Number);
    if (currentMinutes <= endH * 60 + endM) {
      targetSession = session;
      break;
    }
  }
  if (!targetSession && daySessions.length > 0) {
    targetSession = daySessions[daySessions.length - 1];
  }

  return targetSession ?? FALLBACK_SESSION;
}

/** Tambah menit ke string waktu "HH:MM", kembalikan "HH:MM" */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Hasilkan template schedule berdasarkan sesi aktif hari ini.
 * Semua durasi diambil dari TEMPLATE_DURATIONS di scheduleConfig.ts.
 */
export function getDefaultScheduleTemplates() {
  const { start, end } = getDefaultTimerSession();
  const { JURNAL_MENIT, GAP_AKHIR_MENIT, TES_AWAL_MENIT } = TEMPLATE_DURATIONS;

  return [
    { id: "blank", label: "Kosong", blocks: [] },
    {
      id: "jurnal",
      label: "Jurnal Saja",
      blocks: [
        { label: "Jurnal", startTime: start, endTime: end, color: BLOCK_COLOR.JURNAL },
      ],
    },
    {
      id: "jurnal-tes",
      label: "Jurnal + Tes Akhir",
      blocks: [
        { label: "Jurnal",    startTime: start,                                        endTime: addMinutes(start, JURNAL_MENIT),                      color: BLOCK_COLOR.JURNAL },
        { label: "Gap",       startTime: addMinutes(start, JURNAL_MENIT),              endTime: addMinutes(start, JURNAL_MENIT + GAP_AKHIR_MENIT),    color: BLOCK_COLOR.GAP },
        { label: "Tes Akhir", startTime: addMinutes(start, JURNAL_MENIT + GAP_AKHIR_MENIT), endTime: end,                                           color: BLOCK_COLOR.TES },
      ],
    },
    {
      id: "tes-jurnal",
      label: "Tes Awal + Jurnal",
      blocks: [
        { label: "Tes Awal", startTime: start,                       endTime: addMinutes(start, TES_AWAL_MENIT), color: BLOCK_COLOR.TES },
        { label: "Jurnal",   startTime: addMinutes(start, TES_AWAL_MENIT), endTime: end,                         color: BLOCK_COLOR.JURNAL },
      ],
    },
  ];
}
