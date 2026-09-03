import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./KursiGenerator.css";

import type { TabId, ProjectorConfig, TimerState } from "./types";
import type { Racer } from "./types";
import { getDefaultTimerSession } from "./utils";

import { useTheme } from "../hooks/useTheme";
import { useMonitoring } from "../hooks/useMonitoring";
import { useStudentData } from "../hooks/useStudentData";
import { useSeats } from "../hooks/useSeats";
import { useProjectorSync } from "../hooks/useProjectorSync";

import Sidebar from "./Sidebar";
import SeatsTab from "./SeatsTab";
import NotesTab from "./NotesTab";
import CountdownTab from "./CountdownTab";
import KursiGeneratorHeader from "./KursiGeneratorHeader";
import { LuLayoutGrid, LuPanelLeftOpen } from "react-icons/lu";

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

    // Custom hooks — masing-masing bertanggung jawab atas satu domain logika
    const { labId } = useMonitoring(kelas);

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
    });

    return (
        <div className="app-container">
            {!showSidebar && (
                <button
                    className="sidebar-toggle closed"
                    onClick={() => setShowSidebar(true)}
                    aria-label="Buka sidebar"
                >
                    <LuPanelLeftOpen style={{ fontSize: "20px" }} />
                </button>
            )}

            <Sidebar
                showSidebar={showSidebar}
                setShowSidebar={setShowSidebar}
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
                versions={versions}
                restoreVersion={restoreVersion}
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
                    />
                )}
            </main>
        </div>
    );
}
