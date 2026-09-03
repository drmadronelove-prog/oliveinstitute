import { describe, expect, it } from "vitest";
import { deriveVerificationCode, formatHours } from "@/lib/certificate";

describe("formatHours", () => {
  it("converts minutes to hours at one decimal place", () => {
    expect(formatHours(190)).toBe("3.2");
    expect(formatHours(60)).toBe("1.0");
    expect(formatHours(30)).toBe("0.5");
    expect(formatHours(0)).toBe("0.0");
  });
});

describe("deriveVerificationCode", () => {
  it("is deterministic for the same enrollment id", () => {
    const id = "cmtl100mh00027dmupd5dj3un";
    expect(deriveVerificationCode(id)).toBe(deriveVerificationCode(id));
  });

  it("differs for different enrollment ids", () => {
    expect(deriveVerificationCode("enrollment-a")).not.toBe(
      deriveVerificationCode("enrollment-b"),
    );
  });

  it("is not just the raw enrollment id", () => {
    const id = "cmtl100mh00027dmupd5dj3un";
    expect(deriveVerificationCode(id)).not.toContain(id);
  });

  it("is grouped into readable hyphenated blocks", () => {
    expect(deriveVerificationCode("cmtl100mh00027dmupd5dj3un")).toMatch(
      /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/,
    );
  });
});
