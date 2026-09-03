import { useState, useEffect, useCallback, useRef } from "react";
import type { SeatData, SeatVersion } from "../components/types";
import type { Student } from "../components/types";
import { makeEmptySeats, fisherYatesShuffle } from "../components/utils";

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

/**
 * Mengelola state kursi: generasi acak, drag-drop, disabled seats, dan riwayat versi.
 */
export function useSeats(
    eligibleStudents: Student[],
    matkul: string,
    kelas: string,
    isLoading: boolean
) {
    const [seats, setSeats] = useState<SeatData[]>(makeEmptySeats(50));
    const [disabledSeats, setDisabledSeats] = useState<Set<number>>(new Set([1, 2]));
    const [dragSourceSeat, setDragSourceSeat] = useState<number | null>(null);
    const [dragOverSeat, setDragOverSeat] = useState<number | null>(null);
    const [versions, setVersions] = useState<SeatVersion[]>([]);

    // Ref untuk membaca seats terkini tanpa menyebabkan re-render loop
    const seatsRef = useRef<SeatData[]>(seats);
    useEffect(() => { seatsRef.current = seats; }, [seats]);

    // Muat riwayat versi dari localStorage saat mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("kursi_versions");
            if (saved) {
                const parsed: SeatVersion[] = JSON.parse(saved);
                const now = Date.now();
                const valid = parsed.filter((v) => now - v.timestamp < 2 * 60 * 60 * 1000);
                setVersions(valid);
                if (valid.length !== parsed.length) {
                    localStorage.setItem("kursi_versions", JSON.stringify(valid));
                }
            }
        } catch (_) {}
    }, []);

    // Auto-generate saat data mahasiswa berubah
    useEffect(() => {
        if (!matkul || !kelas || eligibleStudents.length === 0) {
            setSeats(makeEmptySeats(50));
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
    }, [eligibleStudents, matkul, kelas]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleGenerate = useCallback(() => {
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
            };
            setVersions((prev) => {
                const next = [newVersion, ...prev].slice(0, 20);
                localStorage.setItem("kursi_versions", JSON.stringify(next));
                return next;
            });
        }, 500);
    }, [eligibleStudents, disabledSeats, matkul, kelas]);

    const restoreVersion = useCallback((version: SeatVersion) => {
        setSeats(version.seats);
    }, []);

    const handleReset = useCallback(
        () => setSeats(makeEmptySeats(getRequiredTotalSeats(eligibleStudents.length, disabledSeats))),
        [eligibleStudents.length, disabledSeats]
    );

    const toggleDisabledSeat = useCallback((seatNo: number) => {
        setDisabledSeats((prev) => {
            const next = new Set(prev);
            next.has(seatNo) ? next.delete(seatNo) : next.add(seatNo);
            return next;
        });
    }, []);

    // Regenerasi jika disabled seat yang terisi diubah
    useEffect(() => {
        const needsRegeneration = seatsRef.current.some(
            (seat) => disabledSeats.has(seat.seatNo) && seat.student !== null
        );
        if (needsRegeneration && eligibleStudents.length > 0 && !isLoading) {
            handleGenerate();
        }
        // seats sengaja tidak di deps — dibaca via ref untuk cegah loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [disabledSeats, eligibleStudents.length, isLoading, handleGenerate]);

    // Drag-and-drop handlers
    const handleDragStart = useCallback((seatNo: number) => setDragSourceSeat(seatNo), []);
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
                next[srcIdx] = { ...next[srcIdx], student: next[tgtIdx].student };
                next[tgtIdx] = { ...next[tgtIdx], student: temp };
                return next;
            });
            setDragSourceSeat(null);
            setDragOverSeat(null);
        },
        [dragSourceSeat]
    );
    const handleDragEnd = useCallback(() => {
        setDragSourceSeat(null);
        setDragOverSeat(null);
    }, []);

    // Kalkulasi derived values untuk tampilan
    const currentTotalSeats = getRequiredTotalSeats(eligibleStudents.length, disabledSeats);
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
        toggleDisabledSeat,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleDragEnd,
    };
}
