import { describe, expect, it } from "vitest";
import { formatNameList } from "@/lib/format";

/**
 * A course now carries a list of instructors rather than one, so its
 * byline has to read naturally at any length.
 */
describe("formatNameList", () => {
  it("returns a single name unchanged", () => {
    expect(formatNameList(["Madrone Love"])).toBe("Madrone Love");
  });

  it('joins two names with "and", not a comma', () => {
    expect(formatNameList(["Ada", "Grace"])).toBe("Ada and Grace");
  });

  it("comma-separates three or more, keeping the last join as a word", () => {
    expect(formatNameList(["Ada", "Grace", "Alan"])).toBe("Ada, Grace and Alan");
    expect(formatNameList(["Ada", "Grace", "Alan", "Katherine"])).toBe(
      "Ada, Grace, Alan and Katherine",
    );
  });

  it("is empty for no names, so a caller can test it for truthiness", () => {
    expect(formatNameList([])).toBe("");
  });

  it("ignores blank entries rather than emitting a stray separator", () => {
    expect(formatNameList(["Ada", "   ", "Grace"])).toBe("Ada and Grace");
    expect(formatNameList(["", "  "])).toBe("");
  });
});
