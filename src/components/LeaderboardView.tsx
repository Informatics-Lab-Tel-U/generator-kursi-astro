import React, { useEffect, useState, useMemo } from 'react';
import type { Student } from './types';
import { LuSettings, LuFileText, LuBan } from 'react-icons/lu';

interface LeaderboardViewProps {
    room: string;
    students: Student[];
}

function parseTimeTaken(timeStr: string): number {
    if (!timeStr || timeStr === '-' || timeStr === 'Not yet graded') return Infinity;

    let totalMinutes = 0;
    const hoursMatch = timeStr.match(/(\d+)\s*hour/i) || timeStr.match(/(\d+)\s*jam/i);
    if (hoursMatch) {
        totalMinutes += parseInt(hoursMatch[1]) * 60;
    }
    const minsMatch = timeStr.match(/(\d+)\s*mins/i) || timeStr.match(/(\d+)\s*menit/i);
    if (minsMatch) {
        totalMinutes += parseInt(minsMatch[1]);
    }
    const secsMatch = timeStr.match(/(\d+)\s*sec/i) || timeStr.match(/(\d+)\s*detik/i);
    if (secsMatch) {
        totalMinutes += parseInt(secsMatch[1]) / 60;
    }
    return totalMinutes === 0 ? Infinity : totalMinutes;
}

export default function LeaderboardView({ room, students }: LeaderboardViewProps) {
    const [realtimeData, setRealtimeData] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [lastUpdateDate, setLastUpdateDate] = useState<Date | null>(null);
    const [isDataStale, setIsDataStale] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [sortMode, setSortMode] = useState<'finished' | 'in-progress'>('finished');

    useEffect(() => {
        if (!room) return;

        setRealtimeData([]);
        setLastUpdated(null);
        setIsConnected(false);

        let consecutiveErrors = 0;
        const MAX_ERRORS = 3; // Berhenti polling setelah 3x gagal berturut-turut
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const fetchData = async () => {
            // Jangan fetch saat tab tidak aktif — hemat resource & cegah request menumpuk
            if (document.visibilityState === "hidden") return;

            try {
                const response = await fetch(`/api/leaderboard?room=${encodeURIComponent(room)}`);
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
        intervalId = setInterval(fetchData, 3000);

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [room]);


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
        return [...realtimeData].sort((a, b) => {
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

    const hasData = realtimeData.length > 0;
    const totalStudents = realtimeData.length;
    const completedStudentsCount = realtimeData.filter(row => row['STATE'] === 'Finished').length;
    const notCompletedStudentsCount = totalStudents - completedStudentsCount;

    return (
        <div className="leaderboard-natural" style={{
            backgroundColor: 'var(--glass-bg)', 
            backdropFilter: 'blur(var(--glass-blur))',
            WebkitBackdropFilter: 'blur(var(--glass-blur))',
            width: '100%',
            borderRadius: 'var(--radius-lg)', 
            display: 'flex', flexDirection: 'column',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--text-primary)',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.03)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                        Leaderboard - {room || 'No Room'}
                        {isDataStale && <LuBan style={{ color: 'var(--danger)' }} title="Data is stale (no updates for >60s)" />}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-body)', fontWeight: 600 }}>
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: isConnected ? 'var(--success)' : 'var(--danger)',
                            boxShadow: isConnected ? '0 0 6px var(--success)' : 'none'
                        }} />
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => setSortMode(prev => prev === 'finished' ? 'in-progress' : 'finished')}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <LuSettings /> {sortMode === 'in-progress' ? 'Urutkan: In Progress' : 'Urutkan: Normal'}
                    </button>
                </div>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, maxHeight: '600px' }}>
                {!hasData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
                        <LuFileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Menunggu Data dari Moodle...</h3>
                        <p style={{ fontSize: '13px', maxWidth: '400px', textAlign: 'center', margin: 0 }}>
                            Pastikan script dijalankan di console Moodle. Data akan otomatis muncul di sini.
                        </p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ background: 'var(--bg-body)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Total Peserta</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{totalStudents}</div>
                            </div>
                            <div style={{ background: 'var(--success-surface)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: 'var(--success)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Selesai</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px', color: 'var(--success)' }}>{completedStudentsCount}</div>
                            </div>
                            <div style={{ background: 'var(--warning-surface)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: 'var(--warning)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Sedang Mengerjakan</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px', color: 'var(--warning)' }}>{notCompletedStudentsCount}</div>
                            </div>
                        </div>

                        <div style={{ borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-header)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', width: '60px', textAlign: 'center' }}>Rank</th>
                                        <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Nama Peserta</th>
                                        <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', width: '150px' }}>Status</th>
                                        <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', width: '120px', textAlign: 'right' }}>Waktu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedData.map((row, idx) => {
                                        const isFinished = row['STATE'] === 'Finished';
                                        
                                        let stateBadgeColor = 'var(--text-muted)';
                                        let stateBadgeBg = 'var(--bg-hover)';
                                        if (isFinished) {
                                            stateBadgeColor = 'var(--success)';
                                            stateBadgeBg = 'var(--success-surface)';
                                        } else if (row['STATE'] === 'In progress') {
                                            stateBadgeColor = 'var(--warning)';
                                            stateBadgeBg = 'var(--warning-surface)';
                                        }

                                        let timeValue = row['TIME TAKEN'] || '-';
                                        if (typeof timeValue === 'string') {
                                            const m = timeValue.match(/(\d{1,2}[:.]\d{2})/);
                                            if (m) timeValue = m[1].replace('.', ':');
                                        }

                                        return (
                                            <tr key={idx} style={{ 
                                                borderBottom: idx === sortedData.length - 1 ? 'none' : '1px solid var(--border-light)',
                                                background: isFinished ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                                                transition: 'background 0.2s'
                                            }}>
                                                <td style={{ padding: '16px', fontWeight: 'bold', color: 'var(--text-muted)', textAlign: 'center' }}>
                                                    {isFinished && idx < 3 ? (
                                                        <span style={{ 
                                                            display: 'inline-block', width: '24px', height: '24px', lineHeight: '24px',
                                                            borderRadius: '50%', background: idx === 0 ? '#FBBF24' : idx === 1 ? '#9CA3AF' : '#D97706',
                                                            color: 'white', fontSize: '12px'
                                                        }}>
                                                            {idx + 1}
                                                        </span>
                                                    ) : (
                                                        idx + 1
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px', fontWeight: isFinished ? 700 : 500, color: 'var(--text-primary)' }}>
                                                    {row['NAME'] || '-'}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{ 
                                                        display: 'inline-block', padding: '4px 10px', borderRadius: '12px',
                                                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em',
                                                        color: stateBadgeColor, backgroundColor: stateBadgeBg
                                                    }}>
                                                        {row['STATE'] || '-'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, fontFamily: '"Google Sans", monospace', fontSize: '13px', color: isFinished ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                    {timeValue}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
