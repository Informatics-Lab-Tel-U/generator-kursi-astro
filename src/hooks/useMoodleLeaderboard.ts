import { useState, useEffect } from "react";

function getSavedLeaderboard(roomName: string): any[] {
  if (typeof window === "undefined" || !roomName || roomName === "-") return [];
  try {
    const saved = localStorage.getItem(`asprak_leaderboard_${roomName.trim().toUpperCase()}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function normalizeStudentName(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isFinishedEntry(item: any): boolean {
  if (!item) return false;
  const stateStr = (item["STATE"] || "").toLowerCase();
  if (
    stateStr.includes("finish") ||
    stateStr.includes("selesai") ||
    stateStr.includes("complete") ||
    stateStr.includes("submitted") ||
    stateStr.includes("diserahkan")
  ) {
    return true;
  }
  const timeTaken = (item["TIME TAKEN"] || "").trim();
  const grade = (item["GRADE"] || "").trim();
  return (
    (timeTaken !== "" && timeTaken !== "-" && timeTaken !== "Not yet graded") ||
    (grade !== "" && grade !== "-" && grade !== "Not yet graded")
  );
}

function isInProgressEntry(item: any): boolean {
  if (!item) return false;
  const stateStr = (item["STATE"] || "").toLowerCase();
  return (
    stateStr.includes("progress") ||
    stateStr.includes("sedang") ||
    stateStr.includes("not yet")
  );
}

export function matchStudentToMoodle(
  studentName: string,
  moodleList: Array<{ NAME: string; STATE: string; [key: string]: any }>
): { status: "finished" | "in-progress" | "none"; moodleEntry?: any } {
  if (!studentName || !moodleList || moodleList.length === 0) {
    return { status: "none" };
  }

  const target = normalizeStudentName(studentName);
  if (!target) return { status: "none" };

  const targetTokens = target.split(" ").filter(Boolean);

  // Pass 1: exact name match — prioritize finished if student has multiple attempts
  const exactMatches = moodleList.filter(
    (item) => normalizeStudentName(item["NAME"] || "") === target
  );

  if (exactMatches.length > 0) {
    const finished = exactMatches.find(isFinishedEntry);
    if (finished) return { status: "finished", moodleEntry: finished };
    const inProgress = exactMatches.find(isInProgressEntry);
    if (inProgress) return { status: "in-progress", moodleEntry: inProgress };
    return { status: "none", moodleEntry: exactMatches[0] };
  }

  // Pass 2: token subset — whole-word only, avoids partial substring collisions
  const candidates: any[] = [];
  for (const item of moodleList) {
    const mName = normalizeStudentName(item["NAME"] || "");
    if (!mName) continue;
    const mTokens = mName.split(" ").filter(Boolean);
    if (mTokens.length === 0) continue;
    const isTargetSubset = targetTokens.length > 0 && targetTokens.every((t) => mTokens.includes(t));
    const isMoodleSubset = mTokens.length >= 2 && mTokens.every((t) => targetTokens.includes(t));
    if (isTargetSubset || isMoodleSubset) candidates.push(item);
  }

  if (candidates.length > 0) {
    const finished = candidates.find(isFinishedEntry);
    if (finished) return { status: "finished", moodleEntry: finished };
    const inProgress = candidates.find(isInProgressEntry);
    if (inProgress) return { status: "in-progress", moodleEntry: inProgress };
    return { status: "none", moodleEntry: candidates[0] };
  }

  return { status: "none" };
}

export function useMoodleLeaderboard(room: string, enabled: boolean = true) {
  const activeRoom = room || "default";
  const [realtimeData, setRealtimeData] = useState<any[]>(() => getSavedLeaderboard(activeRoom));
  const [isConnected, setIsConnected] = useState(false);

  // Sync across browser tabs
  useEffect(() => {
    const key = `asprak_leaderboard_${activeRoom.trim().toUpperCase()}`;
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setRealtimeData(parsed);
        } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [activeRoom]);

  // Sync within the same window (from LeaderboardView)
  useEffect(() => {
    const handler = (e: any) => {
      if (
        e.detail?.room?.trim().toUpperCase() === activeRoom.trim().toUpperCase() &&
        Array.isArray(e.detail.data)
      ) {
        setRealtimeData(e.detail.data);
      }
    };
    window.addEventListener("asprak_leaderboard_updated", handler);
    return () => window.removeEventListener("asprak_leaderboard_updated", handler);
  }, [activeRoom]);

  // WebSocket (prod) or HTTP polling (dev)
  useEffect(() => {
    const cached = getSavedLeaderboard(activeRoom);
    if (cached.length > 0) setRealtimeData(cached);
    setIsConnected(false);

    if (!enabled || !room || room === "-") return;

    if (import.meta.env.DEV) {
      const poll = async () => {
        try {
          const res = await fetch(`/api/leaderboard?room=${encodeURIComponent(activeRoom)}`);
          if (!res.ok) return;
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setRealtimeData(data);
            try {
              localStorage.setItem(`asprak_leaderboard_${activeRoom.trim().toUpperCase()}`, JSON.stringify(data));
            } catch {}
          }
        } catch {}
      };
      poll();
      const timer = setInterval(poll, 8000);
      return () => clearInterval(timer);
    }

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let unmounted = false;
    let retryCount = 0;

    const connect = () => {
      if (unmounted) return;
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${protocol}//${location.host}/api/leaderboard?room=${encodeURIComponent(activeRoom)}`);

      ws.onopen = () => {
        retryCount = 0;
        setIsConnected(true);
        try { ws?.send(JSON.stringify({ type: "GET" })); } catch {}
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; data: any[] };
          if ((msg.type === "INIT" || msg.type === "UPDATE") && Array.isArray(msg.data)) {
            setRealtimeData(msg.data);
            try {
              localStorage.setItem(`asprak_leaderboard_${activeRoom.trim().toUpperCase()}`, JSON.stringify(msg.data));
            } catch {}
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!unmounted) {
          const delay = Math.min(3000 * Math.pow(1.5, retryCount), 30000);
          retryCount++;
          reconnectTimer = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => { setIsConnected(false); ws?.close(); };
    };

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [activeRoom, enabled]);

  return { realtimeData, isConnected };
}
