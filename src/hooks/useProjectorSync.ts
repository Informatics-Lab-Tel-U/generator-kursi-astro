import { useEffect, useRef } from "react";
import type { ProjectorConfig, TimerState, ScheduleState, Student, Racer, SeatData } from "../components/types";
import { PROJECTOR_CHANNEL_NAME } from "../components/scheduleConfig";

interface ProjectorState {
    seats: SeatData[];
    disabledSeats: Set<number> | number[];
    timer: TimerState;
    notes: string;
    racers: Racer[];
    projectorConfig: ProjectorConfig;
    kelas: string;
    eligibleStudents: Student[];
    activeBlockLabel?: string;
    activeBlockColor?: string;
    schedule?: ScheduleState;
}


export function useProjectorSync(state: ProjectorState) {
    const channelRef = useRef<BroadcastChannel | null>(null);
    
    const stateRef = useRef(state);
    useEffect(() => { stateRef.current = state; });

    
    useEffect(() => {
        const channel = new BroadcastChannel(PROJECTOR_CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = (event) => {
            if (event.data?.type === "REQUEST_SYNC") {
                channel.postMessage({
                    ...stateRef.current,
                    disabledSeats: Array.from(stateRef.current.disabledSeats),
                });
            }
        };

        return () => {
            channel.close();
            channelRef.current = null;
        };
    }, []);

    
    useEffect(() => {
        channelRef.current?.postMessage({
            ...state,
            disabledSeats: Array.from(state.disabledSeats),
        });
    }, [
        state.seats,
        state.disabledSeats,
        state.timer,
        state.notes,
        state.racers,
        state.projectorConfig,
        state.kelas,
        state.eligibleStudents,
        state.activeBlockLabel,
        state.activeBlockColor,
        state.schedule,
    ]);
}
