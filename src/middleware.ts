import { defineMiddleware } from "astro:middleware";

const BACKEND_URL = 
  import.meta.env.PRAKTIKAN_API_URL || 
  import.meta.env.PUBLIC_PRAKTIKAN_API_URL || 
  import.meta.env.PUBLIC_HONO_BACKEND_URL || 
  (import.meta.env.DEV ? "http://localhost:8787" : "");

// PERF-02 FIX: Cache maintenance status for 15 seconds to avoid a fresh network roundtrip
// on every single page request. Same strategy used by the Next.js frontend middleware.
const CACHE_TTL_MS = 15_000
let maintenanceCache: { isMaintenance: boolean; expiry: number } | null = null

async function checkMaintenanceMode(): Promise<boolean> {
  const now = Date.now()
  if (maintenanceCache && now < maintenanceCache.expiry) {
    return maintenanceCache.isMaintenance
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/system/maintenance?app=generator_kursi`)
    if (!res.ok) return false
    const data: any = await res.json()
    const isMaintenance = !!(data?.active ?? data?.maintenance)
    maintenanceCache = { isMaintenance, expiry: now + CACHE_TTL_MS }
    return isMaintenance
  } catch {
    // Graceful fallback: if backend unreachable, assume not in maintenance
    return false
  }
}

const rawAllowedOrigins = import.meta.env.PRAKTIKAN_GET_ALLOWED_ORIGINS || "";
const allowedOriginsList = rawAllowedOrigins
  .split(",")
  .map((o: string) => o.trim())
  .filter(Boolean);

function resolveAllowedOrigin(requestOrigin: string, pathname: string, appOrigin: string): string | null {
  if (!requestOrigin) return null;
  if (requestOrigin === appOrigin) return requestOrigin;
  if (allowedOriginsList.includes(requestOrigin)) return requestOrigin;

  // Allow local dev origins
  if (import.meta.env.DEV) {
    if (requestOrigin.startsWith("http://localhost:") || requestOrigin.startsWith("http://127.0.0.1:")) {
      return requestOrigin;
    }
  }

  // Allow Moodle LMS origins for process-html
  if (pathname.startsWith("/api/process-html")) {
    try {
      const parsed = new URL(requestOrigin);
      if (parsed.hostname.endsWith(".telkomuniversity.ac.id") || parsed.hostname === "telkomuniversity.ac.id") {
        return requestOrigin;
      }
    } catch {}
    return requestOrigin; // Allow cross-origin scrape from Moodle
  }

  return null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Handle CORS for all API routes
  if (pathname.startsWith("/api/")) {
    const requestOrigin = context.request.headers.get("origin") || "";
    const corsOrigin = resolveAllowedOrigin(requestOrigin, pathname, context.url.origin) || (pathname.startsWith("/api/process-html") ? "*" : "");

    if (context.request.method === "OPTIONS") {
      const preflightHeaders = new Headers({
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      });
      if (corsOrigin) {
        preflightHeaders.set("Access-Control-Allow-Origin", corsOrigin);
        if (corsOrigin !== "*") preflightHeaders.set("Vary", "Origin");
      }
      return new Response(null, {
        status: 204,
        headers: preflightHeaders,
      });
    }

    const response = await next();
    const headers = new Headers(response.headers);
    if (corsOrigin) {
      headers.set("Access-Control-Allow-Origin", corsOrigin);
      if (corsOrigin !== "*") headers.append("Vary", "Origin");
    }
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // Ignore static assets, favicon
  if (
    pathname.startsWith("/_image") ||
    pathname.startsWith("/_astro") ||
    pathname.includes(".")
  ) {
    return next();
  }

  try {
    const isMaintenance = await checkMaintenanceMode()

    // Redirect to /maintenance if mode is active and not already on /maintenance
    if (isMaintenance && pathname !== "/maintenance") {
      return context.redirect("/maintenance", 302);
    }

    // Redirect away from /maintenance if mode is inactive
    if (!isMaintenance && pathname === "/maintenance") {
      return context.redirect("/", 302);
    }
  } catch (error) {
    console.error("Failed to check maintenance mode for generator kursi:", error);
  }

  const pageRes = await next();
  const pageHeaders = new Headers(pageRes.headers);
  pageHeaders.set("X-Content-Type-Options", "nosniff");
  pageHeaders.set("X-Frame-Options", "SAMEORIGIN");
  pageHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return new Response(pageRes.body, {
    status: pageRes.status,
    statusText: pageRes.statusText,
    headers: pageHeaders,
  });
});
