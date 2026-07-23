import { useState, useEffect, useCallback, useRef } from "react";
import type { Student } from "./types";
import "./KursiGenerator.css";

import type {
    SeatData,
    TimerState,
    Racer,
    TabId,
    ProjectorConfig,
    SeatVersion,
} from "./types";
import { makeEmptySeats, fisherYatesShuffle, getDefaultTimerSession } from "./utils";
import { detectCurrentLabRoom } from "../lib/fontDetector";

import Sidebar from "./Sidebar";
import SeatsTab from "./SeatsTab";
import NotesTab from "./NotesTab";
import CountdownTab from "./CountdownTab";
import {
    LuLayoutGrid,
    LuFileText,
    LuTimer,
    LuMonitor,
    LuSun,
    LuMoon,
    LuPanelLeftOpen,
} from "react-icons/lu";

function getRequiredTotalSeats(studentsCount: number, disabledSeats: Set<number>) {
    if (studentsCount === 0) return 50;
    let c = 10;
    while (true) {
        let disabledInC = 0;
        for (let d of disabledSeats) {
            if (d <= c) disabledInC++;
        }
        if (c - disabledInC >= studentsCount) {
            break;
        }
        c += 10;
    }
    return c;
}

function useTheme() {
    const [theme, setTheme] = useState<"light" | "dark">(() => {
        if (typeof window !== "undefined") {
            return (
                (document.documentElement.getAttribute("data-theme") as
                    | "light"
                    | "dark") || "dark"
            );
        }
        return "dark";
    });

    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem("kursi-theme", next);
            return next;
        });
    }, []);

    return { theme, toggleTheme };
}
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

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
    const [seats, setSeats] = useState<SeatData[]>(makeEmptySeats(50));
    const [disabledSeats, setDisabledSeats] = useState<Set<number>>(new Set([1, 2]));
    const [activeTab, setActiveTab] = useState<TabId>("seats");

    const [showSidebar, setShowSidebar] = useState(true);
    const [versions, setVersions] = useState<SeatVersion[]>([]);

    // Monitoring State
    const [labId, setLabId] = useState<string | null>(null);

    // Ref untuk membaca seats terkini tanpa memasukkannya ke dependency array useEffect
    // (mencegah circular re-render loop pada disabled seat logic)
    const seatsRef = useRef<SeatData[]>(seats);
    useEffect(() => { seatsRef.current = seats; }, [seats]);

    // BroadcastChannel persisten — dibuat sekali, tidak di-recreate setiap render
    const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("kursi_versions");
            if (saved) {
                const parsed: SeatVersion[] = JSON.parse(saved);
                const now = Date.now();
                const valid = parsed.filter(v => now - v.timestamp < 2 * 60 * 60 * 1000); // 2 jam
                setVersions(valid);
                if (valid.length !== parsed.length) {
                    localStorage.setItem("kursi_versions", JSON.stringify(valid));
                }
            }
        } catch (e) { }

        // Deteksi apakah PC ini adalah PC Lab menggunakan Font Fingerprinting
        detectCurrentLabRoom().then((room) => {
            if (room) {
                console.log(`[Monitoring] Terdeteksi sebagai PC Lab: ${room}`);
                setLabId(room);
            } else {
                console.log("[Monitoring] Bukan PC Lab (Identitas Font tidak ditemukan).");
            }
        }).catch(console.error);
    }, []);

    const workerRef = useRef<Worker | null>(null);

    // Inisialisasi Web Worker sekali
    useEffect(() => {
        if (typeof window !== "undefined") {
            workerRef.current = new Worker(
                new URL('../workers/heartbeat.worker.ts', import.meta.url),
                { type: 'module' }
            );
        }
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    // Heartbeat Monitoring ke Manajemen Asprak (via Web Worker)
    useEffect(() => {
        if (!labId || !kelas || !workerRef.current) return;

        const MA_URL = import.meta.env.PUBLIC_MANAJEMENASPRAK_URL || "https://manajemenasprak.iflabdev.workers.dev";
        const API_KEY = import.meta.env.PUBLIC_PRAKTIKAN_GET_API_KEY || import.meta.env.PRAKTIKAN_GET_API_KEY || "";

        const payload = {
            labId,
            kelas,
            apiUrl: MA_URL,
            apiKey: API_KEY
        };

        workerRef.current.postMessage({
            action: 'start',
            payload
        });

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && workerRef.current) {
                console.log('[Monitoring] Tab aktif kembali, mengirim heartbeat segera via Worker.');
                workerRef.current.postMessage({ action: 'immediate', payload });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (workerRef.current) {
                workerRef.current.postMessage({ action: 'stop' });
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [labId, kelas]);

    // React Query State
    const { data: matkulOptions = [], isLoading: isOptionsLoading } = useQuery({
        queryKey: ['matkulOptions'],
        queryFn: async () => {
            const res = await fetch("/api/praktikan/mata-kuliah");
            const data = await res.json();
            if (data && data.ok && Array.isArray(data.data)) {
                return data.data.map((m: string) => ({ value: m, label: m }));
            }
            return [];
        },
        staleTime: 1000 * 60 * 5, // 5 menit
    });

    const { data: kelasOptions = [], isLoading: isKelasLoading } = useQuery({
        queryKey: ['kelasOptions', matkul],
        queryFn: async () => {
            if (!matkul) return [];
            const res = await fetch(`/api/praktikan/kelas?mata_kuliah=${encodeURIComponent(matkul)}`);
            const data = await res.json();
            if (data && data.ok && Array.isArray(data.data)) {
                return data.data.map((k: string) => ({ value: k, label: k }));
            }
            return [];
        },
        enabled: !!matkul,
        staleTime: 1000 * 60 * 5,
    });

    const { data: eligibleStudents = [], isLoading } = useQuery({
        queryKey: ['students', matkul, kelas],
        queryFn: async () => {
            if (!matkul || !kelas) return [];
            let url = `/api/praktikan?mata_kuliah=${encodeURIComponent(matkul)}&kelas=${encodeURIComponent(kelas)}`;
            const res = await fetch(url);
            const data = await res.json();
            const payload = data.data || data;
            if (Array.isArray(payload)) {
                return payload.map((s: any) => ({
                    id: s.id ? String(s.id) : `stu-${Math.random()}`,
                    name: s.nama || "Unknown",
                    kelas: s.kelas || kelas,
                    asprak: s.kode_asprak || "N/A",
                }));
            }
            return [];
        },
        enabled: !!matkul && !!kelas,
        staleTime: 1000 * 60 * 5,
    });

    // Handle auto-generation when students change
    useEffect(() => {
        if (!matkul || !kelas || eligibleStudents.length === 0) {
            setSeats(makeEmptySeats(50));
            return;
        }

        // Auto generate immediately
        const shuffled = fisherYatesShuffle(eligibleStudents);
        const reqSeats = getRequiredTotalSeats(eligibleStudents.length, disabledSeats);
        const newSeats = makeEmptySeats(reqSeats);
        let idx = 0;
        for (let i = 0; i < reqSeats; i++) {
            if (!disabledSeats.has(i + 1) && idx < shuffled.length) {
                newSeats[i].student = shuffled[idx++];
            }
        }
        setSeats(newSeats);
    }, [eligibleStudents, matkul, kelas]); // Dependency on eligibleStudents reference from useQuery

    const [dragSourceSeat, setDragSourceSeat] = useState<number | null>(null);
    const [dragOverSeat, setDragOverSeat] = useState<number | null>(null);

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

    const [notes, setNotes] = useState<string>(
        "<h2>Modul 13</h2><hr><p>Password: abcd123</p>",
    );

    const [projectorConfig, setProjectorConfig] = useState<ProjectorConfig>({
        showSeats: true,
        showNotes: false,
        showCountdown: false,
    });



    // Broadcast to Projector — channel dibuat sekali, tidak ditutup/dibuka ulang setiap render
    useEffect(() => {
        const channel = new BroadcastChannel("kursi-gen-sync");
        broadcastChannelRef.current = channel;

        // Respond to REQUEST_SYNC dari projector yang baru dibuka
        channel.onmessage = (event) => {
            if (event.data?.type === "REQUEST_SYNC") {
                channel.postMessage({
                    seats: seatsRef.current,
                    disabledSeats: Array.from(disabledSeats),
                    timer,
                    notes,
                    racers,
                    projectorConfig,
                    kelas,
                    eligibleStudents,
                });
            }
        };

        return () => {
            channel.close();
            broadcastChannelRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // dibuat sekali saat mount

    // Kirim update ke projector setiap kali state relevan berubah
    useEffect(() => {
        const channel = broadcastChannelRef.current;
        if (!channel) return;
        channel.postMessage({
            seats,
            disabledSeats: Array.from(disabledSeats),
            timer,
            notes,
            racers,
            projectorConfig,
            kelas,
            eligibleStudents,
        });
    }, [seats, disabledSeats, timer, notes, racers, projectorConfig, kelas, eligibleStudents]);

    // Generate
    const handleGenerate = useCallback(() => {
        // Simulasikan loading singkat saat tombol diklik agar UI lebih responsif
        setSeats([]);
        setTimeout(() => {
            const filtered = eligibleStudents;
            const shuffled = fisherYatesShuffle(filtered);
            const reqSeats = getRequiredTotalSeats(filtered.length, disabledSeats);
            const newSeats = makeEmptySeats(reqSeats);
            let idx = 0;
            for (let i = 0; i < reqSeats; i++) {
                if (!disabledSeats.has(i + 1) && idx < shuffled.length) {
                    newSeats[i].student = shuffled[idx++];
                }
            }
            setSeats(newSeats);

            const newVersion: SeatVersion = {
                id: Math.random().toString(36).substring(2, 11),
                timestamp: Date.now(),
                seats: newSeats,
                matkul,
                kelas,
            };

            setVersions((prev) => {
                const next = [newVersion, ...prev].slice(0, 20); // Simpan 20 riwayat terakhir
                localStorage.setItem("kursi_versions", JSON.stringify(next));
                return next;
            });
        }, 500);
    }, [eligibleStudents, disabledSeats, matkul, kelas]);

    const restoreVersion = useCallback((version: SeatVersion) => {
        setMatkul(version.matkul);
        setKelas(version.kelas);
        setSeats(version.seats);
    }, []);

    const handleReset = useCallback(
        () => setSeats(makeEmptySeats(getRequiredTotalSeats(eligibleStudents.length, disabledSeats))),
        [eligibleStudents.length, disabledSeats],
    );

    const toggleDisabledSeat = useCallback((seatNo: number) => {
        setDisabledSeats((prev) => {
            const next = new Set(prev);
            next.has(seatNo) ? next.delete(seatNo) : next.add(seatNo);
            return next;
        });
    }, []);

    // Regenerate seats jika ada disabled seat yang terisi.
    // Gunakan seatsRef (bukan seats langsung) agar tidak masuk dependency array
    // dan memicu re-render loop saat handleGenerate mengubah seats.
    useEffect(() => {
        const needsRegeneration = seatsRef.current.some(
            (seat) => disabledSeats.has(seat.seatNo) && seat.student !== null
        );
        if (needsRegeneration && eligibleStudents.length > 0 && !isLoading) {
            handleGenerate();
        }
        // seats sengaja dihapus dari deps — dibaca via seatsRef untuk cegah loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [disabledSeats, eligibleStudents.length, isLoading, handleGenerate]);

    // Drag-and-drop
    const handleDragStart = useCallback(
        (seatNo: number) => setDragSourceSeat(seatNo),
        [],
    );
    const handleDragOver = useCallback((e: React.DragEvent, seatNo: number) => {
        e.preventDefault();
        setDragOverSeat(seatNo);
    }, []);
    const handleDragLeave = useCallback(() => setDragOverSeat(null), []);
    const handleDrop = useCallback(
        (targetSeatNo: number) => {
            if (dragSourceSeat === null || dragSourceSeat === targetSeatNo) {
                setDragSourceSeat(null);
                setDragOverSeat(null);
                return;
            }
            setSeats((prev) => {
                const next = [...prev];
                const srcIdx = dragSourceSeat - 1;
                const tgtIdx = targetSeatNo - 1;
                const temp = next[srcIdx].student;
                next[srcIdx] = {
                    ...next[srcIdx],
                    student: next[tgtIdx].student,
                };
                next[tgtIdx] = { ...next[tgtIdx], student: temp };
                return next;
            });
            setDragSourceSeat(null);
            setDragOverSeat(null);
        },
        [dragSourceSeat],
    );

    const handleDragEnd = useCallback(() => {
        setDragSourceSeat(null);
        setDragOverSeat(null);
    }, []);

    const assignedCount = seats.filter((s) => s.student !== null).length;
    const currentTotalSeats = getRequiredTotalSeats(eligibleStudents.length, disabledSeats);
    let disabledInC = 0;
    for (let d of disabledSeats) if (d <= currentTotalSeats) disabledInC++;
    const activeSeatCount = currentTotalSeats - disabledInC;

    const displaySeats = makeEmptySeats(currentTotalSeats).map((emptySeat, i) => {
        return seats[i] || emptySeat;
    });

    const columns: SeatData[][] = [];
    for (let c = 0; c < currentTotalSeats / 10; c++) {
        columns.push(displaySeats.slice(c * 10, (c + 1) * 10));
    }

    const TAB_CONFIG: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: "seats", label: "Kursi", icon: <LuLayoutGrid /> },
        { id: "notes", label: "Catatan", icon: <LuFileText /> },
        { id: "countdown", label: "Hitung Mundur", icon: <LuTimer /> },
    ];

    return (
        <div className="app-container">
            {!showSidebar && (
                <button
                    className={`sidebar-toggle closed`}
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
                totalSeats={currentTotalSeats}
                projectorConfig={projectorConfig}
                setProjectorConfig={setProjectorConfig}
                versions={versions}
                restoreVersion={restoreVersion}
            />

            <main className="main-content">
                <header className="main-header">
                    <div className="header-top-row">
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                flexWrap: "wrap",
                            }}
                        >
                            <h1 className="main-title">
                                Generator {matkul} {kelas}
                            </h1>
                            <div className="main-subtitle">
                                {assignedCount}/{activeSeatCount} kursi terisi
                            </div>
                        </div>
                        <button
                            className="theme-toggle"
                            onClick={toggleTheme}
                            aria-label={
                                theme === "dark"
                                    ? "Ganti ke tema terang"
                                    : "Ganti ke tema gelap"
                            }
                            title={
                                theme === "dark" ? "Tema Terang" : "Tema Gelap"
                            }
                        >
                            {theme === "dark" ? <LuSun /> : <LuMoon />}
                        </button>
                    </div>

                    <div className="header-bottom-row">
                        <div className="tab-bar">
                            {TAB_CONFIG.map(({ id, label, icon }) => (
                                <button
                                    key={id}
                                    className={`tab ${activeTab === id ? "active" : ""}`}
                                    onClick={() => setActiveTab(id)}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                    }}
                                >
                                    {icon}
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                flexWrap: "wrap",
                            }}
                        >
                            <div className="projector-bar">
                                <span className="projector-bar-label">
                                    Proyektor:
                                </span>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={projectorConfig.showSeats}
                                        onChange={(e) =>
                                            setProjectorConfig((p) => ({
                                                ...p,
                                                showSeats: e.target.checked,
                                            }))
                                        }
                                    />
                                    Kursi
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={projectorConfig.showNotes}
                                        onChange={(e) =>
                                            setProjectorConfig((p) => ({
                                                ...p,
                                                showNotes: e.target.checked,
                                            }))
                                        }
                                    />
                                    Catatan
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={projectorConfig.showCountdown}
                                        onChange={(e) =>
                                            setProjectorConfig((p) => ({
                                                ...p,
                                                showCountdown: e.target.checked,
                                            }))
                                        }
                                    />
                                    Waktu
                                </label>
                            </div>

                            <button
                                className="btn btn-secondary"
                                style={{
                                    padding: "6px 12px",
                                    fontSize: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                                onClick={() =>
                                    window.open(
                                        "/projector",
                                        "ProjectorWindow",
                                        "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes",
                                    )
                                }
                            >
                                <LuMonitor />
                                Buka
                            </button>
                        </div>
                    </div>
                </header>

                {activeTab === "seats" && (
                    (!matkul || !kelas) ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: '400px',
                            color: 'var(--text-muted)',
                            fontSize: '16px',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <LuLayoutGrid style={{ fontSize: '48px', opacity: 0.5 }} />
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
