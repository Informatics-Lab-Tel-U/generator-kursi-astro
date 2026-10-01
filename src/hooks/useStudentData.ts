import { useQuery } from "@tanstack/react-query";

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

const EMPTY_OPTIONS: Option[] = [];
const EMPTY_STUDENTS: any[] = [];

export function useStudentData(matkul: string, kelas: string) {
    const { data: matkulOptions = EMPTY_OPTIONS, isLoading: isOptionsLoading } = useQuery({
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

    const { data: kelasOptions = EMPTY_OPTIONS, isLoading: isKelasLoading } = useQuery({
        queryKey: ["kelasOptions", matkul],
        queryFn: async () => {
            if (!matkul) return EMPTY_OPTIONS;
            const res = await fetch(
                `/api/praktikan/kelas?mata_kuliah=${encodeURIComponent(matkul)}`
            );
            const data = (await res.json()) as ApiEnvelope;
            if (data && data.ok && Array.isArray(data.data)) {
                return data.data.map((k: unknown) => ({ value: String(k), label: String(k) }));
            }
            return EMPTY_OPTIONS;
        },
        enabled: !!matkul,
        staleTime: 1000 * 60 * 5,
    });

    const { data: eligibleStudents = EMPTY_STUDENTS, isLoading } = useQuery({
        queryKey: ["students", matkul, kelas],
        queryFn: async () => {
            if (!matkul || !kelas) return EMPTY_STUDENTS;
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
        enabled: !!matkul && !!kelas,
        staleTime: 1000 * 60 * 5,
    });

    return {
        matkulOptions,
        kelasOptions,
        eligibleStudents,
        isLoading,
        isOptionsLoading,
        isKelasLoading,
    };
}
