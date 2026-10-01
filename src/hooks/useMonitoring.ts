import { useState, useEffect, useRef } from "react";
import { detectCurrentLabRoom } from "../lib/fontDetector";


export function useMonitoring(matkul: string, kelas: string) {
    const [labId, setLabId] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);

    
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const urlLabId = searchParams.get("labId") || searchParams.get("lab");
        const localLabId = localStorage.getItem("manual_lab_id");

        if (urlLabId) {
            console.log(`[Monitoring] Lab ID via URL param: ${urlLabId}`);
            setLabId(urlLabId);
        } else if (localLabId) {
            console.log(`[Monitoring] Lab ID via localStorage: ${localLabId}`);
            setLabId(localLabId);
        } else {
            detectCurrentLabRoom()
                .then((room) => {
                    if (room) {
                        console.log(`[Monitoring] Terdeteksi sebagai PC Lab: ${room}`);
                        setLabId(room);
                    } else {
                        console.log("[Monitoring] Bukan PC Lab (Identitas Font tidak ditemukan).");
                    }
                })
                .catch(console.error);
        }
    }, []);

    
    useEffect(() => {
        if (typeof window !== "undefined") {
            workerRef.current = new Worker(
                new URL("../workers/heartbeat.worker.ts", import.meta.url),
                { type: "module" }
            );
        }
        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    
    useEffect(() => {
        if (!labId || !workerRef.current) return;

        
        const isDev = import.meta.env.DEV;
        if (isDev) {
            console.warn("[Monitoring] Heartbeat disabled in dev mode. Backend must be running on port 8787.");
            
        }

        
        
        const kelasLabel = matkul && kelas
            ? `${matkul} | ${kelas}`
            : (kelas || "-");

        const payload = {
            labId,
            kelas: kelasLabel,
            apiUrl: "",   
            apiKey: "",   
        };

        workerRef.current.postMessage({ action: "start", payload });

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && workerRef.current) {
                console.log("[Monitoring] Tab aktif kembali, mengirim heartbeat segera via Worker.");
                workerRef.current.postMessage({ action: "immediate", payload });
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        const handleBeforeUnload = () => {
            const kelasLabel = matkul && kelas
                ? `${matkul} | ${kelas}`
                : (kelas || "-");
            fetch("/api/monitoring/heartbeat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lab_id: labId,
                    kelas: kelasLabel,
                    status: "offline",
                    response_time_ms: null,
                    client_timestamp: Date.now(),
                }),
                keepalive: true,
            }).catch(() => {});
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [labId, matkul, kelas]);

    return { labId };
}
