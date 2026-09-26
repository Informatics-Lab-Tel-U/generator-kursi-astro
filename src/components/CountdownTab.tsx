import React, { useState, useEffect, useRef } from "react";
import type { TimerState, Racer, RacerJitter, Student, ScheduleState } from "./types";
import { formatTimeWithMs, formatClockTime } from "./utils";
import { LuPlay, LuPause } from "react-icons/lu";
import { useBlinkEffect, useCountdownTimer, useRacers } from "../hooks/useCountdown";
import ScheduleFlow from "./ScheduleFlow";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { SpriteAnimation, getSpriteForRacer } from "./SpriteAnimation";
import PixelRoadBg from "./PixelRoadBg";

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
    const [trackWidth, setTrackWidth] = useState(1200);
    const trackRef = useRef<HTMLDivElement>(null);
    const jitterMapRef = useRef<Record<string, RacerJitter>>({});

    // Observe race-track container width for accurate car layout
    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        const update = () => {
            if (el.clientWidth > 0) setTrackWidth(el.clientWidth);
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

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
    const { remainMs, timerRatio, totalSecs, endD, isWarning, isDanger, isFinished } =
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
        // Sync jitter ke proyektor via localStorage (BroadcastChannel tidak membawa jitter)
        try { localStorage.setItem("asprak_race_jitter", JSON.stringify(jitter)); } catch {}
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

    const isProjectorWithRace = Boolean(readOnly && racers && racers.length > 0);

    // Pastikan jitterMapRef terisi untuk semua pembalap (termasuk di mode proyektor)
    useEffect(() => {
        racers.forEach((r, idx) => {
            if (!jitterMapRef.current[r.id]) {
                // Fallback dengan spread bermakna (bukan ±1) agar tidak sejajar
                jitterMapRef.current[r.id] = {
                    currentOffset: 0,
                    targetOffset: Math.random() * 30 - 15,
                    speed: 0.02 + Math.random() * 0.04,
                    finalOffset: idx === 0 ? 0 : -(idx * 3) - Math.random() * 3,
                };
            }
        });
    }, [racers]);

    // Sync jitter dari localStorage ke proyektor saat race dimulai
    // (main window menyimpan jitter via handleStartRace; localStorage shared antar tab)
    useEffect(() => {
        if (!timer.startedAt || !timer.isRunning) return;
        try {
            const raw = localStorage.getItem("asprak_race_jitter");
            if (!raw) return;
            const stored: Record<string, any> = JSON.parse(raw);
            const hasAllRacers = racers.every((r) => stored[r.id]);
            if (hasAllRacers) {
                jitterMapRef.current = { ...stored };
            }
        } catch {}
    }, [timer.startedAt, timer.isRunning, racers]);

    // Observe race-track container width for accurate car layout
    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        const update = () => {
            if (el.clientWidth > 0) setTrackWidth(el.clientWidth);
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [isProjectorWithRace]);

    const renderTimeContent = (horizontal = false) => (
        <>
            {/* Mode proyektor: Sesi selesai dan ada sesi berikutnya */}
            {readOnly && projectorState === "finished-next" && (
                <div className={`text-center ${horizontal ? "flex items-center justify-center gap-4 flex-wrap py-1 px-2" : "py-6 px-4"}`}>
                    <div className="session-title-pill flex-shrink-0">
                        <span>{activeBlock?.label || "Sesi"} selesai</span>
                    </div>

                    {nextBlock && (
                        <div className="flex items-center gap-3 flex-wrap justify-center">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                                Selanjutnya
                            </span>
                            <div className="countdown-time finished" style={{ fontSize: horizontal ? "36px" : "clamp(36px, 7vw, 68px)", lineHeight: 1 }}>
                                <span>{nextBlock.label}</span>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                ({nextBlock.startTime} - {nextBlock.endTime})
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Mode proyektor: Semua sesi selesai */}
            {readOnly && projectorState === "finished-final" && (
                <div className={`text-center ${horizontal ? "flex items-center justify-center gap-4 py-1 px-2" : "py-6 px-4"}`}>
                    <div className={`countdown-time ${actuallyFinished ? "finished" : ""}`} style={{ fontSize: horizontal ? "40px" : undefined, lineHeight: 1 }}>
                        <span>HANDS UP !</span>
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Semua sesi telah selesai
                    </span>
                </div>
            )}

            {/* Tampilan normal (running/idle) */}
            {(!readOnly || (projectorState === "running" || projectorState === "idle")) && (
                <div className={horizontal ? "flex items-center justify-center gap-4 flex-wrap" : "text-center"}>
                    {(activeBlockLabel || (schedule && activeBlock)) && (
                        <div className="session-title-pill flex-shrink-0">
                            <span>{activeBlockLabel || activeBlock?.label}</span>
                        </div>
                    )}

                    <div className={`flex items-center gap-3 ${horizontal ? "" : "flex-col justify-center mb-2"}`}>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                            Waktu Tersisa
                        </div>
                        <div
                            className={`countdown-time ${readOnly ? (actuallyFinished ? "finished" : actuallyDanger ? "danger" : actuallyWarning ? "warning" : "") : ""}`}
                            style={{ fontSize: horizontal ? "42px" : undefined, lineHeight: 1 }}
                        >
                            {remainMs === 0 && timer.isRunning && readOnly && !nextBlock ? (
                                <span>HANDS UP !</span>
                            ) : (() => {
                                const { main, centi } = formatTimeWithMs(remainMs);
                                return <>{main}<span style={{ fontSize: "0.65em", opacity: 0.5 }}>.{centi}</span></>;
                            })()}
                        </div>
                    </div>

                    {readOnly && nextBlock && (
                        <div className={`session-title-pill flex-shrink-0 ${horizontal ? "" : "mt-4"}`}>
                            <span>
                                Berikutnya: <strong>{nextBlock.label}</strong>
                                <span className="ml-1.5 opacity-70">({nextBlock.startTime} - {nextBlock.endTime})</span>
                            </span>
                        </div>
                    )}
                </div>
            )}
        </>
    );

    const renderTrackContent = () => (
        <>
            {/* Continuous track canvas: Start -> Normal Road x N -> Finish */}
            <PixelRoadBg
                mode="race"
                progress={1 - timerRatio}
                totalSecs={totalSecs}
                isRunning={timer.isRunning}
                isFinished={isFinished}
                speedPxPerSec={160}
            />

            {racers.length === 0 ? (
                <div className="py-24 text-center text-muted-foreground text-sm" style={{ position: "relative", zIndex: 2 }}>
                    Belum ada pembalap. Tambahkan pembalap di tab Leaderboard.
                </div>
            ) : (
                <div className="race-asphalt-lanes">
                    {[0, 1, 2, 3].map((laneIdx) => {
                        const laneRacers = racers
                            .map((racer, originalIdx) => ({ racer, originalIdx }))
                            .filter(({ originalIdx }) => originalIdx % 4 === laneIdx);

                        return (
                            <div key={laneIdx} className="race-lane">
                                {laneRacers.map(({ racer, originalIdx }) => {
                                    const slotIdx = Math.floor(originalIdx / 4);
                                    const j = jitterMapRef.current[racer.id] || { currentOffset: 0, finalOffset: 0 };
                                    const p = 1 - timerRatio;

                                    // Kinematika Posisi Mobil (World-Space Camera-Compensated Kinematics)
                                    const _trackH = 432;
                                    const _tileW = Math.round(_trackH * 3);
                                    const _xStartInTile = Math.round(255 * (_trackH / 724));
                                    const _xFinishInTile = Math.round(255 * (_trackH / 725));
                                    const _nRoadTiles = Math.max(1, Math.round((160 * totalSecs - _tileW) / _tileW));
                                    const _xFinishWorld = (_nRoadTiles + 1) * _tileW + _xFinishInTile;
                                    const _xStartScreen = 280;
                                    const _xFinishScreen2 = Math.min(trackWidth - 260, Math.max(280, trackWidth * 0.75));
                                    const _camStart = _xStartInTile - _xStartScreen;
                                    const _camEnd   = _xFinishWorld - _xFinishScreen2;
                                    const _L = 0.15, _M = 1 / (1 - _L / 2), _a = _M / (2 * _L);
                                    const _camP = p <= _L ? _a * p * p : _M * (p - _L / 2);
                                    const _camX = _camStart + Math.min(1, Math.max(0, _camP)) * (_camEnd - _camStart);
                                    const _camDisp = _camX - _camStart;

                                    const _gridScreen0 = (slotIdx === 0 ? 130 : 15) + (3 - laneIdx) * 6;
                                    const gridBase = _gridScreen0 - _camDisp;

                                    const xFinishScreen = Math.min(trackWidth - 260, Math.max(280, trackWidth * 0.72));
                                    const finishBase = xFinishScreen + 30 + (j.finalOffset * 18);

                                    const midBase = trackWidth * 0.40;
                                    const blendedOffset = j.currentOffset * (1 - p) + j.finalOffset * p;
                                    const raceBase = midBase + blendedOffset * 14;

                                    const gT = Math.max(0, Math.min(1, (0.25 - p) / 0.25));
                                    const wGrid = gT * gT * (3 - 2 * gT);

                                    const fT = Math.max(0, Math.min(1, (p - 0.75) / 0.25));
                                    const wFinish = fT * fT * (3 - 2 * fT);

                                    const wRace = Math.max(0, 1 - wGrid - wFinish);

                                    let carLeftPx = gridBase * wGrid + raceBase * wRace + finishBase * wFinish;
                                    carLeftPx = Math.max(10, Math.min(carLeftPx, trackWidth - 170));

                                    const spriteUrl = getSpriteForRacer(originalIdx);

                                    return (
                                        <div
                                            key={racer.id}
                                            className="racer-vehicle"
                                            style={{
                                                transform: `translate3d(${Math.round(carLeftPx)}px, -50%, 0)`,
                                                zIndex: 10 + slotIdx,
                                            }}
                                        >
                                            <SpriteAnimation
                                                src={spriteUrl}
                                                frameWidth={160}
                                                frameHeight={50}
                                                totalFrames={6}
                                                frameRate={9}
                                                paused={!timer.isRunning && !isFinished}
                                                flipX={true}
                                            />
                                            <div className="racer-name-tag">{racer.name}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );

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
            {isProjectorWithRace ? (
                /* Mode proyektor dengan balapan asprak sebagai background card waktu */
                <div
                    ref={trackRef}
                    className="race-track-container projector-race-card"
                    style={{
                        position: "relative",
                        height: "432px",
                        padding: "16px 20px",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-start",
                    }}
                >
                    <div
                        className="race-track projector-track-inner"
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            border: "none",
                            borderRadius: "inherit",
                            overflow: "hidden",
                            zIndex: 0,
                        }}
                    >
                        {renderTrackContent()}
                    </div>
                    <div
                        className="projector-time-hud"
                        style={{
                            position: "relative",
                            zIndex: 10,
                            pointerEvents: "none",
                        }}
                    >
                        {renderTimeContent(true)}
                    </div>
                </div>
            ) : (
                /* Mode standar: proyektor tanpa pembalap atau tampilan generator */
                <div className="race-track-container">
                    <div className={!readOnly ? "mb-6" : ""}>
                        {renderTimeContent()}
                    </div>

                    {!readOnly && (
                        <div ref={trackRef} className="race-track">
                            {renderTrackContent()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
