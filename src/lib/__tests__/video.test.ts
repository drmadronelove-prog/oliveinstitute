import { afterEach, describe, expect, it, vi } from "vitest";
import { vttToPlainText } from "@/lib/video";

/**
 * Unit coverage for src/lib/video.ts. The Cloudflare Stream API itself is
 * unreachable from this sandbox (same outbound-network constraint documented
 * for Stripe in checkout-webhook.integration.test.ts), so the API-wrapper
 * functions are tested against a mocked `fetch` — proving they build the
 * right request (URL, auth header, body) and parse the right response shape,
 * rather than proving a real Cloudflare account accepts them. `vttToPlainText`
 * is pure and network-free, so it gets real, unmocked test coverage.
 */

describe("vttToPlainText", () => {
  it("strips the header, cue indices, and timestamps", () => {
    const vtt = [
      "WEBVTT",
      "",
      "1",
      "00:00:00.000 --> 00:00:02.000",
      "Hello there.",
      "",
      "2",
      "00:00:02.000 --> 00:00:04.000",
      "General Kenobi.",
    ].join("\n");

    expect(vttToPlainText(vtt)).toBe("Hello there. General Kenobi.");
  });

  it("strips inline cue tags and NOTE blocks", () => {
    const vtt = [
      "WEBVTT",
      "",
      "NOTE This is a comment, not spoken text",
      "",
      "1",
      "00:00:00.000 --> 00:00:02.000",
      "<v Speaker>Hello.</v>",
    ].join("\n");

    expect(vttToPlainText(vtt)).toBe("Hello.");
  });

  it("returns an empty string for an empty or header-only file", () => {
    expect(vttToPlainText("")).toBe("");
    expect(vttToPlainText("WEBVTT\n")).toBe("");
  });
});

const ENV_KEYS = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_STREAM_TOKEN"] as const;

/**
 * The module reads its env vars once, at import time, so testing both the
 * configured and unconfigured states needs a fresh module instance per test
 * — vi.resetModules() plus a dynamic import, rather than the static import
 * used for the pure vttToPlainText tests above.
 */
async function loadVideoModule(configured: boolean) {
  vi.resetModules();
  if (configured) {
    process.env.CLOUDFLARE_ACCOUNT_ID = "test-account";
    process.env.CLOUDFLARE_STREAM_TOKEN = "test-token";
  } else {
    for (const key of ENV_KEYS) delete process.env[key];
  }
  return import("@/lib/video");
}

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
  vi.unstubAllGlobals();
});

describe("streamConfigured", () => {
  it("is false when the Cloudflare credentials are unset", async () => {
    const video = await loadVideoModule(false);
    expect(video.streamConfigured).toBe(false);
  });

  it("is true once both credentials are set", async () => {
    const video = await loadVideoModule(true);
    expect(video.streamConfigured).toBe(true);
  });
});

describe("Stream API wrapper, unconfigured", () => {
  it("refuses to call the API without credentials", async () => {
    const video = await loadVideoModule(false);
    await expect(video.createDirectUploadUrl()).rejects.toThrow(
      /not configured/i,
    );
  });
});

describe("Stream API wrapper, configured", () => {
  it("creates a direct upload URL with requireSignedURLs set", async () => {
    const video = await loadVideoModule(true);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          result: { uploadURL: "https://upload.example/x", uid: "abc123" },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const upload = await video.createDirectUploadUrl();

    expect(upload).toEqual({
      uploadURL: "https://upload.example/x",
      uid: "abc123",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/test-account/stream/direct_upload",
    );
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer test-token");
    expect(JSON.parse(init.body)).toMatchObject({ requireSignedURLs: true });
  });

  it("reports readyToStream and rounds the duration", async () => {
    const video = await loadVideoModule(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            result: {
              readyToStream: true,
              duration: 125.6,
              status: { state: "ready" },
            },
          }),
          { status: 200 },
        ),
      ),
    );

    expect(await video.getVideoStatus("abc123")).toEqual({
      readyToStream: true,
      durationSeconds: 126,
      state: "ready",
    });
  });

  it("reports not-ready without a duration while still processing", async () => {
    const video = await loadVideoModule(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            result: { readyToStream: false, status: { state: "inprogress" } },
          }),
          { status: 200 },
        ),
      ),
    );

    expect(await video.getVideoStatus("abc123")).toEqual({
      readyToStream: false,
      durationSeconds: null,
      state: "inprogress",
    });
  });

  it("treats a non-2xx response as an error", async () => {
    const video = await loadVideoModule(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 403 })),
    );

    await expect(video.getVideoStatus("abc123")).rejects.toThrow(/403/);
  });

  it("mints a token expiring roughly the requested number of seconds out", async () => {
    const video = await loadVideoModule(true);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, result: { token: "signed.jwt.token" } }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const token = await video.mintPlaybackToken("abc123");

    expect(token).toBe("signed.jwt.token");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/test-account/stream/abc123/token",
    );
    const body = JSON.parse(init.body);
    const secondsFromNow = body.exp - Math.floor(Date.now() / 1000);
    expect(secondsFromNow).toBeGreaterThan(2 * 60 * 60 - 5);
    expect(secondsFromNow).toBeLessThanOrEqual(2 * 60 * 60);
  });

  it("lists caption tracks and reports whether each is generated", async () => {
    const video = await loadVideoModule(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            result: [{ language: "en", generated: true }],
          }),
          { status: 200 },
        ),
      ),
    );

    expect(await video.listCaptions("abc123")).toEqual([
      { language: "en", generated: true },
    ]);
  });

  it("requests caption generation for the given language", async () => {
    const video = await loadVideoModule(true);
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await video.generateCaptions("abc123", "en");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/test-account/stream/abc123/captions/en/generate",
    );
    expect(init.method).toBe("POST");
  });

  it("returns the raw VTT text for a caption track", async () => {
    const video = await loadVideoModule(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("WEBVTT\n\n1\n00:00:00.000 --> 00:00:01.000\nHi.", {
          status: 200,
        }),
      ),
    );

    expect(await video.getCaptionVtt("abc123")).toContain("Hi.");
  });
});
