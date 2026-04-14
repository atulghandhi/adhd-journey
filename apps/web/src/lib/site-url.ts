/**
 * Returns the base URL for the web app, used in auth redirect URLs.
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL (set in production — available on client and server)
 * 2. VERCEL_URL (auto-set by Vercel — server-only, for preview deployments)
 * 3. localhost fallback for local development
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
