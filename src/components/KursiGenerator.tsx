import { useState, useRef, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toPng } from "html-to-image";
import "./KursiGenerator.css";

import type { TabId, ProjectorConfig, TimerState, ScheduleState, SeatVersion } from "./types";
import type { Racer } from "./types";
import { getDefaultTimerSession, generateSeatPhotoFilename } from "./utils";
import { Badge } from "./ui/badge";

import { useTheme } from "../hooks/useTheme";
import { useMonitoring } from "../hooks/useMonitoring";
import { useStudentData } from "../hooks/useStudentData";
import { useSeats } from "../hooks/useSeats";
import { useProjectorSync } from "../hooks/useProjectorSync";
import { useScheduleAutoAdvance } from "../hooks/useCountdown";
import { useRacersGlobal } from "../hooks/useRacersGlobal";

import Sidebar from "./Sidebar";
import SeatsTab from "./SeatsTab";
import NotesTab from "./NotesTab";
import CountdownTab from "./CountdownTab";
import LeaderboardTab from "./LeaderboardTab";
import OthersTab from "./OthersTab";
import KursiGeneratorHeader from "./KursiGeneratorHeader";
import { LuLayoutGrid } from "react-icons/lu";

const queryClient = new QueryClient();

export default function KursiGenerator() {
    return (
        <QueryClientProvider client={queryClient}>
            <KursiGeneratorInner />
        </QueryClientProvider>
    );
}

function KursiGeneratorInner() {
    const { theme, toggleTheme } = useTheme();

    const [matkul, setMatkul] = useState("");
    const [kelas, setKelas] = useState("");
    const [activeTab, setActiveTab] = useState<TabId>("seats");
    const [showSidebar, setShowSidebar] = useState(true);
    const [countdownMode, setCountdownMode] = useState<"simple" | "advanced">("simple");
    const [notes, setNotes] = useState('<p><span style="font-size: 22px"><strong>Password: </strong></span></p>');
    const { racers, setRacers } = useRacersGlobal();
    const [timer, setTimer] = useState<TimerState>(() => {
        const defaultSession = getDefaultTimerSession();
        return {
            startTime: defaultSession.start,
            endTime: defaultSession.end,
            isRunning: false,
            startedAt: null,
        };
    });
    const [projectorConfig, setProjectorConfig] = useState<ProjectorConfig>({
        showSeats: true,
        showNotes: true,
        showCountdown: true,
    });

    const [schedule, setSchedule] = useState<ScheduleState>({
        blocks: [],
        activeBlockId: null,
    });

    const { labId } = useMonitoring(matkul, kelas);

    const {
        matkulOptions, kelasOptions, eligibleStudents,
        isLoading, isOptionsLoading, isKelasLoading,
    } = useStudentData(matkul, kelas);

    const {
        columns, disabledSeats, dragSourceSeat, dragOverSeat,
        versions, assignedCount, activeSeatCount,
        handleGenerate, handleReset, restoreVersion, clearVersions, toggleDisabledSeat,
        handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd,
        seats,
    } = useSeats(eligibleStudents, matkul, kelas, isLoading);

    const handleRestoreVersion = useCallback(
        (v: SeatVersion) => {
            if (v.matkul && v.matkul !== matkul) {
                setMatkul(v.matkul);
            }
            if (v.kelas && v.kelas !== kelas) {
                setKelas(v.kelas);
            }
            restoreVersion(v);
            setActiveTab("seats");
        },
        [matkul, kelas, restoreVersion, setActiveTab]
    );

    const activeBlock = countdownMode === "advanced"
        ? schedule.blocks.find((b) => b.id === schedule.activeBlockId)
        : null;

    const seatLayoutRef = useRef<HTMLDivElement>(null);
    const [isSavingImage, setIsSavingImage] = useState(false);

    const handleSaveImage = async () => {
        if (!matkul || !kelas || assignedCount === 0) return;
        if (activeTab !== "seats") {
            setActiveTab("seats");
            await new Promise((resolve) => setTimeout(resolve, 150));
        }

        try {
            setIsSavingImage(true);
            // Berikan jeda agar header ter-render di DOM dan browser menyelesaikan reflow
            await new Promise((resolve) => setTimeout(resolve, 100));

            const node = seatLayoutRef.current;
            if (!node) return;

            // Ukur dimensi riil konten termasuk elemen yang scrollable/overflow
            const seatGridEl = node.querySelector(".seat-grid") as HTMLElement | null;

            const gridScrollWidth = seatGridEl ? seatGridEl.scrollWidth : 0;
            const nodeScrollWidth = node.scrollWidth;
            const contentWidth = Math.max(gridScrollWidth, nodeScrollWidth, node.offsetWidth);

            const gridScrollHeight = seatGridEl ? seatGridEl.scrollHeight : 0;
            const nodeScrollHeight = node.scrollHeight;
            const contentHeight = Math.max(nodeScrollHeight, gridScrollHeight, node.offsetHeight);

            const PADDING = 24;
            const totalWidth = Math.ceil(contentWidth + PADDING * 2);
            const totalHeight = Math.ceil(contentHeight + PADDING * 2);

            const filename = generateSeatPhotoFilename(matkul, kelas);
            const dataUrl = await toPng(node, {
                cacheBust: true,
                pixelRatio: 2,
                width: totalWidth,
                height: totalHeight,
                backgroundColor: theme === "dark" ? "#141517" : "#ffffff",
                style: {
                    width: `${totalWidth}px`,
                    height: `${totalHeight}px`,
                    maxWidth: "none",
                    maxHeight: "none",
                    padding: `${PADDING}px`,
                    margin: "0",
                    boxSizing: "border-box",
                    overflow: "visible",
                },
            });

            const link = document.createElement("a");
            link.download = filename;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Gagal menyimpan foto generator kursi:", err);
        } finally {
            setIsSavingImage(false);
        }
    };

    useProjectorSync({
        seats,
        disabledSeats,
        timer,
        notes,
        racers,
        projectorConfig,
        kelas,
        eligibleStudents,
        activeBlockLabel: activeBlock ? activeBlock.label : undefined,
        activeBlockColor: activeBlock ? activeBlock.color : undefined,
        schedule: countdownMode === "advanced" ? schedule : undefined,
    });

    useScheduleAutoAdvance({ schedule, setSchedule, timer, setTimer, countdownMode });

    return (
        <div className="app-container">
            <Sidebar
                showSidebar={showSidebar}
                matkul={matkul}
                setMatkul={setMatkul}
                kelas={kelas}
                setKelas={setKelas}
                matkulOptions={matkulOptions}
                kelasOptions={kelasOptions}
                disabledSeats={disabledSeats}
                toggleDisabledSeat={toggleDisabledSeat}
                eligibleStudents={eligibleStudents}
                isLoading={isLoading}
                isOptionsLoading={isOptionsLoading}
                isKelasLoading={isKelasLoading}
                handleGenerate={handleGenerate}
                handleReset={handleReset}
                totalSeats={columns.flat().length}
                projectorConfig={projectorConfig}
                setProjectorConfig={setProjectorConfig}
            />

            <main className="main-content">
                <KursiGeneratorHeader
                    matkul={matkul}
                    kelas={kelas}
                    assignedCount={assignedCount}
                    activeSeatCount={activeSeatCount}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    projectorConfig={projectorConfig}
                    setProjectorConfig={setProjectorConfig}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    showSidebar={showSidebar}
                    setShowSidebar={setShowSidebar}
                    countdownMode={countdownMode}
                    setCountdownMode={setCountdownMode}
                    timer={timer}
                    activeBlockLabel={activeBlock?.label}
                    onSaveImage={handleSaveImage}
                    isSavingImage={isSavingImage}
                />

                {activeTab === "seats" && (
                    !matkul || !kelas ? (
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            height: "100%", minHeight: "400px", color: "var(--text-muted)",
                            fontSize: "16px", flexDirection: "column", gap: "12px",
                        }}>
                            <LuLayoutGrid style={{ fontSize: "48px", opacity: 0.5 }} />
                            <span>Silakan pilih Mata Kuliah dan Kelas terlebih dahulu</span>
                        </div>
                    ) : (
                        <div ref={seatLayoutRef}>
                            {isSavingImage && (
                                <div className="pb-3 mb-3 border-b border-border/80 flex items-center justify-between flex-wrap gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-semibold text-foreground tracking-tight">{matkul}</span>
                                            <span className="text-muted-foreground">•</span>
                                            <span className="text-sm font-medium text-foreground/90">Kelas {kelas}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="font-medium text-xs">
                                            {assignedCount}/{activeSeatCount} Kursi Terisi
                                        </Badge>
                                    </div>
                                </div>
                            )}
                            <SeatsTab
                                columns={columns}
                                disabledSeats={disabledSeats}
                                dragSourceSeat={dragSourceSeat}
                                dragOverSeat={dragOverSeat}
                                isLoading={isLoading}
                                handleDragStart={handleDragStart}
                                handleDragOver={handleDragOver}
                                handleDragLeave={handleDragLeave}
                                handleDrop={handleDrop}
                                handleDragEnd={handleDragEnd}
                            />
                        </div>
                    )
                )}

                {activeTab === "notes" && (
                    <NotesTab notes={notes} setNotes={setNotes} />
                )}

                {activeTab === "countdown" && (
                    <CountdownTab
                        timer={timer}
                        setTimer={setTimer}
                        racers={racers}
                        setRacers={setRacers}
                        kelas={kelas}
                        eligibleStudents={eligibleStudents}
                        schedule={countdownMode === "advanced" ? schedule : undefined}
                        setSchedule={countdownMode === "advanced" ? setSchedule : undefined}
                        activeBlockLabel={activeBlock?.label}
                        activeBlockColor={activeBlock?.color}
                    />
                )}

                {activeTab === "leaderboard" && (
                    <LeaderboardTab
                        kelas={kelas}
                        eligibleStudents={eligibleStudents}
                        racers={racers}
                        setRacers={setRacers}
                    />
                )}

                {activeTab === "others" && (
                    <OthersTab
                        versions={versions}
                        restoreVersion={handleRestoreVersion}
                        clearVersions={clearVersions}
                        setActiveTab={setActiveTab}
                        currentMatkul={matkul}
                        currentKelas={kelas}
                        currentSeats={seats}
                    />
                )}
            </main>
        </div>
    );
}
