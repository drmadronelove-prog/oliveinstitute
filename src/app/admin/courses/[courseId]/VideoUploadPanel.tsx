"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/format";
import {
  checkCaptionStatusAction,
  checkVideoStatusAction,
  createVideoUploadAction,
} from "./video-actions";

/** Bounded auto-poll: ~4s apart, up to 45 tries (~3 minutes) before falling back to a manual "Check now". */
const POLL_INTERVAL_MS = 4_000;
const MAX_POLL_ATTEMPTS = 45;

type Phase =
  | "idle"
  | "requesting"
  | "uploading"
  | "processing"
  | "captioning"
  | "ready"
  | "error";

export function VideoUploadPanel({
  lessonId,
  initialVideoUid,
  initialDurationSeconds,
  hasTranscript,
  streamConfigured,
}: {
  lessonId: string;
  initialVideoUid: string | null;
  initialDurationSeconds: number;
  hasTranscript: boolean;
  streamConfigured: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(
    initialVideoUid ? "ready" : "idle",
  );
  const [durationSeconds, setDurationSeconds] = useState(
    initialDurationSeconds,
  );
  const [transcriptSaved, setTranscriptSaved] = useState(hasTranscript);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  async function pollVideoStatus(attempt: number) {
    if (cancelledRef.current) return;

    const result = await checkVideoStatusAction(lessonId);
    if (cancelledRef.current) return;

    if (!result.ok) {
      setPhase("error");
      setMessage(result.error);
      return;
    }

    if (result.readyToStream && result.durationSeconds !== null) {
      setDurationSeconds(result.durationSeconds);
      setPhase("captioning");
      setMessage(null);
      void pollCaptionStatus(0);
      return;
    }

    if (attempt >= MAX_POLL_ATTEMPTS) {
      setPhase("processing");
      setMessage(
        "Still processing after a few minutes — this can take a while for a longer video. Check again shortly.",
      );
      return;
    }

    setTimeout(() => void pollVideoStatus(attempt + 1), POLL_INTERVAL_MS);
  }

  async function pollCaptionStatus(attempt: number) {
    if (cancelledRef.current) return;

    const result = await checkCaptionStatusAction(lessonId);
    if (cancelledRef.current) return;

    if (!result.ok) {
      // Captions are a bonus on top of a video that already plays — don't
      // block on them.
      setPhase("ready");
      setMessage(`Video is ready. Captions could not be checked: ${result.error}`);
      return;
    }

    if (result.ready) {
      setTranscriptSaved(result.transcriptSaved);
      setPhase("ready");
      setMessage(null);
      return;
    }

    if (attempt >= MAX_POLL_ATTEMPTS) {
      setPhase("ready");
      setMessage("Video is ready. Captions are still processing — check again later.");
      return;
    }

    setTimeout(() => void pollCaptionStatus(attempt + 1), POLL_INTERVAL_MS);
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPhase("requesting");
    setMessage(null);

    const uploadResult = await createVideoUploadAction(lessonId);
    if (!uploadResult.ok) {
      setPhase("error");
      setMessage(uploadResult.error);
      return;
    }

    setPhase("uploading");

    try {
      const body = new FormData();
      body.append("file", file);
      // Straight to Cloudflare — this request never touches our server.
      const response = await fetch(uploadResult.uploadURL, {
        method: "POST",
        body,
      });
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
    } catch {
      setPhase("error");
      setMessage("The upload to Cloudflare failed. Try again.");
      return;
    }

    setPhase("processing");
    void pollVideoStatus(0);
  }

  if (!streamConfigured) {
    return (
      <p className="font-body text-xs text-[var(--color-ink-muted)]">
        Video isn&apos;t configured yet — set CLOUDFLARE_ACCOUNT_ID and
        CLOUDFLARE_STREAM_TOKEN to enable uploads.
      </p>
    );
  }

  const busy =
    phase === "requesting" ||
    phase === "uploading" ||
    phase === "processing" ||
    phase === "captioning";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor={`video-upload-${lessonId}`}>
          Choose a video file
        </label>
        <input
          ref={fileInputRef}
          id={`video-upload-${lessonId}`}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={busy}
          className="hidden"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md border border-black/10 bg-white px-3 py-1.5 font-body text-xs font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-sage-pale)] disabled:opacity-60"
        >
          {phase === "idle" || phase === "error"
            ? "Upload video"
            : phase === "ready"
              ? "Replace video"
              : "Uploading…"}
        </button>

        {phase === "ready" ? (
          <span className="font-body text-xs text-[var(--color-ink-muted)]">
            {formatDuration(durationSeconds)} &middot;{" "}
            {transcriptSaved ? "Transcript saved" : "No transcript yet"}
          </span>
        ) : null}

        {phase === "requesting" ? (
          <span className="font-body text-xs text-[var(--color-ink-muted)]">
            Preparing upload…
          </span>
        ) : null}
        {phase === "processing" ? (
          <span className="font-body text-xs text-[var(--color-ink-muted)]">
            Processing…
          </span>
        ) : null}
        {phase === "captioning" ? (
          <span className="font-body text-xs text-[var(--color-ink-muted)]">
            Generating captions…
          </span>
        ) : null}

        {phase === "processing" || phase === "error" ? (
          <button
            type="button"
            onClick={() => {
              setPhase("processing");
              setMessage(null);
              void pollVideoStatus(0);
            }}
            className="font-body text-xs text-[var(--color-olive)] underline underline-offset-2"
          >
            Check now
          </button>
        ) : null}
      </div>

      {message ? (
        <p className="font-body text-xs text-[var(--color-ink-muted)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
