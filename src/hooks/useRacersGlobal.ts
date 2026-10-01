import { useState, useEffect, useCallback } from "react";
import type { Racer, TimerState } from "../components/types";

const RACERS_STORAGE_KEY = "asprak_racers";
const RACERS_EVENT = "asprak_racers_updated";

export const DEFAULT_RACERS: Racer[] = [];

export function getStoredRacers(): Racer[] {
    if (typeof window === "undefined") return DEFAULT_RACERS;
    try {
        const item = localStorage.getItem(RACERS_STORAGE_KEY);
        if (item) {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Failed to read racers from localStorage:", e);
    }
    return DEFAULT_RACERS;
}

export function saveStoredRacers(racers: Racer[]) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(RACERS_STORAGE_KEY, JSON.stringify(racers));
        
        window.dispatchEvent(new CustomEvent(RACERS_EVENT, { detail: racers }));
    } catch (e) {
        console.warn("Failed to save racers to localStorage:", e);
    }
}


export function useRacersGlobal(initialRacers?: Racer[]) {
    const [racers, setRacersState] = useState<Racer[]>(() => {
        if (initialRacers && initialRacers.length > 0) return initialRacers;
        return getStoredRacers();
    });

    const [newRacerName, setNewRacerName] = useState("");

    
    useEffect(() => {
        const handleCustomEvent = (e: Event) => {
            const customEvent = e as CustomEvent<Racer[]>;
            if (customEvent.detail) {
                setRacersState(customEvent.detail);
            }
        };

        const handleStorageEvent = (e: StorageEvent) => {
            if (e.key === RACERS_STORAGE_KEY && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (Array.isArray(parsed)) {
                        setRacersState(parsed);
                    }
                } catch {}
            }
        };

        window.addEventListener(RACERS_EVENT, handleCustomEvent);
        window.addEventListener("storage", handleStorageEvent);

        return () => {
            window.removeEventListener(RACERS_EVENT, handleCustomEvent);
            window.removeEventListener("storage", handleStorageEvent);
        };
    }, []);

    const setRacers = useCallback((updater: React.SetStateAction<Racer[]>) => {
        setRacersState((prev) => {
            const next = typeof updater === "function" ? (updater as (prev: Racer[]) => Racer[])(prev) : updater;
            saveStoredRacers(next);
            return next;
        });
    }, []);

    const addRacer = useCallback((nameToAdd?: string) => {
        const name = (nameToAdd || newRacerName).trim();
        if (!name) return;

        setRacers((prev) => [
            ...prev,
            { id: Date.now().toString(), name, imageBase64: null },
        ]);
        setNewRacerName("");
    }, [newRacerName, setRacers]);

    const removeRacer = useCallback((id: string) => {
        setRacers((prev) => prev.filter((r) => r.id !== id));
    }, [setRacers]);

    const handleRacerImageUpload = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setRacers((prev) =>
                prev.map((r) => (r.id === id ? { ...r, imageBase64: dataUrl } : r))
            );
        };
        reader.readAsDataURL(file);
    }, [setRacers]);

    const startRace = useCallback(
        (setTimer?: React.Dispatch<React.SetStateAction<TimerState>>) => {
            const shuffled = [...racers].sort(() => Math.random() - 0.5);
            const jitter: Record<string, any> = {};
            const n = Math.max(1, racers.length);

            shuffled.forEach((r, rankIdx) => {
                const normalizedRank = n > 1 ? rankIdx / (n - 1) : 0.5;
                const baseRatio = 0.52 - (normalizedRank * 0.18) + ((Math.random() - 0.5) * 0.04);

                jitter[r.id] = {
                    currentOffset: 0,
                    targetOffset: Math.random() * 16 - 8,
                    speed: 0.03 + Math.random() * 0.04,
                    finalOffset: rankIdx === 0 ? 0 : -(rankIdx * 3) - Math.random() * 2,
                    finalRank: rankIdx,
                    baseOffsetRatio: Math.max(0.30, Math.min(0.58, baseRatio)),
                    waveFreq1: 0.18 + Math.random() * 0.14,
                    wavePhase1: (rankIdx * 1.7 + Math.random() * 1.5) % (Math.PI * 2),
                    waveAmp1: 35 + Math.random() * 25,
                    waveFreq2: 0.45 + Math.random() * 0.35,
                    wavePhase2: (rankIdx * 2.3 + Math.random() * 2.0) % (Math.PI * 2),
                    waveAmp2: 12 + Math.random() * 12,
                };
            });
            return {
                jitter,
                startTimer: () =>
                    setTimer?.((p) => ({ ...p, isRunning: true, startedAt: Date.now() })),
            };
        },
        [racers]
    );

    return {
        racers,
        setRacers,
        newRacerName,
        setNewRacerName,
        addRacer,
        removeRacer,
        handleRacerImageUpload,
        startRace,
    };
}
