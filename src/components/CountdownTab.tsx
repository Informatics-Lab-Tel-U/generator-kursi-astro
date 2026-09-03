import React, { useState, useEffect, useRef } from "react";
import type { TimerState, Racer, RacerJitter, Student } from "./types";
import { formatTimeWithMs, formatClockTime } from "./utils";
import { LuPlay, LuPause, LuCar, LuCamera, LuCopy, LuCheck } from "react-icons/lu";
import LeaderboardView from "./LeaderboardView";
import { useBlinkEffect, useCountdownTimer, useRacers, useMoodleScript } from "../hooks/useCountdown";

interface CountdownTabProps {
    timer: TimerState;
    setTimer?: React.Dispatch<React.SetStateAction<TimerState>>;
    racers: Racer[];
    setRacers?: React.Dispatch<React.SetStateAction<Racer[]>>;
    readOnly?: boolean;
    kelas?: string;
    eligibleStudents?: Student[];
}

export default function CountdownTab({
    timer,
    setTimer,
    racers,
    setRacers,
    readOnly = false,
    kelas = "",
    eligibleStudents = [],
}: CountdownTabProps) {
    const [now, setNow] = useState(new Date());
    const jitterMapRef = useRef<Record<string, RacerJitter>>({});

    // Tick setiap 50ms saat timer berjalan (untuk animasi countdown dan racer)
    useEffect(() => {
        if (!timer.isRunning) return;
        const interval = window.setInterval(() => {
            setNow(new Date());
            const jMap = jitterMapRef.current;
            Object.keys(jMap).forEach((id) => {
                const j = jMap[id];
                j.currentOffset += (j.targetOffset - j.currentOffset) * j.speed;
                if (Math.abs(j.targetOffset - j.currentOffset) < 1) {
                    j.targetOffset = Math.random() * 30 - 15;
                    j.speed = 0.02 + Math.random() * 0.04;
                }
            });
        }, 50);
        return () => clearInterval(interval);
    }, [timer.isRunning]);

    // Hooks untuk logika yang sudah diekstrak
    const { remainMs, timerRatio, endD, isWarning, isDanger, isFinished } =
        useCountdownTimer(timer, now);

    const warningForcedOff = useBlinkEffect(isWarning);
    const dangerForcedOff = useBlinkEffect(isDanger);

    const prevIsFinishedRef = useRef(isFinished);
    const [showGreenFinish, setShowGreenFinish] = useState(false);
    useEffect(() => {
        if (!prevIsFinishedRef.current && isFinished) {
            setShowGreenFinish(true);
            const t = setTimeout(() => setShowGreenFinish(false), 3000);
            return () => clearTimeout(t);
        }
        prevIsFinishedRef.current = isFinished;
    }, [isFinished]);

    const actuallyFinished = showGreenFinish;
    const actuallyDanger = isDanger && !dangerForcedOff;
    const actuallyWarning = isWarning && !warningForcedOff && !actuallyDanger;

    // Sync body class untuk tampilan proyektor fullscreen
    useEffect(() => {
        if (actuallyFinished && readOnly) {
            document.body.classList.add("time-finished");
            document.body.classList.remove("time-danger", "time-warning");
        } else if (actuallyDanger && readOnly) {
            document.body.classList.add("time-danger");
            document.body.classList.remove("time-finished", "time-warning");
        } else if (actuallyWarning && readOnly) {
            document.body.classList.add("time-warning");
            document.body.classList.remove("time-finished", "time-danger");
        } else {
            document.body.classList.remove("time-finished", "time-warning", "time-danger");
        }
        return () => document.body.classList.remove("time-finished", "time-warning", "time-danger");
    }, [actuallyFinished, actuallyDanger, actuallyWarning, readOnly]);

    const { newRacerName, setNewRacerName, addRacer, removeRacer, startRace, handleRacerImageUpload } =
        useRacers(racers, setRacers);
    const { isCopied, showScript, setShowScript, generateScript, copyScript } = useMoodleScript(kelas);

    const handleStartRace = () => {
        const { jitter, startTimer } = startRace(setTimer);
        jitterMapRef.current = jitter;
        startTimer();
    };

    return (
        <div className="countdown-tab" style={{ width: "100%" }}>
            {/* ── Timer Config ─────────────────────────────── */}
            {!readOnly && (
                <div className="countdown-config-card">
                    <div className="countdown-field">
                        <label>Waktu Mulai</label>
                        <input
                            type="time"
                            value={timer.startTime}
                            onChange={(e) => setTimer?.((p) => ({ ...p, startTime: e.target.value }))}
                        />
                    </div>
                    <div className="countdown-field">
                        <label>Waktu Selesai</label>
                        <input
                            type="time"
                            value={timer.endTime}
                            onChange={(e) => setTimer?.((p) => ({ ...p, endTime: e.target.value }))}
                        />
                    </div>
                    <div>
                        {!timer.isRunning ? (
                            <button
                                className="btn btn-start"
                                style={{ padding: "12px 28px", height: "45px", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}
                                onClick={handleStartRace}
                            >
                                <LuPlay /> Mulai
                            </button>
                        ) : (
                            <button
                                className="btn btn-pause"
                                style={{ padding: "12px 28px", height: "45px", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}
                                onClick={() => setTimer?.((p) => ({ ...p, isRunning: false, startedAt: null }))}
                            >
                                <LuPause /> Hentikan
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Racer Setup ─────────────────────────────── */}
            {!readOnly && !timer.isRunning && (
                <div className="racer-setup">
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                        <LuCar /> Daftar Pembalap (ASPRAK)
                    </h3>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                        <input
                            type="text"
                            className="sidebar-input"
                            placeholder="Kode ASPRAK (e.g. AFF)"
                            value={newRacerName}
                            onChange={(e) => setNewRacerName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addRacer()}
                        />
                        <button className="btn btn-primary" onClick={addRacer}>+ Tambah</button>
                    </div>
                    <div className="racer-list">
                        {racers.length === 0 ? (
                            <div style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                                Belum ada pembalap
                            </div>
                        ) : (
                            racers.map((r) => (
                                <div key={r.id} className="racer-list-item">
                                    <div className="racer-avatar-preview">
                                        {r.imageBase64 ? <img src={r.imageBase64} alt={r.name} /> : <span>{r.name}</span>}
                                    </div>
                                    <span className="racer-name">{r.name}</span>
                                    <label className="btn btn-secondary" style={{ cursor: "pointer", margin: 0, padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <LuCamera /> Foto
                                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleRacerImageUpload(r.id, e)} />
                                    </label>
                                    <button
                                        className="btn"
                                        style={{ padding: "6px 10px", fontSize: "12px", margin: 0, background: "var(--danger-surface)", color: "var(--danger)" }}
                                        onClick={() => removeRacer(r.id)}
                                    >✕</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ── Moodle Script ─────────────────────────────── */}
            {!readOnly && (
                <div className="countdown-config-card" style={{ marginTop: "16px", flexDirection: "column", alignItems: "stretch" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>Setup Moodle Leaderboard</h3>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowScript(!showScript)}
                            style={{ padding: "4px 8px", fontSize: "11px", margin: 0 }}
                        >
                            {showScript ? "Sembunyikan" : "Tampilkan Script"}
                        </button>
                    </div>
                    {showScript && (
                        <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--text-muted)" }}>
                            Copy script di bawah ini, lalu buka halaman grading Moodle. Buka Developer Console (F12 → Console), paste, lalu tekan Enter.
                        </p>
                    )}
                    <div style={{ position: "relative", background: "var(--bg-body)", padding: "12px", minHeight: "48px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                        {showScript ? (
                            <pre style={{ margin: 0, fontSize: "11px", overflowX: "auto", color: "var(--text-secondary)", paddingRight: "80px" }}>
                                {generateScript()}
                            </pre>
                        ) : (
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", paddingTop: "4px" }}>
                                Script tersembunyi. Klik "Tampilkan Script" atau langsung Copy.
                            </div>
                        )}
                        <button
                            className="btn btn-secondary"
                            onClick={copyScript}
                            style={{ position: "absolute", top: "8px", right: "8px", padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                            {isCopied ? <><LuCheck style={{ color: "var(--success)" }} /> Copied</> : <><LuCopy /> Copy</>}
                        </button>
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)", textAlign: "right" }}>
                        credit to{" "}
                        <a href="#" target="_blank" rel="noreferrer" style={{ fontFamily: 'Consolas, "Courier New", monospace', color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                            @rafiathallah
                        </a>
                    </div>
                </div>
            )}

            {/* ── Countdown Display & Race Track ─────────── */}
            <div className="race-track-container" style={{ marginTop: readOnly ? 0 : "24px" }}>
                <div style={{ textAlign: "center", marginBottom: readOnly ? "0" : "24px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                        Waktu Tersisa
                    </div>
                    <div className={`countdown-time ${readOnly ? (actuallyFinished ? "finished" : actuallyDanger ? "danger" : actuallyWarning ? "warning" : "") : ""}`}>
                        {remainMs === 0 && timer.isRunning && readOnly ? (
                            <span>HANDS UP !</span>
                        ) : (() => {
                            const { main, centi } = formatTimeWithMs(remainMs);
                            return <>{main}<span style={{ fontSize: "0.65em", opacity: 0.5 }}>.{centi}</span></>;
                        })()}
                    </div>
                    {timer.isRunning && timer.startedAt && (
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)", marginTop: "8px" }}>
                            Selesai Pukul: {formatClockTime(endD)}
                        </div>
                    )}
                </div>

                {!readOnly && (
                    <div className="race-track">
                        {racers.length === 0 ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                                Belum ada pembalap. Tambahkan pembalap di atas.
                            </div>
                        ) : (
                            racers.map((racer) => {
                                const j = jitterMapRef.current[racer.id];
                                const progressFraction = 1 - timerRatio;
                                let racerProgress = progressFraction * 100;
                                if (j) {
                                    const blendedOffset = j.currentOffset * (1 - progressFraction) + j.finalOffset * progressFraction;
                                    racerProgress += blendedOffset;
                                }
                                racerProgress = timerRatio > 0
                                    ? Math.max(0, Math.min(racerProgress, 99.5))
                                    : (j ? 100 + j.finalOffset : 100);

                                return (
                                    <div key={racer.id} className="race-lane">
                                        <div className="racer-vehicle" style={{ left: `calc(${racerProgress}% - ${(racerProgress / 100) * 88}px)` }}>
                                            <div className="racer-avatar">
                                                {racer.imageBase64
                                                    ? <img src={racer.imageBase64} alt={racer.name} />
                                                    : <span>{racer.name}</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div className="finish-line"></div>
                    </div>
                )}
            </div>

            <LeaderboardView room={kelas} students={eligibleStudents} />
        </div>
    );
}
