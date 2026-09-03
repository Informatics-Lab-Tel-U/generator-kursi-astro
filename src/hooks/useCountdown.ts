import { useState, useEffect, useRef, useCallback } from "react";
import type { TimerState, Racer } from "../components/types";

/**
 * Logika blink effect yang reusable untuk warning dan danger states.
 * Saat `active` berubah dari false → true, memicu 5 kali toggle dalam 2.5 detik.
 */
export function useBlinkEffect(active: boolean): boolean {
    const prevRef = useRef(active);
    const [forcedOff, setForcedOff] = useState(false);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | undefined;
        if (!prevRef.current && active) {
            let count = 0;
            intervalId = setInterval(() => {
                count++;
                setForcedOff(count % 2 === 0);
                if (count >= 6) {
                    clearInterval(intervalId!);
                    setForcedOff(false);
                }
            }, 500);
        }
        prevRef.current = active;
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [active]);

    return forcedOff;
}

/**
 * Menghitung state countdown timer: remainMs, timerRatio, isWarning, isDanger, isFinished.
 */
export function useCountdownTimer(timer: TimerState, now: Date) {
    const startD = new Date();
    const [sh, sm] = timer.startTime.split(":").map(Number);
    startD.setHours(sh || 0, sm || 0, 0, 0);

    const endD = new Date();
    const [eh, em] = timer.endTime.split(":").map(Number);
    endD.setHours(eh || 0, em || 0, 0, 0);
    if (endD.getTime() < startD.getTime()) endD.setDate(endD.getDate() + 1);

    let totalSecs = Math.floor((endD.getTime() - startD.getTime()) / 1000);
    if (totalSecs <= 0) totalSecs = 1;

    let remainMs = totalSecs * 1000;
    if (timer.isRunning) remainMs = endD.getTime() - now.getTime();
    if (remainMs < 0) remainMs = 0;

    const timerRatio = Math.max(0, Math.min(1, remainMs / (totalSecs * 1000)));
    const isWarning = timer.isRunning && remainMs > 0 && remainMs <= 603000;
    const isDanger = timer.isRunning && remainMs > 0 && remainMs <= 63000;
    const isFinished = timer.isRunning && remainMs === 0;

    return { remainMs, timerRatio, totalSecs, endD, isWarning, isDanger, isFinished };
}

/**
 * Mengelola state racer: tambah, hapus, upload gambar.
 */
export function useRacers(
    racers: Racer[],
    setRacers?: React.Dispatch<React.SetStateAction<Racer[]>>
) {
    const [newRacerName, setNewRacerName] = useState("");

    const handleRacerImageUpload = useCallback(
        (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file || !setRacers) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string;
                setRacers((prev) =>
                    prev.map((r) => (r.id === id ? { ...r, imageBase64: dataUrl } : r))
                );
            };
            reader.readAsDataURL(file);
        },
        [setRacers]
    );

    const addRacer = useCallback(() => {
        if (newRacerName.trim() && setRacers) {
            setRacers((prev) => [
                ...prev,
                { id: Date.now().toString(), name: newRacerName.trim(), imageBase64: null },
            ]);
            setNewRacerName("");
        }
    }, [newRacerName, setRacers]);

    const removeRacer = useCallback(
        (id: string) => { if (setRacers) setRacers((prev) => prev.filter((r) => r.id !== id)); },
        [setRacers]
    );

    const startRace = useCallback(
        (setTimer?: React.Dispatch<React.SetStateAction<TimerState>>) => {
            const shuffled = [...racers].sort(() => Math.random() - 0.5);
            const jitter: Record<string, any> = {};
            shuffled.forEach((r, idx) => {
                jitter[r.id] = {
                    currentOffset: 0,
                    targetOffset: Math.random() * 20 - 10,
                    speed: 0.02 + Math.random() * 0.05,
                    finalOffset: idx === 0 ? 0 : -(idx * 3) - Math.random() * 3,
                };
            });
            return { jitter, startTimer: () => setTimer?.((p) => ({ ...p, isRunning: true, startedAt: Date.now() })) };
        },
        [racers]
    );

    return { newRacerName, setNewRacerName, addRacer, removeRacer, startRace, handleRacerImageUpload };
}

/**
 * Menghasilkan script Moodle Leaderboard dan menangani copy ke clipboard.
 */
export function useMoodleScript(kelas: string) {
    const [isCopied, setIsCopied] = useState(false);
    const [showScript, setShowScript] = useState(false);

    const generateScript = useCallback(() => {
        const origin =
            typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        return `(async function () {
  const API_BASE = "${origin}";
  const ROOM = "${kelas || "default"}";

  async function sendAttemptsHTML() {
    try {
      const response = await fetch(window.location.href);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const attemptsElement = doc.getElementById("attempts");
      if (!attemptsElement) return;

      await fetch(\`\${API_BASE}/api/process-html?room=\${ROOM}\`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ html: attemptsElement.outerHTML })
      });
    } catch (err) { console.error("Script error:", err); }
  }
  setInterval(sendAttemptsHTML, 5000);
})();`;
    }, [kelas]);

    const copyScript = useCallback(() => {
        navigator.clipboard.writeText(generateScript());
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }, [generateScript]);

    return { isCopied, showScript, setShowScript, generateScript, copyScript };
}
