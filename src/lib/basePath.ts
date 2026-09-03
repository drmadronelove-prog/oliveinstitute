/**
 * The path prefix the whole app is mounted under. Single source of truth:
 * `next.config.ts` feeds it to Next's `basePath`, Auth.js scopes its
 * routes and session cookie to it, and `withBasePath` prefixes the URLs
 * Next can't rewrite for us.
 *
 * `next/link`, `next/image`, `useRouter`, and `redirect()` all prepend
 * `basePath` themselves — only hand-built URLs (a plain `<a href>`, a
 * `NextResponse.redirect`) need `withBasePath`.
 */
export const BASE_PATH = "/institute";

/** Prefixes an app-absolute path (e.g. "/api/files/x") with the base path. */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
