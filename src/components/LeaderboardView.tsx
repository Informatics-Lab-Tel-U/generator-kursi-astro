import React, { useEffect, useState, useMemo } from 'react';
import type { Student } from './types';
import { LuSettings, LuFileText, LuBan } from 'react-icons/lu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from 'cn';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from './ui/table';

interface LeaderboardViewProps {
    room: string;
    students: Student[];
}

function parseTimeTaken(timeStr: string): number {
    if (!timeStr || timeStr === '-' || timeStr === 'Not yet graded') return Infinity;

    let totalMinutes = 0;
    const hoursMatch = timeStr.match(/(\d+)\s*(?:hour|jam)/i);
    if (hoursMatch) {
        totalMinutes += parseInt(hoursMatch[1], 10) * 60;
    }
    const minsMatch = timeStr.match(/(\d+)\s*(?:min|menit)/i);
    if (minsMatch) {
        totalMinutes += parseInt(minsMatch[1], 10);
    }
    const secsMatch = timeStr.match(/(\d+)\s*(?:sec|detik)/i);
    if (secsMatch) {
        totalMinutes += parseInt(secsMatch[1], 10) / 60;
    }

    if (totalMinutes > 0) return totalMinutes;

    // format waktu: "HH:MM:SS" ato "MM:SS"
    const colonParts = timeStr.split(':').map(Number);
    if (colonParts.length === 3 && !colonParts.some(isNaN)) {
        return colonParts[0] * 60 + colonParts[1] + colonParts[2] / 60;
    } else if (colonParts.length === 2 && !colonParts.some(isNaN)) {
        return colonParts[0] + colonParts[1] / 60;
    }

    return Infinity;
}

export default function LeaderboardView({ room, students }: LeaderboardViewProps) {
    const [realtimeData, setRealtimeData] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [lastUpdateDate, setLastUpdateDate] = useState<Date | null>(null);
    const [isDataStale, setIsDataStale] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [sortMode, setSortMode] = useState<'finished' | 'in-progress'>('finished');

    const activeRoom = room || 'default';

    useEffect(() => {
        setRealtimeData([]);
        setLastUpdated(null);
        setIsConnected(false);

        // Jangan polling jika room tidak valid atau strip
        if (!room || room === "-") {
            return;
        }

        let consecutiveErrors = 0;
        const MAX_ERRORS = 3; // Berhenti polling setelah 3x gagal berturut-turut
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const fetchData = async () => {
            // Jangan fetch saat tab tidak aktif — hemat resource & cegah request menumpuk
            if (document.visibilityState === "hidden") return;

            try {
                const response = await fetch(`/api/leaderboard?room=${encodeURIComponent(activeRoom)}`);
                if (response.ok) {
                    const incomingData = await response.json();
                    if (Array.isArray(incomingData)) {
                        setRealtimeData(incomingData);
                        const now = new Date();
                        setLastUpdated(now.toLocaleTimeString());
                        setLastUpdateDate(now);
                        setIsDataStale(false);
                        setIsConnected(true);
                        consecutiveErrors = 0; // Reset error counter saat berhasil
                    }
                } else {
                    consecutiveErrors++;
                    setIsConnected(false);
                    // Setelah MAX_ERRORS kali gagal, hentikan polling & tampilkan status
                    if (consecutiveErrors >= MAX_ERRORS && intervalId) {
                        clearInterval(intervalId);
                        intervalId = null;
                    }
                }
            } catch (error) {
                console.error("Failed fetching leaderboard data:", error);
                consecutiveErrors++;
                setIsConnected(false);
                if (consecutiveErrors >= MAX_ERRORS && intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            }
        };

        fetchData();
        // Polling setiap 5 detik — selaras dengan interval script Moodle (5s),
        // sehingga setiap push Moodle akan terdeteksi pada polling berikutnya.
        intervalId = setInterval(fetchData, 5000);

        // Ketika tab kembali aktif setelah diminimize/background, langsung fetch seketika
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchData();
            }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            if (intervalId) clearInterval(intervalId);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [activeRoom]);


    useEffect(() => {
        const interval = setInterval(() => {
            if (lastUpdateDate) {
                const now = new Date();
                const diff = now.getTime() - lastUpdateDate.getTime();
                setIsDataStale(diff > 60000);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lastUpdateDate]);

    const sortedData = useMemo(() => {
        return [...realtimeData]
            .filter(row => {
                const name = (row['NAME'] || '').trim().toLowerCase();
                return !(name.includes('overall') && name.includes('average')) && !name.includes('rata-rata');
            })
            .sort((a, b) => {
                const stateA = a['STATE'] || '';
                const stateB = b['STATE'] || '';
                const isAInProgress = stateA === 'In progress' || stateA === 'Not yet graded';
                const isBInProgress = stateB === 'In progress' || stateB === 'Not yet graded';

                if (sortMode === 'in-progress') {
                    if (isAInProgress && !isBInProgress) return -1;
                    if (!isAInProgress && isBInProgress) return 1;
                } else {
                    if (stateA === 'Finished' && stateB !== 'Finished') return -1;
                    if (stateA !== 'Finished' && stateB === 'Finished') return 1;
                }
                return parseTimeTaken(a['TIME TAKEN'] || '') - parseTimeTaken(b['TIME TAKEN'] || '');
            });
    }, [realtimeData, sortMode]);

    const hasData = sortedData.length > 0;
    const totalStudents = sortedData.length;
    const completedStudentsCount = sortedData.filter(row => row['STATE'] === 'Finished').length;
    const notCompletedStudentsCount = totalStudents - completedStudentsCount;

    return (
        <div className="leaderboard-natural w-full flex flex-col rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 m-0">
                        Leaderboard - {room || 'No Room'}
                        {isDataStale && <LuBan className="text-destructive size-4" title="Data is stale (no updates for >60s)" />}
                    </h3>
                    <Badge variant={isConnected ? "secondary" : "destructive"} className="gap-1.5 font-normal text-xs">
                        <span className={`size-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-destructive"}`} />
                        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </Badge>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortMode(prev => prev === 'finished' ? 'in-progress' : 'finished')}
                        className="gap-1.5"
                    >
                        <LuSettings className="size-3.5" />
                        <span>{sortMode === 'in-progress' ? 'Urutkan: In Progress' : 'Urutkan: Normal'}</span>
                    </Button>
                </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 max-h-[600px]">
                {!hasData ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                        <LuFileText className="size-12 mb-3 opacity-40" />
                        <h4 className="m-0 mb-1 text-sm font-semibold text-foreground">Menunggu Data dari Moodle...</h4>
                        <p className="text-xs max-w-sm text-center m-0">
                            Pastikan script dijalankan di console Moodle. Data akan otomatis muncul di sini.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-muted/30 p-3 rounded-lg border border-border text-center">
                                <div className="text-xs text-muted-foreground font-medium">Total Peserta</div>
                                <div className="text-xl font-bold mt-1 text-foreground">{totalStudents}</div>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-lg border border-border text-center">
                                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Selesai</div>
                                <div className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{completedStudentsCount}</div>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-lg border border-border text-center">
                                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">Sedang Mengerjakan</div>
                                <div className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">{notCompletedStudentsCount}</div>
                            </div>
                        </div>

                        <div className="rounded-md border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                                        <TableHead className="w-16 text-center text-xs font-medium text-muted-foreground">Rank</TableHead>
                                        <TableHead className="text-xs font-medium text-muted-foreground">Nama Peserta</TableHead>
                                        <TableHead className="w-36 text-xs font-medium text-muted-foreground">Status</TableHead>
                                        <TableHead className="w-28 text-right text-xs font-medium text-muted-foreground">Waktu</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedData.map((row, idx) => {
                                        const isFinished = row['STATE'] === 'Finished';

                                        let timeValue = row['TIME TAKEN'] || '-';
                                        if (typeof timeValue === 'string') {
                                            const m = timeValue.match(/(\d{1,2}[:.]\d{2})/);
                                            if (m) timeValue = m[1].replace('.', ':');
                                        }

                                        return (
                                            <TableRow
                                                key={idx}
                                                className={isFinished ? "bg-emerald-500/5 hover:bg-emerald-500/10" : ""}
                                            >
                                                <TableCell className="font-bold text-center">
                                                    {isFinished && idx < 3 ? (
                                                        <span
                                                            className={`inline-flex items-center justify-center size-6 rounded-full text-xs font-bold text-white ${
                                                                idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-400" : "bg-amber-700"
                                                            }`}
                                                        >
                                                            {idx + 1}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">{idx + 1}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className={`text-sm ${isFinished ? "font-semibold text-foreground" : "font-normal text-foreground/80"}`}>
                                                    {row['NAME'] || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={isFinished ? "secondary" : "outline"}
                                                        className={cn(
                                                            "text-xs px-2 py-0.5 font-medium",
                                                            isFinished && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
                                                            row['STATE'] === 'In progress' && "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent"
                                                        )}
                                                    >
                                                        {row['STATE'] || '-'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs font-medium text-foreground">
                                                    {timeValue}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
