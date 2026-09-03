import { describe, expect, it } from "vitest";
import { generateTempPassword } from "@/lib/password";

describe("generateTempPassword", () => {
  it("defaults to 12 characters", () => {
    expect(generateTempPassword()).toHaveLength(12);
  });

  it("respects a custom length", () => {
    expect(generateTempPassword(20)).toHaveLength(20);
  });

  it("only uses unambiguous alphanumeric characters", () => {
    const password = generateTempPassword(200);
    expect(password).toMatch(/^[a-zA-Z0-9]+$/);
    expect(password).not.toMatch(/[0O1lI]/);
  });

  it("generates different passwords on each call", () => {
    const passwords = new Set(
      Array.from({ length: 20 }, () => generateTempPassword()),
    );
    expect(passwords.size).toBe(20);
  });
});
