"use client";

import { useEffect, useRef } from "react";
import { saveLessonPositionAction } from "@/app/learn/[courseSlug]/[lessonSlug]/actions";

/**
 * Video host base, e.g. "https://player.example.com/embed" — a lesson's
 * `videoUid` is appended to it. This is the same env var the marketing
 * `LessonPreview` component uses for an iframe `src`. The learner player
 * needs actual playback position (`timeupdate`), which an opaque iframe
 * can't report without a provider-specific postMessage protocol this app
 * doesn't have, so this component instead treats the resolved URL as
 * directly playable media in a native `<video>` element. No provider has
 * been chosen yet (see README/CLAUDE.md), so this is a documented
 * assumption to revisit once one is: it may need its own env var if the
 * chosen provider's playback URL differs from its embed URL.
 */
const VIDEO_BASE = process.env.NEXT_PUBLIC_VIDEO_EMBED_BASE?.replace(
  /\/$/,
  "",
);

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaveAttemptRef = useRef(0);
  const resumedRef = useRef(false);

  const src = VIDEO_BASE ? `${VIDEO_BASE}/${videoUid}` : null;

  function handleLoadedMetadata() {
    if (resumedRef.current) return;
    resumedRef.current = true;
    const video = videoRef.current;
    if (video && initialPositionSeconds > 0) {
      video.currentTime = initialPositionSeconds;
    }
  }

  // Fires continuously during playback — throttled client-side as a
  // courtesy, and enforced authoritatively inside the server action itself,
  // which drops any save less than ten seconds after the last one it wrote.
  function handleTimeUpdate() {
    if (!trackProgress) return;
    const video = videoRef.current;
    if (!video) return;
    const now = Date.now();
    if (now - lastSaveAttemptRef.current < 10_000) return;
    lastSaveAttemptRef.current = now;
    void saveLessonPositionAction(lessonId, video.currentTime);
  }

  // Flush the position once on the way out, so a pause-and-leave shortly
  // after the last save isn't lost. The server's own throttle still applies.
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (!trackProgress) return;
      if (video && video.currentTime > 0) {
        void saveLessonPositionAction(lessonId, video.currentTime);
      }
    };
  }, [lessonId, trackProgress]);

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-[var(--color-sage-pale)] px-6 text-center">
        <p className="font-body text-sm text-[var(--color-ink-muted)]">
          This lesson has no video host configured yet. Set{" "}
          <code>NEXT_PUBLIC_VIDEO_EMBED_BASE</code> to play it here.
        </p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      className="aspect-video w-full rounded-lg bg-black"
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
    />
  );
}
