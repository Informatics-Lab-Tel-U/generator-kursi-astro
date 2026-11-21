import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SeatData, Student } from "../components/types";

export const CASLAB_MATKUL_VALUE = "__CASLAB__";

type Option = { value: string; label: string };
type ApiEnvelope = {
    ok?: boolean;
    data?: unknown;
};
type StudentRecord = {
    id?: string | number;
    nama?: string;
    kelas?: string;
    kode_asprak?: string;
};

export interface CaslabCandidateRecord {
    id: string;
    nim: string;
    nama_lengkap: string;
    kode: string;
    codeRule?: string;
    codeSource?: string;
    disabled?: boolean;
}

export interface CaslabRoomConfig {
    id: string;
    name: string;
    capacity: number;
    disabledSeats: number[];
}

export interface CaslabSeatRecord {
    seatNumber: number;
    isDisabled: boolean;
    isSpacedEmpty: boolean;
    candidate: CaslabCandidateRecord | null;
}

export interface CaslabRoomAllocation {
    room: CaslabRoomConfig;
    seats: CaslabSeatRecord[];
    assignedCandidates: CaslabCandidateRecord[];
}

export interface CaslabPlottingState {
    candidates?: CaslabCandidateRecord[];
    numRooms?: 1 | 2;
    seatingMode?: "spaced" | "dense";
    rooms?: CaslabRoomConfig[];
    allocations?: CaslabRoomAllocation[];
    historyVersion?: number;
}

const EMPTY_OPTIONS: Option[] = [];
const EMPTY_STUDENTS: Student[] = [];

export function useStudentData(matkul: string, kelas: string) {
    const queryClient = useQueryClient();
    const isCaslab = matkul === CASLAB_MATKUL_VALUE;

    const {
        data: caslabState = null,
        isLoading: isCaslabLoading,
        refetch: refetchCaslab,
    } = useQuery<CaslabPlottingState | null>({
        queryKey: ["caslabState"],
        queryFn: async () => {
            try {
                const res = await fetch("/api/caslab", { cache: "no-store" });
                const data = (await res.json()) as ApiEnvelope;
                if (data && data.ok && data.data && typeof data.data === "object") {
                    return data.data as CaslabPlottingState;
                }
            } catch (_) {}
            return null;
        },
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchInterval: false,
    });

    useEffect(() => {
        if (isCaslab) {
            void refetchCaslab();
        }
    }, [isCaslab, kelas, refetchCaslab]);

    const { data: praktikanMatkulOptions = EMPTY_OPTIONS, isLoading: isOptionsLoading } = useQuery({
        queryKey: ["matkulOptions"],
        queryFn: async () => {
            const res = await fetch("/api/praktikan/mata-kuliah");
            const data = (await res.json()) as ApiEnvelope;
            if (data && data.ok && Array.isArray(data.data)) {
                return data.data.map((m: unknown) => ({ value: String(m), label: String(m) }));
            }
            return EMPTY_OPTIONS;
        },
        staleTime: 1000 * 60 * 5,
    });

    const caslabAllocations = useMemo(
        () => (Array.isArray(caslabState?.allocations) ? caslabState.allocations : []),
        [caslabState]
    );

    const matkulOptions = useMemo(() => {
        if (caslabAllocations.length === 0) return praktikanMatkulOptions;
        return [
            ...praktikanMatkulOptions,
            { value: CASLAB_MATKUL_VALUE, label: "Caslab (Calon Aslab)" },
        ];
    }, [praktikanMatkulOptions, caslabAllocations.length]);

    const { data: praktikanKelasOptions = EMPTY_OPTIONS, isLoading: isPraktikanKelasLoading } = useQuery({
        queryKey: ["kelasOptions", matkul],
        queryFn: async () => {
            if (!matkul || isCaslab) return EMPTY_OPTIONS;
            const res = await fetch(
                `/api/praktikan/kelas?mata_kuliah=${encodeURIComponent(matkul)}`
            );
            const data = (await res.json()) as ApiEnvelope;
            if (data && data.ok && Array.isArray(data.data)) {
                return data.data.map((k: unknown) => ({ value: String(k), label: String(k) }));
            }
            return EMPTY_OPTIONS;
        },
        enabled: !!matkul && !isCaslab,
        staleTime: 1000 * 60 * 5,
    });

    const kelasOptions = useMemo(() => {
        if (!isCaslab) return praktikanKelasOptions;
        return caslabAllocations.map((alloc) => ({
            value: alloc.room.id,
            label: alloc.room.name,
        }));
    }, [isCaslab, praktikanKelasOptions, caslabAllocations]);

    const caslabAllocation = useMemo(() => {
        if (!isCaslab || !kelas) return null;
        return caslabAllocations.find((alloc) => alloc.room.id === kelas) ?? null;
    }, [isCaslab, kelas, caslabAllocations]);

    const { data: praktikanStudents = EMPTY_STUDENTS, isLoading: isPraktikanLoading } = useQuery({
        queryKey: ["students", matkul, kelas],
        queryFn: async () => {
            if (!matkul || !kelas || isCaslab) return EMPTY_STUDENTS;
            const url = `/api/praktikan?mata_kuliah=${encodeURIComponent(matkul)}&kelas=${encodeURIComponent(kelas)}`;
            const res = await fetch(url);
            const data = (await res.json()) as ApiEnvelope | unknown;
            const payload = data && typeof data === "object" && "data" in data ? (data as { data?: unknown }).data : data;
            if (Array.isArray(payload)) {
                return payload.map((s: unknown, idx: number) => {
                    const student = s as StudentRecord;
                    return {
                        id: student.id ? String(student.id) : `stu-${kelas}-${student.nama || "unk"}-${idx}`,
                        name: student.nama || "Unknown",
                        kelas: student.kelas || kelas,
                        asprak: student.kode_asprak || "N/A",
                    };
                });
            }
            return EMPTY_STUDENTS;
        },
        enabled: !!matkul && !!kelas && !isCaslab,
        staleTime: 1000 * 60 * 5,
    });

    const caslabStudents = useMemo<Student[]>(() => {
        if (!isCaslab || !caslabAllocation) return EMPTY_STUDENTS;
        const fromSeats = caslabAllocation.seats
            .filter((s) => s.candidate !== null && !s.candidate.disabled)
            .map((s) => s.candidate!);
        const list =
            fromSeats.length > 0
                ? fromSeats
                : (caslabAllocation.assignedCandidates || []).filter((c) => !c.disabled);
        return list.map((c) => ({
            id: c.id,
            name: c.nama_lengkap,
            kelas: caslabAllocation.room.name,
            asprak: c.kode || "N/A",
        }));
    }, [isCaslab, caslabAllocation]);

    const saveCaslabRoomSeats = useCallback(
        async (roomId: string, nextSeats: SeatData[], nextDisabled: Set<number>) => {
            if (!caslabState || !Array.isArray(caslabState.allocations)) return;
            const candidateById = new Map<string, CaslabCandidateRecord>();
            for (const c of caslabState.candidates || []) {
                candidateById.set(c.id, c);
            }
            for (const alloc of caslabState.allocations) {
                for (const s of alloc.seats) {
                    if (s.candidate) candidateById.set(s.candidate.id, s.candidate);
                }
            }

            const disabledArray = Array.from(nextDisabled).sort((a, b) => a - b);

            const nextAllocations = caslabState.allocations.map((alloc) => {
                if (alloc.room.id !== roomId) return alloc;
                const updatedSeats: CaslabSeatRecord[] = nextSeats.map((seat) => {
                    const isDisabled = nextDisabled.has(seat.seatNo);
                    const cand = seat.student ? candidateById.get(seat.student.id) ?? null : null;
                    return {
                        seatNumber: seat.seatNo,
                        isDisabled,
                        isSpacedEmpty: false,
                        candidate: isDisabled ? null : cand,
                    };
                });
                const assignedCandidates = updatedSeats
                    .map((s) => s.candidate)
                    .filter((c): c is CaslabCandidateRecord => c !== null);
                return {
                    ...alloc,
                    room: {
                        ...alloc.room,
                        disabledSeats: disabledArray,
                    },
                    seats: updatedSeats,
                    assignedCandidates,
                };
            });

            const nextRooms = (caslabState.rooms || []).map((r) =>
                r.id === roomId ? { ...r, disabledSeats: disabledArray } : r
            );

            const updatedState: CaslabPlottingState = {
                ...caslabState,
                rooms: nextRooms.length > 0 ? nextRooms : caslabState.rooms,
                allocations: nextAllocations,
            };

            queryClient.setQueryData(["caslabState"], updatedState);

            try {
                await fetch("/api/caslab", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedState),
                });
            } catch (_) {}
        },
        [caslabState, queryClient]
    );

    return {
        matkulOptions,
        kelasOptions,
        eligibleStudents: isCaslab ? caslabStudents : praktikanStudents,
        isLoading: isCaslab ? isCaslabLoading : isPraktikanLoading,
        isOptionsLoading: isOptionsLoading || isCaslabLoading,
        isKelasLoading: isCaslab ? isCaslabLoading : isPraktikanKelasLoading,
        isCaslab,
        caslabAllocation,
        caslabSeatingMode: caslabState?.seatingMode ?? "spaced",
        saveCaslabRoomSeats,
        refetchCaslab,
    };
}
