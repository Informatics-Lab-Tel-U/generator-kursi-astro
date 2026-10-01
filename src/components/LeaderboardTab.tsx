import React from "react";
import type { Racer, Student } from "./types";
import { LuUserPlus } from "react-icons/lu";
import LeaderboardView from "./LeaderboardView";
import { useRacers } from "../hooks/useCountdown";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import RacerCard from "./RacerCard";

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
    } = useRacers(racers, setRacers);

    return (
        <div className="leaderboard-tab mt-5 w-full flex flex-col gap-5">
            {}
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

                {racers.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg">
                        Belum ada pembalap. Tambahkan kode asprak untuk balapan di tab Hitung Mundur.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        {racers.map((r, idx) => (
                            <RacerCard
                                key={r.id}
                                racer={r}
                                index={idx}
                                onRemove={removeRacer}
                            />
                        ))}
                    </div>
                )}
            </div>

            {}
            <LeaderboardView room={kelas} students={eligibleStudents} />
        </div>
    );
}
