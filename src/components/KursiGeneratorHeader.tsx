import React from "react";
import type { TabId, ProjectorConfig } from "./types";
import {
    LuLayoutGrid,
    LuFileText,
    LuTimer,
    LuTrophy,
    LuSlidersHorizontal,
    LuMonitor,
    LuSun,
    LuMoon,
    LuPanelLeftOpen,
    LuPanelLeftClose,
} from "react-icons/lu";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

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
    showSidebar: boolean;
    setShowSidebar: (val: boolean) => void;
    countdownMode: "simple" | "advanced";
    setCountdownMode: (mode: "simple" | "advanced") => void;
}

const TAB_CONFIG: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "seats", label: "Kursi", icon: <LuLayoutGrid /> },
    { id: "notes", label: "Catatan", icon: <LuFileText /> },
    { id: "countdown", label: "Hitung Mundur", icon: <LuTimer /> },
    { id: "leaderboard", label: "Leaderboard", icon: <LuTrophy /> },
    { id: "others", label: "Lainnya", icon: <LuSlidersHorizontal /> },
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
    showSidebar,
    setShowSidebar,
    countdownMode,
    setCountdownMode,
}: KursiGeneratorHeaderProps) {
    return (
        <header className="w-full flex flex-col gap-2.5 pb-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setShowSidebar(!showSidebar)}
                        aria-label={showSidebar ? "Tutup sidebar konfigurasi" : "Buka sidebar konfigurasi"}
                        title={showSidebar ? "Tutup sidebar konfigurasi" : "Buka sidebar konfigurasi"}
                    >
                        {showSidebar ? <LuPanelLeftClose className="size-4" /> : <LuPanelLeftOpen className="size-4" />}
                    </Button>
                    <Badge variant="secondary" className="font-normal text-xs">
                        {assignedCount}/{activeSeatCount} kursi terisi
                    </Badge>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
                    title={theme === "dark" ? "Tema Terang" : "Tema Gelap"}
                >
                    {theme === "dark" ? <LuSun className="size-4" /> : <LuMoon className="size-4" />}
                </Button>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Tab bar */}
                <div className="flex items-center gap-3">
                    <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabId)}>
                        <TabsList>
                            {TAB_CONFIG.map(({ id, label, icon }) => (
                                <TabsTrigger key={id} value={id}>
                                    {icon}
                                    <span>{label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    {/* Mode switch untuk tab Hitung Mundur */}
                    {activeTab === "countdown" && (
                        <Tabs
                            value={countdownMode}
                            onValueChange={(val) => setCountdownMode(val as "simple" | "advanced")}
                        >
                            <TabsList>
                                <TabsTrigger value="simple">Basic</TabsTrigger>
                                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}
                </div>

                {/* Kontrol proyektor di sisi kanan */}
                <div className="flex items-center gap-4 flex-wrap ml-auto">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/60">
                        <span className="font-medium text-foreground/80">Proyektor:</span>
                        {(["showSeats", "showNotes", "showCountdown"] as const).map((key) => (
                            <div key={key} className="flex items-center gap-1.5">
                                <Checkbox
                                    id={`proj-${key}`}
                                    checked={projectorConfig[key]}
                                    onCheckedChange={(checked) =>
                                        setProjectorConfig((p) => ({ ...p, [key]: !!checked }))
                                    }
                                />
                                <Label htmlFor={`proj-${key}`} className="text-xs font-normal cursor-pointer select-none">
                                    {key === "showSeats" ? "Kursi" : key === "showNotes" ? "Catatan" : "Waktu"}
                                </Label>
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="default"
                        size="default"
                        className="gap-1.5"
                        onClick={() =>
                            window.open(
                                "/projector",
                                "ProjectorWindow",
                                "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes"
                            )
                        }
                    >
                        <LuMonitor className="size-4" />
                        <span>Tampilkan Window Proyektor</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
