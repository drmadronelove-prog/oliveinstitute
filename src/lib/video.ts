const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_STREAM_TOKEN;

/**
 * True only when both Cloudflare credentials are set. Every route and
 * Server Action that can reach Stream's API checks this first — same
 * pattern as `stripeConfigured` in src/lib/stripe.ts — so `next build`
 * never needs live credentials, and an unconfigured deployment fails with
 * one clear message instead of a cryptic auth error surfacing later.
 */
export const streamConfigured = Boolean(accountId && apiToken);

const API_BASE = "https://api.cloudflare.com/client/v4";

function requireConfig(): { accountId: string; apiToken: string } {
  if (!accountId || !apiToken) {
    throw new Error(
      "Cloudflare Stream is not configured — set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_TOKEN.",
    );
  }
  return { accountId, apiToken };
}

/** POSTs/GETs against this account's Stream API, throwing on a non-2xx response. */
async function streamFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const config = requireConfig();
  const response = await fetch(
    `${API_BASE}/accounts/${config.accountId}/stream${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        ...init?.headers,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Cloudflare Stream API error ${response.status} for ${path}: ${body}`,
    );
  }

  return response;
}

type CloudflareEnvelope<T> = { success: boolean; result: T };

export type DirectUpload = { uploadURL: string; uid: string };

/**
 * A one-time upload URL the browser can POST the video file to directly —
 * the file never passes through this server. `requireSignedURLs: true` is
 * set here, at creation time, not adjustable afterward: every playback of
 * this video will need a signed token from `mintPlaybackToken`.
 */
export async function createDirectUploadUrl(
  options: { maxDurationSeconds?: number } = {},
): Promise<DirectUpload> {
  const response = await streamFetch("/direct_upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      maxDurationSeconds: options.maxDurationSeconds ?? 3600,
      requireSignedURLs: true,
    }),
  });
  const data =
    (await response.json()) as CloudflareEnvelope<DirectUpload>;
  return data.result;
}

export type VideoStatus = {
  readyToStream: boolean;
  durationSeconds: number | null;
  state: string;
};

type StreamVideoResult = {
  readyToStream?: boolean;
  duration?: number;
  status?: { state?: string };
};

/** Polls a single video's processing status — call after upload completes. */
export async function getVideoStatus(uid: string): Promise<VideoStatus> {
  const response = await streamFetch(`/${uid}`);
  const data = (await response.json()) as CloudflareEnvelope<StreamVideoResult>;
  const result = data.result;
  return {
    readyToStream: Boolean(result.readyToStream),
    durationSeconds:
      typeof result.duration === "number" && result.duration > 0
        ? Math.round(result.duration)
        : null,
    state: result.status?.state ?? "unknown",
  };
}

export type CaptionTrack = { language: string; generated: boolean };

type StreamCaptionResult = { language: string; generated?: boolean };

/** Existing (or in-progress) caption tracks for a video. */
export async function listCaptions(uid: string): Promise<CaptionTrack[]> {
  const response = await streamFetch(`/${uid}/captions`);
  const data =
    (await response.json()) as CloudflareEnvelope<StreamCaptionResult[]>;
  return data.result.map((track) => ({
    language: track.language,
    generated: Boolean(track.generated),
  }));
}

/**
 * Requests Cloudflare's automatic-speech-recognition captions for a video.
 * Generation happens asynchronously on Cloudflare's side — poll
 * `listCaptions` for `generated: true` before calling `getCaptionVtt`.
 */
export async function generateCaptions(
  uid: string,
  language = "en",
): Promise<void> {
  await streamFetch(`/${uid}/captions/${language}/generate`, {
    method: "POST",
  });
}

/** The raw WebVTT text for a caption track. Pass through `vttToPlainText` to store in Lesson.transcript. */
export async function getCaptionVtt(
  uid: string,
  language = "en",
): Promise<string> {
  const response = await streamFetch(`/${uid}/captions/${language}/vtt`);
  return response.text();
}

const DEFAULT_TOKEN_TTL_SECONDS = 2 * 60 * 60;

/**
 * Mints a short-lived signed playback token for a video created with
 * `requireSignedURLs`. The Stream Player web component takes this token as
 * its `src` in place of the bare video uid.
 */
export async function mintPlaybackToken(
  uid: string,
  ttlSeconds = DEFAULT_TOKEN_TTL_SECONDS,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const response = await streamFetch(`/${uid}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exp }),
  });
  const data = (await response.json()) as CloudflareEnvelope<{
    token: string;
  }>;
  return data.result.token;
}

/**
 * Cloudflare's generated captions come back as WebVTT. This strips the
 * `WEBVTT` header, cue index lines, timestamp lines, `NOTE` blocks, and
 * inline cue tags (e.g. `<v Speaker>`), leaving plain spoken text — what
 * gets written into `Lesson.transcript`. Pure and network-free, so it's
 * unit-tested directly rather than only through the API wrapper.
 */
export function vttToPlainText(vtt: string): string {
  const lines: string[] = [];

  for (const rawLine of vtt.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("WEBVTT")) continue;
    if (line.startsWith("NOTE")) continue;
    if (line.includes("-->")) continue;
    if (/^\d+$/.test(line)) continue; // cue index

    lines.push(line.replace(/<[^>]+>/g, ""));
  }

  return lines.join(" ").replace(/\s+/g, " ").trim();
}
