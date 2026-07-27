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
            // Saat offline, laporkan null — tidak ada data latensi yang valid
            response_time_ms: status === 'online' ? lastResponseTimeMs : null,
            client_timestamp: Date.now(),
        });

        const headers = {
            "Content-Type": "application/json",
            "x-praktikan-api-key": apiKey,
        };

        // Backend Hono selalu di-mount di /api/monitoring/heartbeat
        // (lihat src/index.ts: .route('/api/monitoring', monitoringRoute))
        const targetUrl = `${apiUrl}/api/monitoring/heartbeat`;

        let res = await fetch(targetUrl, {
            method: "POST",
            headers,
            body: payloadBody,
            keepalive,
        });

        // Catat latensi HANYA untuk siklus online reguler
        if (status === 'online') {
            lastResponseTimeMs = Math.round(performance.now() - startTime);
        }
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
        // Bersihkan interval lama agar tidak ada dobel-tick
        if (intervalId) {
            clearInterval(intervalId as number);
            intervalId = null;
        }

        const { labId, kelas, apiUrl, apiKey } = payload;
        if (!labId) return; // kelas boleh kosong/"-", labId wajib

        const sendHeartbeat = () => postHeartbeat(apiUrl, apiKey, labId, kelas);

        // Kirim segera saat start/update
        sendHeartbeat();

        // Kirim setiap 30 detik
        intervalId = setInterval(sendHeartbeat, 30_000);

    } else if (action === 'immediate') {
        const { labId, kelas, apiUrl, apiKey, status = 'online', keepalive = false } = payload;
        if (!labId) return;

        // Kirim sekali seketika (misal: tab baru aktif atau sinyal offline saat ditutup)
        postHeartbeat(apiUrl, apiKey, labId, kelas, status, keepalive, true);

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
