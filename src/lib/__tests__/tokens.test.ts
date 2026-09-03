import { describe, expect, it } from "vitest";
import {
  createToken,
  hashToken,
  isTokenUsable,
  PASSWORD_RESET_TTL_MS,
} from "@/lib/tokens";

describe("createToken", () => {
  it("returns a token with its matching hash", () => {
    const { token, tokenHash } = createToken();
    expect(hashToken(token)).toBe(tokenHash);
  });

  it("never returns the raw token as the stored value", () => {
    const { token, tokenHash } = createToken();
    expect(tokenHash).not.toBe(token);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is URL-safe, so it survives being pasted into a link", () => {
    for (let i = 0; i < 20; i += 1) {
      expect(createToken().token).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("does not repeat", () => {
    const seen = new Set(
      Array.from({ length: 200 }, () => createToken().token),
    );
    expect(seen.size).toBe(200);
  });
});

describe("isTokenUsable", () => {
  const future = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  const past = new Date(Date.now() - 1000);

  it("accepts an unused, unexpired token", () => {
    expect(isTokenUsable({ expiresAt: future, usedAt: null })).toBe(true);
  });

  it("rejects an expired token", () => {
    expect(isTokenUsable({ expiresAt: past, usedAt: null })).toBe(false);
  });

  it("rejects a token that has already been used", () => {
    expect(isTokenUsable({ expiresAt: future, usedAt: new Date() })).toBe(false);
  });
});
