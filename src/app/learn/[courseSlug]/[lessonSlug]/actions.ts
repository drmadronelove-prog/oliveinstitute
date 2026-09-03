"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { canViewLesson } from "@/lib/entitlements";
import { markLessonComplete, saveLessonPosition } from "@/lib/progress";

async function loadLessonCourse(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      module: {
        select: { courseId: true, course: { select: { slug: true } } },
      },
    },
  });
  if (!lesson) return null;
  return {
    courseId: lesson.module.courseId,
    courseSlug: lesson.module.course.slug,
  };
}

/**
 * Thin wrapper: authenticate, check the entitlement, then delegate to the
 * plain functions in src/lib/progress.ts (which is what's actually under
 * test — a Server Action can't easily be unit tested outside a request).
 */
export async function markLessonCompleteAction(lessonId: string) {
  const session = await requireSession();

  const lessonCourse = await loadLessonCourse(lessonId);
  if (!lessonCourse) {
    throw new Error("Lesson not found");
  }

  const allowed = await canViewLesson(session.user.id, lessonId);
  if (!allowed) {
    throw new Error("Not authorized to view this lesson");
  }

  await markLessonComplete(session.user.id, lessonId, lessonCourse.courseId);

  revalidatePath(`/learn/${lessonCourse.courseSlug}`, "layout");
}

export async function saveLessonPositionAction(
  lessonId: string,
  positionSeconds: number,
) {
  const session = await requireSession();

  const allowed = await canViewLesson(session.user.id, lessonId);
  if (!allowed) {
    throw new Error("Not authorized to view this lesson");
  }

  return saveLessonPosition(session.user.id, lessonId, positionSeconds);
}
