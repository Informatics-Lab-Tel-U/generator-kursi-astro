let intervalId: number | NodeJS.Timeout | null = null;
let lastResponseTimeMs: number | null = null;

const postHeartbeat = async (apiUrl: string, apiKey: string, labId: string, kelas: string, silentError = false) => {
    const startTime = performance.now();
    try {
        await fetch(`${apiUrl}/api/monitoring/heartbeat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-praktikan-api-key": apiKey
            },
            body: JSON.stringify({
                lab_id: labId,
                kelas: kelas,
                status: "online",
                response_time_ms: lastResponseTimeMs
            })
        });
        lastResponseTimeMs = Math.round(performance.now() - startTime);
    } catch (error) {
        lastResponseTimeMs = null;
        if (!silentError) {
            console.error("[Worker Monitoring] Gagal mengirim heartbeat:", error);
        }
    }
};

self.onmessage = (e: MessageEvent) => {
    const { action, payload } = e.data;

    if (action === 'start' || action === 'update') {
        if (intervalId) {
            clearInterval(intervalId as number);
            intervalId = null;
        }

        const { labId, kelas, apiUrl, apiKey } = payload;
        if (!labId || !kelas) return;

        const sendHeartbeat = () => postHeartbeat(apiUrl, apiKey, labId, kelas);

        // Kirim segera saat start/update
        sendHeartbeat();

        // Set interval 20 detik
        intervalId = setInterval(sendHeartbeat, 20000);

    } else if (action === 'immediate') {
        const { labId, kelas, apiUrl, apiKey } = payload;
        if (!labId || !kelas) return;

        postHeartbeat(apiUrl, apiKey, labId, kelas, true);

    } else if (action === 'stop') {
        if (intervalId) {
            clearInterval(intervalId as number);
            intervalId = null;
        }
        lastResponseTimeMs = null;
    }
};

// Agar typescript mengenali ini sebagai module worker
export { };
