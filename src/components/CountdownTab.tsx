import React, { useState, useEffect, useRef } from "react";
import type { TimerState, Racer, RacerJitter, Student, ScheduleState } from "./types";
import { formatTimeWithMs, formatClockTime } from "./utils";
import { LuPlay, LuPause } from "react-icons/lu";
import { useBlinkEffect, useCountdownTimer, useRacers } from "../hooks/useCountdown";
import ScheduleFlow from "./ScheduleFlow";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CountdownTabProps {
    timer: TimerState;
    setTimer?: React.Dispatch<React.SetStateAction<TimerState>>;
    racers: Racer[];
    setRacers?: React.Dispatch<React.SetStateAction<Racer[]>>;
    readOnly?: boolean;
    kelas?: string;
    eligibleStudents?: Student[];
    schedule?: ScheduleState;
    setSchedule?: React.Dispatch<React.SetStateAction<ScheduleState>>;
    activeBlockLabel?: string;
    activeBlockColor?: string;
}

export default function CountdownTab({
    timer,
    setTimer,
    racers,
    setRacers,
    readOnly = false,
    kelas = "",
    eligibleStudents = [],
    schedule,
    setSchedule,
    activeBlockLabel,
    activeBlockColor,
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

    const [showGreenFinish, setShowGreenFinish] = useState(false);
    useEffect(() => {
        if (!isFinished) {
            setShowGreenFinish(false);
            return;
        }
        setShowGreenFinish(true);
        const t = setTimeout(() => setShowGreenFinish(false), 2000);
        return () => clearTimeout(t);
    }, [isFinished, schedule?.activeBlockId]);

    const actuallyFinished = showGreenFinish && (!timer.isRunning || remainMs === 0);
    const actuallyDanger = isDanger && !dangerForcedOff && !actuallyFinished;
    const actuallyWarning = isWarning && !warningForcedOff && !actuallyDanger && !actuallyFinished;

    const activeBlock = schedule?.blocks.find((b) => b.id === schedule.activeBlockId);
    const activeBlockIdx = schedule
        ? schedule.blocks.findIndex((b) => b.id === schedule.activeBlockId)
        : -1;
    const nextBlock = schedule && activeBlockIdx >= 0 && activeBlockIdx < schedule.blocks.length - 1
        ? schedule.blocks[activeBlockIdx + 1]
        : null;
    const isLastBlock = schedule && activeBlockIdx === schedule.blocks.length - 1 && schedule.blocks.length > 0;

    // Sync body class untuk tampilan proyektor fullscreen
    // time-transition = sesi selesai, ada sesi berikutnya (biru)
    // time-finished   = sesi terakhir selesai, HANDS UP (hijau)
    useEffect(() => {
        const allStates = ["time-finished", "time-transition", "time-danger", "time-warning"];
        const remove = (...cls: string[]) => cls.forEach(c => document.body.classList.remove(c));

        if (actuallyFinished && readOnly && nextBlock) {
            document.body.classList.add("time-transition");
            remove("time-finished", "time-danger", "time-warning");
        } else if (actuallyFinished && readOnly) {
            document.body.classList.add("time-finished");
            remove("time-transition", "time-danger", "time-warning");
        } else if (actuallyDanger && readOnly) {
            document.body.classList.add("time-danger");
            remove("time-finished", "time-transition", "time-warning");
        } else if (actuallyWarning && readOnly) {
            document.body.classList.add("time-warning");
            remove("time-finished", "time-transition", "time-danger");
        } else {
            remove(...allStates);
        }
        return () => remove(...allStates);
    }, [actuallyFinished, actuallyDanger, actuallyWarning, nextBlock, readOnly]);

    const { startRace } = useRacers(racers);

    const handleStartRace = () => {
        const { jitter, startTimer } = startRace(setTimer);
        jitterMapRef.current = jitter;
        startTimer();
    };


    // State tampilan proyektor berdasarkan kondisi alur sesi:
    // "finished-final": sesi terakhir selesai (tidak ada next block)
    // "finished-next": sesi selesai dan ada sesi berikutnya (auto-advance sedang berjalan)
    // "running": countdown normal berjalan untuk semua jenis node
    // "idle": timer tidak berjalan
    const projectorState: "finished-final" | "finished-next" | "running" | "idle" =
        isFinished && isLastBlock
            ? "finished-final"
            : isFinished && nextBlock
            ? "finished-next"
            : timer.isRunning
            ? "running"
            : "idle";

    return (
        <div className="countdown-tab" style={{ width: "100%" }}>
            {/* Timeline sesi builder (mode advanced) */}
            {!readOnly && schedule && setSchedule && setTimer && (
                <ScheduleFlow
                    schedule={schedule}
                    setSchedule={setSchedule}
                    setTimer={setTimer}
                    timer={timer}
                    onStart={handleStartRace}
                    onStop={() => setTimer?.((p) => ({ ...p, isRunning: false, startedAt: null }))}
                />
            )}

            {/* Konfigurasi timer sederhana (mode timer umum) */}
            {!readOnly && !schedule && (
                <div className="countdown-config-card rounded-lg border border-border bg-card p-4 flex items-end gap-3 flex-wrap">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-foreground/80">Waktu Mulai</Label>
                        <Input
                            type="time"
                            value={timer.startTime}
                            onChange={(e) => setTimer?.((p) => ({ ...p, startTime: e.target.value }))}
                            className="w-36 h-9"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-foreground/80">Waktu Selesai</Label>
                        <Input
                            type="time"
                            value={timer.endTime}
                            onChange={(e) => setTimer?.((p) => ({ ...p, endTime: e.target.value }))}
                            className="w-36 h-9"
                        />
                    </div>
                    <div>
                        {!timer.isRunning ? (
                            <Button
                                variant="default"
                                size="default"
                                className="h-9 gap-1.5 px-4"
                                onClick={handleStartRace}
                            >
                                <LuPlay className="size-4" />
                                <span>Mulai</span>
                            </Button>
                        ) : (
                            <Button
                                variant="destructive"
                                size="default"
                                className="h-9 gap-1.5 px-4"
                                onClick={() => setTimer?.((p) => ({ ...p, isRunning: false, startedAt: null }))}
                            >
                                <LuPause className="size-4" />
                                <span>Hentikan</span>
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Area hitung mundur dan race track */}
            <div className="race-track-container">

                {/* ======================================================
                    MODE PROYEKTOR: tampilan khusus per-state sesi
                    ====================================================== */}
                {readOnly && projectorState === "finished-next" && (
                    <div className="text-center py-10 px-6">
                        <div className="session-title-pill" style={{ marginBottom: "16px" }}>
                            <span>{activeBlock?.label || "Sesi"} selesai</span>
                        </div>

                        {nextBlock && (
                            <>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                                    Selanjutnya
                                </div>
                                <div className="countdown-time finished" style={{ fontSize: "clamp(48px, 10vw, 96px)" }}>
                                    <span>{nextBlock.label}</span>
                                </div>
                                <div className="text-sm font-medium text-muted-foreground mt-3">
                                    {nextBlock.startTime} – {nextBlock.endTime}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {readOnly && projectorState === "finished-final" && (
                    <div className="text-center py-10 px-6">
                        <div className={`countdown-time ${actuallyFinished ? "finished" : ""}`}>
                            <span>HANDS UP !</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-4">
                            Semua sesi telah selesai
                        </div>
                    </div>
                )}

                {/* Tampilan normal (running/idle) di mode proyektor untuk SEMUA sesi */}
                {(!readOnly || (projectorState === "running" || projectorState === "idle")) && (
                    <div className={`text-center ${readOnly ? "" : "mb-6"}`}>
                        {(activeBlockLabel || (schedule && activeBlock)) && (
                            <div className="mb-3">
                                <div className="session-title-pill">
                                    <span>{activeBlockLabel || activeBlock?.label}</span>
                                </div>
                            </div>
                        )}

                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                            Waktu Tersisa
                        </div>
                        <div className={`countdown-time ${readOnly ? (actuallyFinished ? "finished" : actuallyDanger ? "danger" : actuallyWarning ? "warning" : "") : ""}`}>
                            {remainMs === 0 && timer.isRunning && readOnly && !nextBlock ? (
                                <span>HANDS UP !</span>
                            ) : (() => {
                                const { main, centi } = formatTimeWithMs(remainMs);
                                return <>{main}<span style={{ fontSize: "0.65em", opacity: 0.5 }}>.{centi}</span></>;
                            })()}
                        </div>

                        {readOnly && nextBlock && (
                            <div className="session-title-pill mt-6">
                                <span>
                                    Berikutnya: <strong>{nextBlock.label}</strong>
                                    <span className="ml-2 opacity-70">({nextBlock.startTime} - {nextBlock.endTime})</span>
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Race track (hanya di mode non-readOnly) */}
                {!readOnly && (
                    <div className="race-track">
                        {racers.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground text-sm">
                                Belum ada pembalap. Tambahkan pembalap di tab Leaderboard.
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
        </div>
    );
}
