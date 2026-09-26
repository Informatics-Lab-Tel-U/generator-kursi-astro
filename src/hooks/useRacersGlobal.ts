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
        // Dispatch custom event for same-tab subscribers
        window.dispatchEvent(new CustomEvent(RACERS_EVENT, { detail: racers }));
    } catch (e) {
        console.warn("Failed to save racers to localStorage:", e);
    }
}

/**
 * Hook global untuk mengelola data pembalap (ASPRAK)
 * Tersinkronisasi otomatis dengan localStorage dan event listener global.
 */
export function useRacersGlobal(initialRacers?: Racer[]) {
    const [racers, setRacersState] = useState<Racer[]>(() => {
        if (initialRacers && initialRacers.length > 0) return initialRacers;
        return getStoredRacers();
    });

    const [newRacerName, setNewRacerName] = useState("");

    // Listen to changes from other components / tabs
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
            shuffled.forEach((r, idx) => {
                jitter[r.id] = {
                    currentOffset: 0,
                    targetOffset: Math.random() * 20 - 10,
                    speed: 0.02 + Math.random() * 0.05,
                    finalOffset: idx === 0 ? 0 : -(idx * 3) - Math.random() * 3,
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
