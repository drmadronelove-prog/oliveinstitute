import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Rate limiting for the unauthenticated auth endpoints.
 *
 * Backed by rows in `rate_limit_hits` rather than an in-memory counter, so a
 * restart or a second app instance does not hand an attacker a fresh budget.
 * Counting rows in a window is enough at this scale; swap in Redis if the
 * table ever gets hot.
 */

export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // one hour

/**
 * Per-hour budgets. The IP limits are deliberately looser than the email
 * ones: a shared office NAT or a household is one IP, so a tight IP cap
 * locks out bystanders, whereas repeated attempts against a single address
 * are the pattern actually worth stopping.
 */
export const LIMITS = {
  "register:ip": 10,
  "register:email": 3,
  "password-reset:ip": 10,
  "password-reset:email": 3,
} as const;

export type RateLimitScope = keyof typeof LIMITS;

/**
 * The caller's IP, from the proxy headers. Spoofable unless a trusted reverse
 * proxy sets them, which is the documented deployment shape — the email limit
 * is the one that holds regardless.
 */
export async function callerIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerList.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Records an attempt and reports whether it is over budget. Always records,
 * so a caller who keeps hammering stays blocked for the whole window.
 */
export async function consumeRateLimit(
  scope: RateLimitScope,
  key: string,
): Promise<{ allowed: boolean }> {
  const normalized = key.trim().toLowerCase() || "unknown";
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  await prisma.rateLimitHit.create({ data: { scope, key: normalized } });

  const count = await prisma.rateLimitHit.count({
    where: { scope, key: normalized, createdAt: { gte: since } },
  });

  // Opportunistic pruning: cheap, and keeps the table from growing forever
  // without needing a scheduled job.
  if (count % 25 === 0) {
    await prisma.rateLimitHit.deleteMany({
      where: { createdAt: { lt: since } },
    });
  }

  return { allowed: count <= LIMITS[scope] };
}

/**
 * Applies both the IP and the email budget for an action. Returns a message
 * to show the caller, or null when they are within budget.
 */
export async function checkAuthRateLimit(
  action: "register" | "password-reset",
  email: string,
): Promise<string | null> {
  const ip = await callerIp();

  const [byIp, byEmail] = await Promise.all([
    consumeRateLimit(`${action}:ip` as RateLimitScope, ip),
    consumeRateLimit(`${action}:email` as RateLimitScope, email),
  ]);

  if (!byIp.allowed || !byEmail.allowed) {
    return "Too many attempts. Try again in an hour.";
  }
  return null;
}
