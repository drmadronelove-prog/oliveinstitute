import { describe, expect, it } from "vitest";
import {
  assessPasswordStrength,
  MIN_PASSWORD_LENGTH,
  MIN_PASSWORD_SCORE,
  validatePassword,
} from "@/lib/password";

describe("assessPasswordStrength", () => {
  it("rejects anything shorter than the minimum", () => {
    const result = assessPasswordStrength("Ab3$xy");
    expect(result.score).toBeLessThan(MIN_PASSWORD_SCORE);
    expect(result.issues[0]).toContain(String(MIN_PASSWORD_LENGTH));
  });

  it("rejects a single character class however long", () => {
    const result = assessPasswordStrength("aaaaaaaaaaaaaaaaaaaa");
    expect(result.score).toBeLessThan(MIN_PASSWORD_SCORE);
  });

  it("accepts a long passphrase with mixed case", () => {
    const result = assessPasswordStrength("Ripe Cherries In Autumn");
    expect(result.score).toBeGreaterThanOrEqual(MIN_PASSWORD_SCORE);
    expect(result.issues).toEqual([]);
  });

  it("accepts a shorter password with good variety", () => {
    expect(
      assessPasswordStrength("Kestrel-42-Bay").score,
    ).toBeGreaterThanOrEqual(MIN_PASSWORD_SCORE);
  });

  it("rejects common patterns even when they are long enough", () => {
    // "Olive" and "Institute" are on the list too: a password built from the
    // product's own name is exactly what people reach for first.
    for (const weak of [
      "password12345",
      "Qwerty123456!",
      "letmein-please",
      "OliveInstitute1",
    ]) {
      const result = assessPasswordStrength(weak);
      expect(result.score, weak).toBeLessThan(MIN_PASSWORD_SCORE);
    }
  });

  it("rejects a password built from the person's own name or email", () => {
    const byName = assessPasswordStrength("Wren-Halloway-1", {
      name: "Wren Halloway",
    });
    expect(byName.score).toBeLessThan(MIN_PASSWORD_SCORE);

    const byEmail = assessPasswordStrength("kestrel!2026X", {
      email: "kestrel@example.com",
    });
    expect(byEmail.score).toBeLessThan(MIN_PASSWORD_SCORE);
  });

  it("scores the empty password at zero without throwing", () => {
    expect(assessPasswordStrength("").score).toBe(0);
  });

  it("clears the issue list once a password is acceptable", () => {
    expect(assessPasswordStrength("Ripe Cherries In Autumn").issues).toEqual([]);
  });
});

describe("validatePassword", () => {
  it("returns null for an acceptable password", () => {
    expect(validatePassword("Kestrel-42-Bay")).toBeNull();
  });

  it("returns a message for a weak one", () => {
    expect(validatePassword("short")).toBeTruthy();
  });

  it("takes the person's details into account", () => {
    expect(
      validatePassword("Halloway-Halloway", { name: "Wren Halloway" }),
    ).toBeTruthy();
  });
});
