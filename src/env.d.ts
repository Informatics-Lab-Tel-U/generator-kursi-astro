/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module "cloudflare:workers" {
    export const env: {
        PRAKTIKAN_GET_API_KEY: string;
        PRAKTIKAN_API_URL: string;
        MANAJEMEN_ASPRAK?: { fetch: typeof fetch };
        [key: string]: any;
    };
}
