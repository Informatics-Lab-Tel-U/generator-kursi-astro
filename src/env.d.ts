



type LeaderboardDOInstance = import("./durable-objects/LeaderboardDO").LeaderboardDO;

interface Env {
    PRAKTIKAN_GET_API_KEY?: string;
    PRAKTIKAN_API_URL?: string;
    MANAJEMEN_ASPRAK?: { fetch: typeof fetch };
    LEADERBOARD_KV?: KVNamespace;
    LEADERBOARD_DO?: DurableObjectNamespace<LeaderboardDOInstance>;
    [key: string]: any;
}

declare namespace Cloudflare {
    interface Env {
        PRAKTIKAN_GET_API_KEY?: string;
        PRAKTIKAN_API_URL?: string;
        MANAJEMEN_ASPRAK?: { fetch: typeof fetch };
        LEADERBOARD_KV?: KVNamespace;
        LEADERBOARD_DO?: DurableObjectNamespace<LeaderboardDOInstance>;
        [key: string]: any;
    }
}

