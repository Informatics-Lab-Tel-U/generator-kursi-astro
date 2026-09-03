import React from "react";
import type { TabId, ProjectorConfig } from "./types";
import {
    LuLayoutGrid,
    LuFileText,
    LuTimer,
    LuMonitor,
    LuSun,
    LuMoon,
} from "react-icons/lu";

interface KursiGeneratorHeaderProps {
    matkul: string;
    kelas: string;
    assignedCount: number;
    activeSeatCount: number;
    activeTab: TabId;
    setActiveTab: (tab: TabId) => void;
    projectorConfig: ProjectorConfig;
    setProjectorConfig: React.Dispatch<React.SetStateAction<ProjectorConfig>>;
    theme: "light" | "dark";
    toggleTheme: () => void;
}

const TAB_CONFIG: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "seats", label: "Kursi", icon: <LuLayoutGrid /> },
    { id: "notes", label: "Catatan", icon: <LuFileText /> },
    { id: "countdown", label: "Hitung Mundur", icon: <LuTimer /> },
];

export default function KursiGeneratorHeader({
    matkul,
    kelas,
    assignedCount,
    activeSeatCount,
    activeTab,
    setActiveTab,
    projectorConfig,
    setProjectorConfig,
    theme,
    toggleTheme,
}: KursiGeneratorHeaderProps) {
    return (
        <header className="main-header">
            <div className="header-top-row">
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <h1 className="main-title">Generator {matkul} {kelas}</h1>
                    <div className="main-subtitle">{assignedCount}/{activeSeatCount} kursi terisi</div>
                </div>
                <button
                    className="theme-toggle"
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
                    title={theme === "dark" ? "Tema Terang" : "Tema Gelap"}
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
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                            {icon}
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div className="projector-bar">
                        <span className="projector-bar-label">Proyektor:</span>
                        {(["showSeats", "showNotes", "showCountdown"] as const).map((key) => (
                            <label key={key}>
                                <input
                                    type="checkbox"
                                    checked={projectorConfig[key]}
                                    onChange={(e) =>
                                        setProjectorConfig((p) => ({ ...p, [key]: e.target.checked }))
                                    }
                                />
                                {key === "showSeats" ? "Kursi" : key === "showNotes" ? "Catatan" : "Waktu"}
                            </label>
                        ))}
                    </div>
                    <button
                        className="btn btn-primary"
                        style={{ padding: "0 16px", height: "42px", boxSizing: "border-box", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
                        onClick={() =>
                            window.open(
                                "/projector",
                                "ProjectorWindow",
                                "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes"
                            )
                        }
                    >
                        <LuMonitor />
                        Tampilkan Window Proyektor
                    </button>
                </div>
            </div>
        </header>
    );
}
