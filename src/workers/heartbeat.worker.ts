let intervalId: number | NodeJS.Timeout | null = null;

self.onmessage = (e: MessageEvent) => {
    const { action, payload } = e.data;
    
    if (action === 'start' || action === 'update') {
        if (intervalId) {
            clearInterval(intervalId as number);
            intervalId = null;
        }
        
        const { labId, kelas, apiUrl, apiKey } = payload;
        if (!labId || !kelas) return;
        
        const sendHeartbeat = async () => {
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
                        status: "online"
                    })
                });
            } catch (error) {
                console.error("[Worker Monitoring] Gagal mengirim heartbeat:", error);
            }
        };
        
        // Kirim segera saat start/update
        sendHeartbeat();
        
        // Set interval 20 detik
        intervalId = setInterval(sendHeartbeat, 20000);
        
    } else if (action === 'immediate') {
        const { labId, kelas, apiUrl, apiKey } = payload;
        if (!labId || !kelas) return;
        
        const sendHeartbeat = async () => {
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
                        status: "online"
                    })
                });
            } catch (error) {
                // Ignore jika sekadar heartbeat visibilitychange gagal
            }
        };
        
        sendHeartbeat();
        
    } else if (action === 'stop') {
        if (intervalId) {
            clearInterval(intervalId as number);
            intervalId = null;
        }
    }
};

// Agar typescript mengenali ini sebagai module worker
export {};
