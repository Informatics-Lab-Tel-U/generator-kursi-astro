import { useQuery } from "@tanstack/react-query";

const EMPTY_OPTIONS: { value: string; label: string }[] = [];
const EMPTY_STUDENTS: any[] = [];

/**
 * Hook untuk mengambil opsi mata kuliah, kelas, dan daftar mahasiswa
 * yang eligible via Astro server proxy.
 */
export function useStudentData(matkul: string, kelas: string) {
    const { data: matkulOptions = EMPTY_OPTIONS, isLoading: isOptionsLoading } = useQuery({
        queryKey: ["matkulOptions"],
        queryFn: async () => {
            const res = await fetch("/api/praktikan/mata-kuliah");
            const data = await res.json();
            if (data && data.ok && Array.isArray(data.data)) {
                return data.data.map((m: string) => ({ value: m, label: m }));
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
            const data = await res.json();
            if (data && data.ok && Array.isArray(data.data)) {
                return data.data.map((k: string) => ({ value: k, label: k }));
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
            const data = await res.json();
            const payload = data.data || data;
            if (Array.isArray(payload)) {
                return payload.map((s: any, idx: number) => ({
                    id: s.id ? String(s.id) : `stu-${kelas}-${s.nama || "unk"}-${idx}`,
                    name: s.nama || "Unknown",
                    kelas: s.kelas || kelas,
                    asprak: s.kode_asprak || "N/A",
                }));
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
