import type { SeatData } from './types';

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
  let daySessions: { start: string; end: string }[] = [];

  if (day >= 1 && day <= 4) {
    daySessions = [
      { start: "06:40", end: "08:20" },
      { start: "09:40", end: "11:20" },
      { start: "12:40", end: "14:20" },
      { start: "15:40", end: "17:20" },
    ];
  } else if (day === 5) {
    daySessions = [
      { start: "07:40", end: "09:20" },
      { start: "13:40", end: "15:20" },
    ];
  } else if (day === 6) {
    daySessions = [
      { start: "07:40", end: "09:20" },
      { start: "10:40", end: "12:20" },
      { start: "13:40", end: "15:20" },
      { start: "16:40", end: "18:20" },
    ];
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let targetSession = null;
  for (const session of daySessions) {
    const [endH, endM] = session.end.split(":").map(Number);
    const endMins = endH * 60 + endM;
    if (currentMinutes <= endMins) {
      targetSession = session;
      break;
    }
  }
  if (!targetSession && daySessions.length > 0) {
    targetSession = daySessions[daySessions.length - 1];
  }

  return targetSession || { start: "08:00", end: "10:00" };
}
