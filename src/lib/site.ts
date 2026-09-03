import { withBasePath } from "@/lib/basePath";

/**
 * The public origin the site is served from, used to build the absolute URLs
 * Open Graph and canonical tags need. Falls back to NEXTAUTH_URL, which is
 * already the deployment's own origin, then to localhost for development.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "Olive Institute";

/** Absolute URL for an app path, e.g. "/courses/x" -> "https://…/institute/courses/x". */
export function absoluteUrl(path: string): string {
  return new URL(withBasePath(path), SITE_URL).toString();
}
