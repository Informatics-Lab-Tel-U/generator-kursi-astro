import { defineMiddleware } from "astro:middleware";

const BACKEND_URL = 
  import.meta.env.PUBLIC_PRAKTIKAN_API_URL || 
  import.meta.env.PUBLIC_HONO_BACKEND_URL || 
  "https://manajemenasprak-backend.iflabdev.workers.dev";

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

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Ignore static assets, favicon, API routes if any
  if (
    pathname.startsWith("/_image") ||
    pathname.startsWith("/_astro") ||
    pathname.includes(".") ||
    pathname.startsWith("/api/")
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

  return next();
});
