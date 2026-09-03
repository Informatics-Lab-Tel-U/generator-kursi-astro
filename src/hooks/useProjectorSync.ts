import { useEffect, useRef } from "react";
import type { ProjectorConfig, TimerState } from "../components/types";
import type { Student } from "../components/types";
import type { Racer, SeatData } from "../components/types";

interface ProjectorState {
    seats: SeatData[];
    disabledSeats: number[];
    timer: TimerState;
    notes: string;
    racers: Racer[];
    projectorConfig: ProjectorConfig;
    kelas: string;
    eligibleStudents: Student[];
}

/**
 * Mengelola sinkronisasi state ke window Proyektor via BroadcastChannel.
 * Channel dibuat sekali saat mount dan ditutup saat unmount.
 */
export function useProjectorSync(state: ProjectorState) {
    const channelRef = useRef<BroadcastChannel | null>(null);
    // Ref untuk membaca state terbaru di dalam listener (menghindari stale closure)
    const stateRef = useRef(state);
    useEffect(() => { stateRef.current = state; });

    // Buat channel sekali saat mount, respond ke REQUEST_SYNC dari projector
    useEffect(() => {
        const channel = new BroadcastChannel("kursi-gen-sync");
        channelRef.current = channel;

        channel.onmessage = (event) => {
            if (event.data?.type === "REQUEST_SYNC") {
                channel.postMessage(stateRef.current);
            }
        };

        return () => {
            channel.close();
            channelRef.current = null;
        };
    }, []);

    // Kirim update ke projector setiap kali state berubah
    useEffect(() => {
        channelRef.current?.postMessage(state);
    }, [state]);
}
