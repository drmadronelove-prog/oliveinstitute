"use client";

import { useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/basePath";
import { saveLessonPositionAction } from "@/app/learn/[courseSlug]/[lessonSlug]/actions";
import type { StreamElement } from "@/types/stream-element";

const EMBED_SCRIPT_SRC = "https://embed.cloudflarestream.com/embed/sdk.latest.js";
const PLAYBACK_RATE_STORAGE_KEY = "olive:video-playback-rate";
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

let embedScriptPromise: Promise<void> | null = null;

/** Loads Cloudflare's Stream Player script once per page, however many players are on it. */
function loadStreamEmbedScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (embedScriptPromise) return embedScriptPromise;

  embedScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${EMBED_SCRIPT_SRC}"]`,
    );
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = EMBED_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load the video player."));
    document.head.appendChild(script);
  });

  return embedScriptPromise;
}

function readStoredPlaybackRate(): number {
  try {
    const stored = window.localStorage.getItem(PLAYBACK_RATE_STORAGE_KEY);
    const rate = stored ? Number(stored) : 1;
    return PLAYBACK_RATES.includes(rate as (typeof PLAYBACK_RATES)[number])
      ? rate
      : 1;
  } catch {
    return 1;
  }
}

/**
 * Renders a lesson's video with Cloudflare Stream. Every video requires a
 * signed playback token — minted by GET /api/stream/token/[videoUid], which
 * runs the same canViewLesson check as everything else — so this component
 * fetches its own token rather than being handed one, and shows a plain
 * denial message if that check fails (e.g. a free preview visitor whose
 * session expired mid-page).
 *
 * Used both by the learner player (trackProgress true, with resume) and by
 * the sales page's free-preview (trackProgress false, no account to save
 * progress against).
 */
export function VideoPlayer({
  lessonId,
  videoUid,
  initialPositionSeconds,
  trackProgress,
}: {
  lessonId: string;
  videoUid: string;
  /** Where to resume playback from — LessonProgress.lastPositionSeconds. */
  initialPositionSeconds: number;
  /** False for a signed-out or non-enrolled free-preview viewer: nothing to save progress against. */
  trackProgress: boolean;
}) {
  const elementRef = useRef<StreamElement | null>(null);
  const lastSaveAttemptRef = useRef(0);
  const resumedRef = useRef(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    // Reads localStorage — a browser-only external system unavailable during
    // SSR — so this has to run client-side post-mount, not in useState's
    // lazy initializer (which would also run during the server render and
    // then read a different value on the client, causing a hydration
    // mismatch on the <select>'s value).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRate(readStoredPlaybackRate());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await loadStreamEmbedScript();
        const response = await fetch(
          withBasePath(`/api/stream/token/${videoUid}`),
        );
        if (!response.ok) {
          if (!cancelled) {
            setError(
              response.status === 403
                ? "You don't have access to this video."
                : "This video isn't available right now.",
            );
          }
          return;
        }
        const data = (await response.json()) as { token: string };
        if (!cancelled) setToken(data.token);
      } catch {
        if (!cancelled) setError("This video isn't available right now.");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [videoUid]);

  function handleLoadedMetadata() {
    const el = elementRef.current;
    if (!el) return;
    el.playbackRate = rate;
    if (resumedRef.current) return;
    resumedRef.current = true;
    if (initialPositionSeconds > 0) {
      el.currentTime = initialPositionSeconds;
    }
  }

  function handleTimeUpdate() {
    if (!trackProgress) return;
    const el = elementRef.current;
    if (!el) return;
    const now = Date.now();
    if (now - lastSaveAttemptRef.current < 10_000) return;
    lastSaveAttemptRef.current = now;
    void saveLessonPositionAction(lessonId, el.currentTime);
  }

  useEffect(() => {
    const el = elementRef.current;
    return () => {
      if (!trackProgress) return;
      if (el && el.currentTime > 0) {
        void saveLessonPositionAction(lessonId, el.currentTime);
      }
    };
  }, [lessonId, trackProgress, token]);

  function handleRateChange(next: number) {
    setRate(next);
    if (elementRef.current) {
      elementRef.current.playbackRate = next;
    }
    try {
      window.localStorage.setItem(PLAYBACK_RATE_STORAGE_KEY, String(next));
    } catch {
      // Best-effort — a private browsing tab or a full storage quota just
      // means the choice doesn't persist to the next lesson.
    }
  }

  if (error) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-[var(--color-sage-pale)] px-6 text-center">
        <p className="font-body text-sm text-[var(--color-ink-muted)]">
          {error}
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-[var(--color-sage-pale)]">
        <p className="font-body text-sm text-[var(--color-ink-muted)]">
          Loading video…
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        <stream
          ref={elementRef}
          src={token}
          controls
          className="h-full w-full"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label
          htmlFor={`playback-rate-${lessonId}`}
          className="font-body text-xs text-[var(--color-ink-muted)]"
        >
          Speed
        </label>
        <select
          id={`playback-rate-${lessonId}`}
          value={rate}
          onChange={(event) => handleRateChange(Number(event.target.value))}
          className="rounded-md border border-black/10 bg-white px-2 py-1 font-body text-xs text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        >
          {PLAYBACK_RATES.map((value) => (
            <option key={value} value={value}>
              {value}x
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
