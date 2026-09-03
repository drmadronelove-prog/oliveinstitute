import { createHash, randomBytes } from "crypto";

/**
 * Single-use link tokens for email verification and password resets.
 *
 * The raw token only ever exists in the email. The database stores its
 * SHA-256 hash, so someone who reads the table cannot mint a working link.
 * SHA-256 rather than bcrypt is right here: the token is 256 bits of
 * randomness, so there is nothing to brute-force, and lookup must be a
 * single indexed query.
 */

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // one hour
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // one day

/** A fresh token: the raw value to email, and the hash to store. */
export function createToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** True while a token row is still redeemable. */
export function isTokenUsable(row: {
  expiresAt: Date;
  usedAt: Date | null;
}): boolean {
  return row.usedAt === null && row.expiresAt.getTime() > Date.now();
}
