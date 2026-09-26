import { useState, useEffect, useRef, useCallback } from "react";
import type { TimerState, Racer, ScheduleState } from "../components/types";
import { TIMER_WARNING_MS, TIMER_DANGER_MS, AUTO_ADVANCE_DELAY_MS } from "../components/scheduleConfig";

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
    const isWarning = timer.isRunning && remainMs > 0 && remainMs <= TIMER_WARNING_MS;
    const isDanger  = timer.isRunning && remainMs > 0 && remainMs <= TIMER_DANGER_MS;
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

  let lastHtml = "";

  async function getAttemptsElement() {
    try {
      const res = await fetch(window.location.href, { cache: "no-cache" });
      if (res.ok) {
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, "text/html");
        const el = doc.getElementById("attempts") || doc.querySelector("#tablecontainer") || doc.querySelector("table.generaltable");
        if (el) return { el, isFresh: true };
      }
    } catch (e) {
      console.warn("[Leaderboard Sync] Gagal background fetch Moodle, fallback ke DOM:", e);
    }
    const liveEl = document.getElementById("attempts") || document.querySelector("#tablecontainer") || document.querySelector("table.generaltable");
    return { el: liveEl, isFresh: false };
  }

  async function sendAttemptsHTML() {
    try {
      const { el: attemptsElement, isFresh } = await getAttemptsElement();
      if (!attemptsElement) {
        console.warn("[Leaderboard] Tabel kuis belum ditemukan di halaman.");
        return;
      }

      const currentHtml = attemptsElement.outerHTML;
      if (currentHtml === lastHtml) {
        console.log("[Leaderboard Sync] HTML tidak berubah (belum ada nilai baru), skip kirim.");
        return;
      }

      console.log("[Leaderboard Sync] Terdeteksi data baru! Mengirim ke server...");
      const res = await fetch(\`\${API_BASE}/api/process-html?room=\${ROOM}\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: currentHtml })
      });
      const data = await res.json();
      lastHtml = currentHtml;

      if (isFresh) {
        const liveContainer = document.getElementById("attempts") || document.querySelector("#tablecontainer") || document.querySelector("table.generaltable");
        if (liveContainer && liveContainer.parentElement) {
          liveContainer.replaceWith(attemptsElement);
        }
      }

      console.log(\`%c[Leaderboard Sync]%c Berhasil kirim \${data.count ?? 0} data ke \${ROOM}\`, "color: #22c55e; font-weight: bold", "color: auto");
    } catch (err) { console.error("[Leaderboard Sync Error]", err); }
  }
  sendAttemptsHTML();
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

/**
 * Hook background auto-advance untuk schedule timeline.
 * Berjalan terus di root component (KursiGenerator), sehingga tetap memicu
 * perpindahan sesi otomatis meskipun user berpindah ke tab lain (Seats, Notes, dll).
 *
 * Implementasi: setTimeout presisi + visibilitychange listener.
 * Alasan: setInterval repeating (500ms) menyebabkan Chrome "Intensive Throttling"
 * saat tab hidden >5 menit → delay hingga 1 menit. setTimeout one-shot hanya kena
 * "Throttling" biasa (1 detik), dan visibilitychange memastikan advance langsung
 * saat tab diklik kembali. (Ref: MDN Page Visibility API, Window.setTimeout)
 */
export function useScheduleAutoAdvance({
    schedule,
    setSchedule,
    timer,
    setTimer,
    countdownMode,
}: {
    schedule: ScheduleState;
    setSchedule: React.Dispatch<React.SetStateAction<ScheduleState>>;
    timer: TimerState;
    setTimer: React.Dispatch<React.SetStateAction<TimerState>>;
    countdownMode: "simple" | "advanced";
}) {
    const hasAutoAdvancedRef = useRef(false);

    useEffect(() => {
        if (countdownMode !== "advanced" || !timer.isRunning) {
            hasAutoAdvancedRef.current = false;
            return;
        }

        // Hitung endTime sesi saat ini sebagai Date object
        const getEndDate = () => {
            const endD = new Date();
            const [eh, em] = timer.endTime.split(":").map(Number);
            endD.setHours(eh || 0, em || 0, 0, 0);
            const startD = new Date();
            const [sh, sm] = timer.startTime.split(":").map(Number);
            startD.setHours(sh || 0, sm || 0, 0, 0);
            // Handle midnight crossing
            if (endD.getTime() < startD.getTime()) endD.setDate(endD.getDate() + 1);
            return endD;
        };

        // Lakukan advance ke blok berikutnya
        const tryAdvance = () => {
            const remainMs = Math.max(0, getEndDate().getTime() - Date.now());
            if (remainMs > 0) {
                // Belum waktunya — reset guard agar bisa di-cek ulang nanti
                hasAutoAdvancedRef.current = false;
                return;
            }
            if (hasAutoAdvancedRef.current) return;

            const activeBlockIdx = schedule.blocks.findIndex((b) => b.id === schedule.activeBlockId);
            const nextBlock =
                activeBlockIdx >= 0 && activeBlockIdx < schedule.blocks.length - 1
                    ? schedule.blocks[activeBlockIdx + 1]
                    : null;

            if (!nextBlock) return;

            hasAutoAdvancedRef.current = true;
            setTimeout(() => {
                setSchedule((s) => ({ ...s, activeBlockId: nextBlock.id }));
                setTimer((p) => ({
                    ...p,
                    startTime: nextBlock.startTime,
                    endTime: nextBlock.endTime,
                    isRunning: true,
                    startedAt: Date.now(),
                }));
            }, AUTO_ADVANCE_DELAY_MS);
        };

        // Cek langsung saat mount (menangkap kasus tab baru dibuka setelah sesi lewat)
        tryAdvance();
        if (hasAutoAdvancedRef.current) return;

        // Set setTimeout presisi ke saat sesi berakhir
        const remainMs = Math.max(0, getEndDate().getTime() - Date.now());
        const timeoutId = setTimeout(tryAdvance, remainMs);

        // visibilitychange safety net: saat tab aktif kembali, langsung cek
        // (menangkap kasus tab throttled saat background dan tryAdvance terlambat)
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                tryAdvance();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [
        timer.isRunning,
        timer.startTime,
        timer.endTime,
        schedule.blocks,
        schedule.activeBlockId,
        countdownMode,
        setSchedule,
        setTimer,
    ]);
}

