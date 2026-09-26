import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./KursiGenerator.css";

import type { TabId, ProjectorConfig, TimerState, ScheduleState } from "./types";
import type { Racer } from "./types";
import { getDefaultTimerSession } from "./utils";

import { useTheme } from "../hooks/useTheme";
import { useMonitoring } from "../hooks/useMonitoring";
import { useStudentData } from "../hooks/useStudentData";
import { useSeats } from "../hooks/useSeats";
import { useProjectorSync } from "../hooks/useProjectorSync";
import { useScheduleAutoAdvance } from "../hooks/useCountdown";

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
    const [notes, setNotes] = useState("<h2>Modul 13</h2><hr><p>Password: abcd123</p>");
    const [racers, setRacers] = useState<Racer[]>([]);
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
        showNotes: false,
        showCountdown: false,
    });

    const [schedule, setSchedule] = useState<ScheduleState>({
        blocks: [],
        activeBlockId: null,
    });

    // Custom hooks — masing-masing bertanggung jawab atas satu domain logika
    const { labId } = useMonitoring(matkul, kelas);

    const {
        matkulOptions, kelasOptions, eligibleStudents,
        isLoading, isOptionsLoading, isKelasLoading,
    } = useStudentData(matkul, kelas);

    const {
        columns, disabledSeats, dragSourceSeat, dragOverSeat,
        versions, assignedCount, activeSeatCount,
        handleGenerate, handleReset, restoreVersion, toggleDisabledSeat,
        handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd,
        seats,
    } = useSeats(eligibleStudents, matkul, kelas, isLoading);

    const activeBlock = countdownMode === "advanced"
        ? schedule.blocks.find((b) => b.id === schedule.activeBlockId)
        : null;

    // Sinkronisasi state ke window Proyektor via BroadcastChannel
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

    // Auto-advance sesi di root — berjalan di semua tab, tidak bergantung tab countdown aktif
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

                {/* LeaderboardTab selalu di-mount (tidak pakai conditional &&) agar polling
                    interval di LeaderboardView tidak berhenti saat user pindah ke tab lain.
                    Hidden via CSS ketika tab tidak aktif. */}
                <div style={{ display: activeTab === "leaderboard" ? "block" : "none" }}>
                    <LeaderboardTab
                        kelas={kelas}
                        eligibleStudents={eligibleStudents}
                        racers={racers}
                        setRacers={setRacers}
                    />
                </div>

                {activeTab === "others" && (
                    <OthersTab
                        versions={versions}
                        restoreVersion={restoreVersion}
                        setActiveTab={setActiveTab}
                    />
                )}
            </main>
        </div>
    );
}
