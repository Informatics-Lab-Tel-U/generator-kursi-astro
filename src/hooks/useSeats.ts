import { useState, useEffect, useCallback, useRef } from "react";
import type { SeatData, SeatVersion } from "../components/types";
import type { Student } from "../components/types";
import type { CaslabRoomAllocation } from "./useStudentData";
import { makeEmptySeats, fisherYatesShuffle } from "../components/utils";

interface CaslabSeatsOptions {
    isCaslab: boolean;
    allocation: CaslabRoomAllocation | null;
    seatingMode: "spaced" | "dense";
    onSaveRoomSeats?: (roomId: string, seats: SeatData[], disabledSeats: Set<number>) => void;
    onRefreshCaslab?: () => void;
}

function getCaslabTotalSeats(allocation: CaslabRoomAllocation | null): number {
    if (!allocation) return 50;
    const raw = Math.max(allocation.room.capacity || 0, allocation.seats.length || 0, 10);
    return Math.ceil(raw / 10) * 10;
}

function getRequiredTotalSeats(studentsCount: number, disabledSeats: Set<number>) {
    if (studentsCount === 0) return 50;
    let c = 10;
    while (true) {
        let disabledInC = 0;
        for (let d of disabledSeats) {
            if (d <= c) disabledInC++;
        }
        if (c - disabledInC >= studentsCount) break;
        c += 10;
    }
    return c;
}


export function useSeats(
    eligibleStudents: Student[],
    matkul: string,
    kelas: string,
    isLoading: boolean,
    caslabOptions?: CaslabSeatsOptions
) {
    const isCaslab = Boolean(caslabOptions?.isCaslab);
    const caslabAllocation = caslabOptions?.allocation ?? null;
    const caslabSeatingMode = caslabOptions?.seatingMode ?? "spaced";
    const onSaveRoomSeats = caslabOptions?.onSaveRoomSeats;
    const onRefreshCaslab = caslabOptions?.onRefreshCaslab;

    const [seats, setSeats] = useState<SeatData[]>(makeEmptySeats(50));
    const [disabledSeats, setDisabledSeats] = useState<Set<number>>(new Set([1, 2]));
    const [dragSourceSeat, setDragSourceSeat] = useState<number | null>(null);
    const [dragOverSeat, setDragOverSeat] = useState<number | null>(null);
    const [versions, setVersions] = useState<SeatVersion[]>([]);
    const skipNextShuffleRef = useRef<boolean>(false);

    
    const seatsRef = useRef<SeatData[]>(seats);
    useEffect(() => { seatsRef.current = seats; }, [seats]);

    
    useEffect(() => {
        try {
            const saved = localStorage.getItem("kursi_versions");
            if (saved) {
                const parsed: SeatVersion[] = JSON.parse(saved);
                const now = Date.now();
                // Simpan riwayat hingga 24 jam terakhir (1 hari kerja praktikum)
                const valid = parsed.filter((v) => now - v.timestamp < 24 * 60 * 60 * 1000);
                setVersions(valid);
                if (valid.length !== parsed.length) {
                    localStorage.setItem("kursi_versions", JSON.stringify(valid));
                }
            }
        } catch (_) {}
    }, []);

    
    useEffect(() => {
        if (isCaslab) {
            if (!caslabAllocation) {
                setSeats(makeEmptySeats(50));
                return;
            }
            const totalSeats = getCaslabTotalSeats(caslabAllocation);
            const nextDisabled = new Set<number>(caslabAllocation.room.disabledSeats || []);
            const nextSeats = makeEmptySeats(totalSeats);
            for (const s of caslabAllocation.seats) {
                if (s.isDisabled) nextDisabled.add(s.seatNumber);
                if (s.seatNumber >= 1 && s.seatNumber <= totalSeats && s.candidate && !s.candidate.disabled) {
                    nextSeats[s.seatNumber - 1] = {
                        seatNo: s.seatNumber,
                        student: {
                            id: s.candidate.id,
                            name: s.candidate.nama_lengkap,
                            kelas: caslabAllocation.room.name,
                            asprak: s.candidate.kode || "N/A",
                        },
                    };
                }
            }
            setDisabledSeats(nextDisabled);
            setSeats(nextSeats);
            return;
        }

        if (!matkul || !kelas || eligibleStudents.length === 0) {
            setSeats((prev) => {
                const isAlreadyDefaultEmpty =
                    prev.length === 50 && prev.every((s) => s.student === null);
                return isAlreadyDefaultEmpty ? prev : makeEmptySeats(50);
            });
            return;
        }

        // Jangan timpa kursi jika baru saja dilakukan pemulihan versi
        if (skipNextShuffleRef.current) {
            skipNextShuffleRef.current = false;
            return;
        }

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

        // Catat versi awal pertama kali saat kelas dimuat jika belum ada riwayat untuk kelas ini
        const newVersion: SeatVersion = {
            id: Math.random().toString(36).substring(2, 11),
            timestamp: Date.now(),
            seats: newSeats,
            matkul,
            kelas,
            disabledSeats: Array.from(disabledSeats),
        };
        setVersions((prev) => {
            const hasExisting = prev.some((v) => v.matkul === matkul && v.kelas === kelas);
            if (hasExisting) return prev;
            const next = [newVersion, ...prev].slice(0, 20);
            try {
                localStorage.setItem("kursi_versions", JSON.stringify(next));
            } catch (_) {}
            return next;
        });
    }, [eligibleStudents, matkul, kelas, isCaslab, caslabAllocation]); 

    const handleGenerate = useCallback(() => {
        if (isCaslab) {
            onRefreshCaslab?.();
            return;
        }
        setSeats([]);
        setTimeout(() => {
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

            const newVersion: SeatVersion = {
                id: Math.random().toString(36).substring(2, 11),
                timestamp: Date.now(),
                seats: newSeats,
                matkul,
                kelas,
                disabledSeats: Array.from(disabledSeats),
            };
            setVersions((prev) => {
                const next = [newVersion, ...prev].slice(0, 20);
                try {
                    localStorage.setItem("kursi_versions", JSON.stringify(next));
                } catch (_) {}
                return next;
            });
        }, 500);
    }, [eligibleStudents, disabledSeats, matkul, kelas, isCaslab, onRefreshCaslab]);

    const restoreVersion = useCallback((version: SeatVersion) => {
        skipNextShuffleRef.current = true;
        setSeats(version.seats);
        if (version.disabledSeats && Array.isArray(version.disabledSeats)) {
            setDisabledSeats(new Set(version.disabledSeats));
        }
    }, []);

    const clearVersions = useCallback(() => {
        setVersions([]);
        try {
            localStorage.removeItem("kursi_versions");
        } catch (_) {}
    }, []);

    const handleReset = useCallback(() => {
        if (isCaslab) {
            onRefreshCaslab?.();
            return;
        }
        setSeats(makeEmptySeats(getRequiredTotalSeats(eligibleStudents.length, disabledSeats)));
    }, [isCaslab, onRefreshCaslab, eligibleStudents.length, disabledSeats]);

    const toggleDisabledSeat = useCallback((seatNo: number) => {
        if (isCaslab) return;
        const nextDisabled = new Set(disabledSeats);
        const willBeDisabled = !nextDisabled.has(seatNo);
        willBeDisabled ? nextDisabled.add(seatNo) : nextDisabled.delete(seatNo);
        setDisabledSeats(nextDisabled);
    }, [disabledSeats, isCaslab]);

    
    useEffect(() => {
        if (isCaslab) return;
        const needsRegeneration = seatsRef.current.some(
            (seat) => disabledSeats.has(seat.seatNo) && seat.student !== null
        );
        if (needsRegeneration && eligibleStudents.length > 0 && !isLoading) {
            handleGenerate();
        }
        
        
    }, [disabledSeats, eligibleStudents.length, isLoading, handleGenerate, isCaslab]);

    
    const handleDragStart = useCallback((seatNo: number) => {
        if (isCaslab) return;
        setDragSourceSeat(seatNo);
    }, [isCaslab]);
    const handleDragOver = useCallback((e: React.DragEvent, seatNo: number) => {
        if (isCaslab) return;
        e.preventDefault();
        setDragOverSeat(seatNo);
    }, [isCaslab]);
    const handleDragLeave = useCallback(() => setDragOverSeat(null), []);
    const handleDrop = useCallback(
        (targetSeatNo: number) => {
            if (isCaslab || dragSourceSeat === null || dragSourceSeat === targetSeatNo) {
                setDragSourceSeat(null);
                setDragOverSeat(null);
                return;
            }
            const next = [...seatsRef.current];
            const srcIdx = dragSourceSeat - 1;
            const tgtIdx = targetSeatNo - 1;
            if (next[srcIdx] && next[tgtIdx]) {
                const temp = next[srcIdx].student;
                next[srcIdx] = { ...next[srcIdx], student: next[tgtIdx].student };
                next[tgtIdx] = { ...next[tgtIdx], student: temp };
                setSeats(next);
            }
            setDragSourceSeat(null);
            setDragOverSeat(null);
        },
        [dragSourceSeat, isCaslab]
    );
    const handleDragEnd = useCallback(() => {
        setDragSourceSeat(null);
        setDragOverSeat(null);
    }, []);

    
    const currentTotalSeats = isCaslab && caslabAllocation
        ? getCaslabTotalSeats(caslabAllocation)
        : getRequiredTotalSeats(eligibleStudents.length, disabledSeats);
    let disabledInC = 0;
    for (let d of disabledSeats) if (d <= currentTotalSeats) disabledInC++;
    const activeSeatCount = currentTotalSeats - disabledInC;
    const assignedCount = seats.filter((s) => s.student !== null).length;

    const displaySeats = makeEmptySeats(currentTotalSeats).map((emptySeat, i) => seats[i] || emptySeat);
    const columns: SeatData[][] = [];
    for (let c = 0; c < currentTotalSeats / 10; c++) {
        columns.push(displaySeats.slice(c * 10, (c + 1) * 10));
    }

    return {
        seats,
        disabledSeats,
        dragSourceSeat,
        dragOverSeat,
        versions,
        columns,
        assignedCount,
        activeSeatCount,
        currentTotalSeats,
        handleGenerate,
        handleReset,
        restoreVersion,
        clearVersions,
        toggleDisabledSeat,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleDragEnd,
    };
}
