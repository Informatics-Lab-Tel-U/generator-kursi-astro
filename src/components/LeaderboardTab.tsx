import React from "react";
import type { Racer, Student } from "./types";
import { LuCamera, LuCopy, LuCheck, LuTrash2, LuUserPlus } from "react-icons/lu";
import LeaderboardView from "./LeaderboardView";
import { useRacers, useMoodleScript } from "../hooks/useCountdown";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

interface LeaderboardTabProps {
    kelas?: string;
    eligibleStudents?: Student[];
    racers: Racer[];
    setRacers?: React.Dispatch<React.SetStateAction<Racer[]>>;
}

export default function LeaderboardTab({
    kelas = "",
    eligibleStudents = [],
    racers,
    setRacers,
}: LeaderboardTabProps) {
    const {
        newRacerName,
        setNewRacerName,
        addRacer,
        removeRacer,
        handleRacerImageUpload,
    } = useRacers(racers, setRacers);

    const {
        isCopied,
        showScript,
        setShowScript,
        generateScript,
        copyScript,
    } = useMoodleScript(kelas);

    return (
        <div className="leaderboard-tab w-full flex flex-col gap-5">
            {/* Pengaturan pembalap asprak */}
            <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-foreground">
                        Daftar Pembalap (ASPRAK)
                    </h3>
                    <Badge variant="secondary" className="font-normal text-xs">
                        {racers.length} pembalap
                    </Badge>
                </div>

                <div className="flex gap-2 mb-4">
                    <Input
                        type="text"
                        placeholder="Kode ASPRAK (contoh: AFF)"
                        value={newRacerName}
                        onChange={(e) => setNewRacerName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addRacer()}
                        aria-label="Kode ASPRAK baru"
                        className="max-w-xs"
                    />
                    <Button onClick={addRacer} className="gap-1.5">
                        <LuUserPlus className="size-4" />
                        <span>Tambah</span>
                    </Button>
                </div>

                <div className="racer-list flex flex-col gap-2">
                    {racers.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-xs border border-dashed border-border rounded-md">
                            Belum ada pembalap. Tambahkan kode asprak untuk balapan di tab Hitung Mundur.
                        </div>
                    ) : (
                        racers.map((r) => (
                            <div
                                key={r.id}
                                className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/30 border border-border/50"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Avatar size="sm">
                                        {r.imageBase64 && <AvatarImage src={r.imageBase64} alt={r.name} />}
                                        <AvatarFallback className="font-semibold text-xs uppercase">
                                            {r.name.slice(0, 3)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-xs text-foreground tracking-wide font-mono">
                                        {r.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <label className="inline-flex cursor-pointer">
                                        <span className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium h-7 px-2.5 gap-1.5 transition-colors">
                                            <LuCamera className="size-3.5 text-muted-foreground" />
                                            <span>Foto</span>
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(e) => handleRacerImageUpload(r.id, e)}
                                        />
                                    </label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => removeRacer(r.id)}
                                        title={`Hapus pembalap ${r.name}`}
                                        aria-label={`Hapus pembalap ${r.name}`}
                                    >
                                        <LuTrash2 className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Skrip integrasi moodle leaderboard */}
            <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-foreground">Setup Moodle Leaderboard</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowScript(!showScript)}
                    >
                        {showScript ? "Sembunyikan" : "Tampilkan Script"}
                    </Button>
                </div>

                {showScript && (
                    <p className="text-xs text-muted-foreground leading-relaxed m-0">
                        Copy script di bawah ini, lalu buka halaman grading Moodle. Buka Developer Console (F12, pilih tab Console), paste, lalu tekan Enter.
                    </p>
                )}

                <div className="relative bg-muted/40 p-3 min-h-[48px] rounded-md border border-border/60">
                    {showScript ? (
                        <pre className="m-0 text-[11px] overflow-x-auto text-muted-foreground font-mono pr-20 whitespace-pre-wrap">
                            {generateScript()}
                        </pre>
                    ) : (
                        <div className="text-xs text-muted-foreground">
                            Script tersembunyi. Klik "Tampilkan Script" atau langsung Copy.
                        </div>
                    )}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={copyScript}
                        className="absolute top-2 right-2 gap-1.5"
                        aria-label="Salin script Moodle"
                    >
                        {isCopied ? (
                            <>
                                <LuCheck className="size-3.5 text-primary" />
                                <span>Copied</span>
                            </>
                        ) : (
                            <>
                                <LuCopy className="size-3.5" />
                                <span>Copy</span>
                            </>
                        )}
                    </Button>
                </div>

                <div className="text-right text-[11px] text-muted-foreground">
                    credit to{" "}
                    <a
                        href="https://github.com/rafiathallah"
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-primary hover:underline font-semibold"
                    >
                        @rafiathallah
                    </a>
                </div>
            </div>

            {/* Live Leaderboard Table */}
            <LeaderboardView room={kelas} students={eligibleStudents} />
        </div>
    );
}
