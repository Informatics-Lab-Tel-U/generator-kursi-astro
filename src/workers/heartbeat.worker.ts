let intervalId: number | NodeJS.Timeout | null = null;
let lastResponseTimeMs: number | null = null;

const postHeartbeat = async (
    apiUrl: string,
    apiKey: string,
    labId: string,
    kelas: string,
    status: string = 'online',
    keepalive: boolean = false,
    silentError = false,
) => {
    const startTime = performance.now();
    try {
        const payloadBody = JSON.stringify({
            lab_id: labId,
            kelas: kelas,
            status: status,
            response_time_ms: status === 'online' ? lastResponseTimeMs : null,
            client_timestamp: Date.now(),
        });

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (apiKey) {
            headers["x-praktikan-api-key"] = apiKey;
        }

        const targetUrl = apiUrl && apiUrl.startsWith('http')
            ? `${apiUrl}/api/monitoring/heartbeat`
            : "/api/monitoring/heartbeat";

        let res = await fetch(targetUrl, {
            method: "POST",
            headers,
            body: payloadBody,
            keepalive,
            signal: AbortSignal.timeout(5000),
        });

        if (status === 'online' && res.ok) {
            lastResponseTimeMs = Math.round(performance.now() - startTime);
        }
    } catch (error: any) {
        lastResponseTimeMs = null;
        if (!silentError) {
            console.error("[Worker Monitoring] Gagal mengirim heartbeat:", error?.message || error);
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
        if (!labId) return;

        const sendHeartbeat = () => postHeartbeat(apiUrl, apiKey, labId, kelas);
        sendHeartbeat();
        intervalId = setInterval(sendHeartbeat, 30_000);

    } else if (action === 'immediate') {
        const { labId, kelas, apiUrl, apiKey, status = 'online', keepalive = false } = payload;
        if (!labId) return;

        postHeartbeat(apiUrl, apiKey, labId, kelas, status, keepalive, true);

    } else if (action === 'stop') {
        if (intervalId) {
            clearInterval(intervalId as number);
            intervalId = null;
        }
        lastResponseTimeMs = null;
    }
};

export { };
