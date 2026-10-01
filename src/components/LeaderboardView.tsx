import React, { useEffect, useState, useMemo } from 'react';
import type { Student } from './types';
import { LuSettings, LuFileText, LuBan, LuCopy, LuCheck } from 'react-icons/lu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useMoodleScript } from '../hooks/useCountdown';
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
    showBorder?: boolean;
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

    
    const colonParts = timeStr.split(':').map(Number);
    if (colonParts.length === 3 && !colonParts.some(isNaN)) {
        return colonParts[0] * 60 + colonParts[1] + colonParts[2] / 60;
    } else if (colonParts.length === 2 && !colonParts.some(isNaN)) {
        return colonParts[0] + colonParts[1] / 60;
    }

    return Infinity;
}

function getSavedLeaderboard(roomName: string): any[] {
    if (typeof window === "undefined" || !roomName || roomName === "-") return [];
    try {
        const saved = localStorage.getItem(`asprak_leaderboard_${roomName.trim().toUpperCase()}`);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch {}
    return [];
}

function saveLeaderboardToStorage(roomName: string, data: any[]): void {
    if (typeof window === "undefined" || !roomName || roomName === "-") return;
    try {
        localStorage.setItem(`asprak_leaderboard_${roomName.trim().toUpperCase()}`, JSON.stringify(data));
    } catch {}
}

export default function LeaderboardView({ room, students, showBorder = true }: LeaderboardViewProps) {
    const { isCopied, copyScript } = useMoodleScript(room);
    const activeRoom = room || 'default';
    const [realtimeData, setRealtimeData] = useState<any[]>(() => getSavedLeaderboard(activeRoom));
    const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
        const initial = getSavedLeaderboard(activeRoom);
        return initial.length > 0 ? "Tersimpan lokal" : null;
    });
    const [lastUpdateDate, setLastUpdateDate] = useState<Date | null>(() => {
        const initial = getSavedLeaderboard(activeRoom);
        return initial.length > 0 ? new Date() : null;
    });
    const [isDataStale, setIsDataStale] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [sortMode, setSortMode] = useState<'finished' | 'in-progress'>('finished');

    
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            const key = `asprak_leaderboard_${activeRoom.trim().toUpperCase()}`;
            if (e.key === key && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (Array.isArray(parsed)) {
                        setRealtimeData(parsed);
                        const now = new Date();
                        setLastUpdated(now.toLocaleTimeString());
                        setLastUpdateDate(now);
                        setIsDataStale(false);
                    }
                } catch {}
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, [activeRoom]);

    useEffect(() => {
        const cached = getSavedLeaderboard(activeRoom);
        setRealtimeData(cached);
        setLastUpdated(cached.length > 0 ? "Tersimpan lokal" : null);
        setIsConnected(false);

        if (!room || room === "-") return;

        
        const isDev = import.meta.env.DEV;
        if (isDev) {
            console.log("[LeaderboardView] Dev mode: polling HTTP /api/leaderboard...");
            let devTimer: ReturnType<typeof setInterval> | null = null;
            const pollDev = async () => {
                try {
                    const res = await fetch(`/api/leaderboard?room=${encodeURIComponent(activeRoom)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data) && data.length > 0) {
                            setRealtimeData(data);
                            const now = new Date();
                            setLastUpdated(now.toLocaleTimeString());
                            setLastUpdateDate(now);
                            setIsDataStale(false);
                            saveLeaderboardToStorage(activeRoom, data);
                        }
                    }
                } catch {}
            };
            pollDev();
            devTimer = setInterval(pollDev, 4000);
            return () => {
                if (devTimer) clearInterval(devTimer);
            };
        }

        let ws: WebSocket | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let unmounted = false;

        const connect = () => {
            if (unmounted) return;

            const protocol = location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = `${protocol}//${location.host}/api/leaderboard?room=${encodeURIComponent(activeRoom)}`;
            console.log(`[LeaderboardView] 🔌 Connecting WebSocket to: ${wsUrl}`);
            
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log(`[LeaderboardView] ✅ WebSocket connected successfully to room: ${activeRoom}`);
                setIsConnected(true);
                try {
                    ws?.send(JSON.stringify({ type: "GET" }));
                    console.log(`[LeaderboardView] 📤 Sent initial GET request for leaderboard data`);
                } catch (e) {
                    console.error(`[LeaderboardView] ❌ Failed to send initial GET:`, e);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string) as { type: string; data: any[] };
                    if ((msg.type === "INIT" || msg.type === "UPDATE") && Array.isArray(msg.data)) {
                        console.log(`[LeaderboardView] 📥 Received ${msg.type} with ${msg.data.length} entries`);
                        setRealtimeData(msg.data);
                        const now = new Date();
                        setLastUpdated(now.toLocaleTimeString());
                        setLastUpdateDate(now);
                        setIsDataStale(false);
                        saveLeaderboardToStorage(activeRoom, msg.data);
                    }
                } catch (e) {
                    console.error(`[LeaderboardView] ❌ Failed to parse message:`, e);
                }
            };

            ws.onclose = () => {
                console.log(`[LeaderboardView] 🔌 WebSocket disconnected from room: ${activeRoom}`);
                setIsConnected(false);
                if (!unmounted) {
                    console.log(`[LeaderboardView] 🔄 Attempting to reconnect in 3 seconds...`);
                    reconnectTimer = setTimeout(connect, 3000);
                }
            };

            ws.onerror = (error) => {
                console.error(`[LeaderboardView] ❌ WebSocket error:`, error);
                setIsConnected(false);
                ws?.close();
            };
        };

        connect();

        return () => {
            unmounted = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (ws) ws.close();
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
        <div
            className="leaderboard-natural w-full flex flex-col rounded-lg bg-card overflow-hidden h-full max-h-full m-0 p-0"
            style={{
                flex: 1,
                minHeight: 0,
                height: '100%',
                maxHeight: '100%',
                marginLeft: '0',
                marginRight: '0',
                borderRadius: '12px',
                border: showBorder ? '1px solid var(--border)' : 'none',
                boxSizing: 'border-box'
            }}
        >
            <div className="px-2 py-2 border-b border-border flex justify-between items-center bg-muted/20 flex-shrink-0">
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
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortMode(prev => prev === 'finished' ? 'in-progress' : 'finished')}
                        className="gap-1.5"
                    >
                        <LuSettings className="size-3.5" />
                        <span>{sortMode === 'in-progress' ? 'Urutkan: In Progress' : 'Urutkan: Normal'}</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={copyScript}
                        className="gap-1.5"
                        title="Salin script Moodle"
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
            </div>

            {hasData && (
                <div className="px-2 pt-2 pb-2 border-b border-border bg-muted/10 shrink-0">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-muted/30 p-2 rounded-lg border border-border text-center">
                            <div className="text-xs text-muted-foreground font-medium">Total Peserta</div>
                            <div className="text-xl font-bold mt-0.5 text-foreground">{totalStudents}</div>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-lg border border-border text-center">
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Selesai</div>
                            <div className="text-xl font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">{completedStudentsCount}</div>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-lg border border-border text-center">
                            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">Sedang Mengerjakan</div>
                            <div className="text-xl font-bold mt-0.5 text-amber-600 dark:text-amber-400">{notCompletedStudentsCount}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-y-auto flex-1 min-h-0 p-0" style={{ minHeight: 0 }}>
                {!hasData ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                        <LuFileText className="size-12 mb-3 opacity-40" />
                        <h4 className="m-0 mb-1 text-sm font-semibold text-foreground">Menunggu Data dari Moodle...</h4>
                        <p className="text-xs max-w-sm text-center m-0">
                            Pastikan script dijalankan di console Moodle. Data akan otomatis muncul di sini.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden m-0 p-0">
                        <Table className="m-0 border-separate border-spacing-0">
                            <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-xs z-10">
                                <TableRow className="bg-muted/40 hover:bg-muted/40 m-0 p-0">
                                        <TableHead className="w-16 text-center text-xs font-medium text-muted-foreground px-2 py-1.5">Rank</TableHead>
                                        <TableHead className="text-xs font-medium text-muted-foreground px-2 py-1.5">Nama Peserta</TableHead>
                                        <TableHead className="w-36 text-xs font-medium text-muted-foreground px-2 py-1.5">Status</TableHead>
                                        <TableHead className="w-28 text-right text-xs font-medium text-muted-foreground px-2 py-1.5">Waktu</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedData.map((row, idx) => {
                                        const isFinished = row['STATE'] === 'Finished';

                                        let timeValue = row['TIME TAKEN'] || '-';
                                        if (typeof timeValue === 'string') {
                                            const m = timeValue.match(/(\d{1,2}[:.]?\d{2})/);
                                            if (m) timeValue = m[1].replace('.', ':');
                                        }

                                        return (
                                            <TableRow
                                                key={idx}
                                                className={isFinished ? "bg-emerald-500/5 hover:bg-emerald-500/10" : ""}
                                            >
                                                <TableCell className="font-bold text-center px-2 py-1.5">
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
                                                <TableCell className={`text-sm px-2 py-1.5 ${isFinished ? "font-semibold text-foreground" : "font-normal text-foreground/80"}`}>
                                                    {row['NAME'] || '-'}
                                                </TableCell>
                                                <TableCell className="px-2 py-1.5">
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
                                                <TableCell className="text-right font-mono text-xs font-medium text-foreground px-2 py-1.5">
                                                    {timeValue}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                )}
            </div>
        </div>
    );
}
