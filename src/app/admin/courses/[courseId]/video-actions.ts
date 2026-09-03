"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import {
  createDirectUploadUrl,
  generateCaptions,
  getCaptionVtt,
  getVideoStatus,
  listCaptions,
  streamConfigured,
  vttToPlainText,
} from "@/lib/video";

async function loadVideoLesson(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      videoUid: true,
      module: {
        select: { course: { select: { id: true, slug: true } } },
      },
    },
  });
  if (!lesson) {
    throw new Error("Lesson not found.");
  }
  return lesson;
}

function revalidateLessonPaths(courseId: string, courseSlug: string) {
  revalidatePath(`/admin/courses/${courseId}`);
  // A signed-in enrollee's cached lesson page should pick up the new
  // duration/transcript without waiting for the next deploy.
  revalidatePath(`/learn/${courseSlug}`, "layout");
}

export type CreateVideoUploadResult =
  | { ok: true; uploadURL: string; uid: string }
  | { ok: false; error: string };

/**
 * Requests a one-time direct-creator-upload URL from Cloudflare Stream and
 * immediately stores the returned uid on the lesson — before the browser has
 * uploaded anything — so a lesson mid-upload is already linked to it. The
 * caller POSTs the file straight to `uploadURL`; it never passes through
 * this server. Every upload is created with `requireSignedURLs`, so nothing
 * plays until GET /api/stream/token/[videoUid] mints a token for it.
 */
export async function createVideoUploadAction(
  lessonId: string,
): Promise<CreateVideoUploadResult> {
  await requireRole(Role.ADMIN);

  if (!streamConfigured) {
    return { ok: false, error: "Video isn't configured yet." };
  }

  const lesson = await loadVideoLesson(lessonId);
  const upload = await createDirectUploadUrl();

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: { videoUid: upload.uid },
  });

  revalidateLessonPaths(lesson.module.course.id, lesson.module.course.slug);

  return { ok: true, uploadURL: upload.uploadURL, uid: upload.uid };
}

export type VideoStatusResult =
  | { ok: true; readyToStream: boolean; durationSeconds: number | null }
  | { ok: false; error: string };

/**
 * Checks Stream's processing status for the lesson's current video. Once
 * ready, writes the real duration back onto the lesson and requests
 * automatic captions — a no-op if a caption track already exists, so this
 * is safe to call on every poll rather than tracking that separately.
 */
export async function checkVideoStatusAction(
  lessonId: string,
): Promise<VideoStatusResult> {
  await requireRole(Role.ADMIN);

  if (!streamConfigured) {
    return { ok: false, error: "Video isn't configured yet." };
  }

  const lesson = await loadVideoLesson(lessonId);
  if (!lesson.videoUid) {
    return { ok: false, error: "No video has been uploaded for this lesson." };
  }

  const status = await getVideoStatus(lesson.videoUid);

  if (status.readyToStream && status.durationSeconds !== null) {
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { durationSeconds: status.durationSeconds },
    });

    const captions = await listCaptions(lesson.videoUid);
    if (captions.length === 0) {
      await generateCaptions(lesson.videoUid, "en");
    }

    revalidateLessonPaths(lesson.module.course.id, lesson.module.course.slug);
  }

  return {
    ok: true,
    readyToStream: status.readyToStream,
    durationSeconds: status.durationSeconds,
  };
}

export type CaptionStatusResult =
  | { ok: true; ready: boolean; transcriptSaved: boolean }
  | { ok: false; error: string };

/**
 * Checks whether the auto-generated English captions are ready and, if so,
 * fetches the VTT and stores its plain text on Lesson.transcript — the same
 * field the lesson page already renders as a "Transcript" section, and the
 * same track the Stream Player exposes its own CC toggle from.
 */
export async function checkCaptionStatusAction(
  lessonId: string,
): Promise<CaptionStatusResult> {
  await requireRole(Role.ADMIN);

  if (!streamConfigured) {
    return { ok: false, error: "Video isn't configured yet." };
  }

  const lesson = await loadVideoLesson(lessonId);
  if (!lesson.videoUid) {
    return { ok: false, error: "No video has been uploaded for this lesson." };
  }

  const captions = await listCaptions(lesson.videoUid);
  const english = captions.find((track) => track.language === "en");

  if (!english?.generated) {
    return { ok: true, ready: false, transcriptSaved: false };
  }

  const vtt = await getCaptionVtt(lesson.videoUid, "en");
  const transcript = vttToPlainText(vtt);

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: { transcript },
  });

  revalidateLessonPaths(lesson.module.course.id, lesson.module.course.slug);

  return { ok: true, ready: true, transcriptSaved: true };
}
