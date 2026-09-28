import { DurableObject } from "cloudflare:workers";

export class LeaderboardDO extends DurableObject<Env> {
  // TTL 3 jam — setelah ini data dianggap kedaluwarsa
  private readonly TTL_MS = 3 * 60 * 60 * 1000;

  // In-memory state: lebih aman di DO karena DO sudah singleton per room
  private leaderboardData: any[] = [];
  private lastUpdatedAt: number = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  private getLeaderboardData(): any[] {
    if (this.lastUpdatedAt === 0) return [];
    if (Date.now() - this.lastUpdatedAt > this.TTL_MS) {
      // Data kedaluwarsa → reset
      this.leaderboardData = [];
      this.lastUpdatedAt = 0;
      return [];
    }
    return this.leaderboardData;
  }

  private saveLeaderboardData(data: any[]): void {
    this.leaderboardData = data;
    this.lastUpdatedAt = Date.now();
  }

  private clearLeaderboardData(): void {
    this.leaderboardData = [];
    this.lastUpdatedAt = 0;
  }

  private broadcast(message: string): void {
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(message);
      } catch {
        // Socket sudah tidak aktif
      }
    }
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const upgradeHeader = request.headers.get("Upgrade");

      // 1. WebSocket Upgrade Handler
      if (upgradeHeader === "websocket") {
        console.log("[LeaderboardDO] 🔌 WebSocket upgrade request received");
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        this.ctx.acceptWebSocket(server);
        console.log("[LeaderboardDO] ✅ WebSocket accepted, active connections:", this.ctx.getWebSockets().length);

        return new Response(null, {
          status: 101,
          webSocket: client,
        });
      }

      // 2. HTTP POST Handler — push data dari scraping Moodle
      if (request.method === "POST") {
        const body = (await request.json()) as any;

        if (body.action === "RESET") {
          console.log("[LeaderboardDO] 🔄 RESET action received, clearing leaderboard data");
          this.clearLeaderboardData();
          this.broadcast(JSON.stringify({ type: "UPDATE", data: [] }));
          return new Response(JSON.stringify({ success: true, cleared: true }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const data = Array.isArray(body.data) ? body.data : [];
        console.log(`[LeaderboardDO] 📥 Received POST with ${data.length} entries, broadcasting to ${this.ctx.getWebSockets().length} clients`);
        this.saveLeaderboardData(data);
        this.broadcast(JSON.stringify({ type: "UPDATE", data }));

        return new Response(
          JSON.stringify({
            success: true,
            count: data.length,
            activeClients: this.ctx.getWebSockets().length,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      // 3. HTTP GET Handler — fallback tanpa WebSocket
      if (request.method === "GET") {
        return new Response(JSON.stringify(this.getLeaderboardData()), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      return new Response("Method not allowed", { status: 405 });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: "LeaderboardDO error", details: err?.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      if (typeof message === "string") {
        if (message === "PING") {
          ws.send("PONG");
          console.log("[LeaderboardDO] 🏓 PING received, sent PONG");
          return;
        }
        const parsed = JSON.parse(message);
        if (parsed.type === "GET" || parsed.type === "INIT") {
          const data = this.getLeaderboardData();
          console.log(`[LeaderboardDO] 📤 Sending INIT with ${data.length} entries to client`);
          ws.send(JSON.stringify({ type: "INIT", data }));
        }
      }
    } catch (e) {
      console.error("[LeaderboardDO] ❌ Error processing WebSocket message:", e);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    console.log(`[LeaderboardDO] 👋 WebSocket closed, code: ${code}, reason: ${reason || 'none'}, remaining connections: ${this.ctx.getWebSockets().length - 1}`);
    // DO akan hibernate otomatis jika tidak ada connections dan tidak ada activity
    if (this.ctx.getWebSockets().length === 1) {
      console.log(`[LeaderboardDO] 💤 Last connection closed, DO will hibernate soon`);
    }
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("[LeaderboardDO] ❌ WebSocket error:", error);
    try {
      ws.close(1011, "WebSocket error");
    } catch {
      // Abaikan
    }
  }
}