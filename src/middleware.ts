import { defineMiddleware } from "astro:middleware";

const BACKEND_URL = 
  import.meta.env.PUBLIC_PRAKTIKAN_API_URL || 
  import.meta.env.PUBLIC_HONO_BACKEND_URL || 
  "https://manajemenasprak-backend.iflabdev.workers.dev";

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
    // Fetch maintenance status for generator_kursi
    const res = await fetch(`${BACKEND_URL}/api/system/maintenance?app=generator_kursi`);

    if (res.ok) {
      const data: any = await res.json();
      const isMaintenance = !!(data?.active ?? data?.maintenance);

      // Redirect to /maintenance if mode is active and not already on /maintenance
      if (isMaintenance && pathname !== "/maintenance") {
        return context.redirect("/maintenance", 302);
      }

      // Redirect away from /maintenance if mode is inactive
      if (!isMaintenance && pathname === "/maintenance") {
        return context.redirect("/", 302);
      }
    }
  } catch (error) {
    // Graceful fallback if Hono backend unreachable
    console.error("Failed to check maintenance mode for generator kursi:", error);
  }

  return next();
});
