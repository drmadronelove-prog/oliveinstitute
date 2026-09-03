import type { LessonType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { issueCertificate } from "@/lib/certificate";
import {
  findRecommendedNextCourse,
  sendCourseCompletionEmail,
} from "@/lib/completionEmails";

/**
 * Progress tracking: how far a learner has gotten through a course, and
 * where "continue where you left off" should take them.
 *
 * Completion is always explicit — a `LessonProgress.completedAt` is only
 * ever set by the learner's own "Mark complete" action, never inferred from
 * playback (there is no autoplay/auto-advance in this app, by design).
 */

export type OrderedLesson = {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
  type: LessonType;
  durationSeconds: number;
  moduleId: string;
  moduleTitle: string;
  moduleSortOrder: number;
};

/** Every lesson in a course, flattened and ordered the way the player and sidebar walk them: module sortOrder, then lesson sortOrder. */
export async function getOrderedLessons(
  courseId: string,
): Promise<OrderedLesson[]> {
  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      sortOrder: true,
      lessons: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
          sortOrder: true,
          type: true,
          durationSeconds: true,
        },
      },
    },
  });

  return modules.flatMap((courseModule) =>
    courseModule.lessons.map((lesson) => ({
      ...lesson,
      moduleId: courseModule.id,
      moduleTitle: courseModule.title,
      moduleSortOrder: courseModule.sortOrder,
    })),
  );
}

export type ProgressRow = {
  completedAt: Date | null;
  lastPositionSeconds: number;
  updatedAt: Date;
};

/** This user's progress on a specific set of lessons, keyed by lessonId. */
export async function getProgressMap(
  userId: string,
  lessonIds: string[],
): Promise<Map<string, ProgressRow>> {
  if (lessonIds.length === 0) return new Map();

  const rows = await prisma.lessonProgress.findMany({
    where: { userId, lessonId: { in: lessonIds } },
    select: {
      lessonId: true,
      completedAt: true,
      lastPositionSeconds: true,
      updatedAt: true,
    },
  });

  return new Map(rows.map((row) => [row.lessonId, row]));
}

/** 0–100. 0 for a course with no lessons, rather than dividing by zero. */
export function completionPercent(
  completedCount: number,
  totalCount: number,
): number {
  if (totalCount <= 0) return 0;
  return Math.round((completedCount / totalCount) * 100);
}

/**
 * The lesson `/learn/[courseSlug]` should send a learner to: whichever
 * lesson they most recently touched (by `LessonProgress.updatedAt`, so
 * either watched or marked complete), or the first lesson in course order
 * if they have never opened one. Null only for a course with zero lessons.
 */
export async function resolveContinueLessonSlug(
  userId: string,
  courseId: string,
): Promise<string | null> {
  const lessons = await getOrderedLessons(courseId);
  if (lessons.length === 0) return null;

  const mostRecent = await prisma.lessonProgress.findFirst({
    where: { userId, lesson: { module: { courseId } } },
    orderBy: { updatedAt: "desc" },
    select: { lesson: { select: { slug: true } } },
  });

  return mostRecent?.lesson.slug ?? lessons[0].slug;
}

export type LearnerCourseSummary = {
  enrollmentId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  estimatedMinutes: number;
  completedAt: Date | null;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  /** What "most recently accessed" is sorted by — real activity if any, else when access was granted. */
  lastActivityAt: Date;
};

/** Everything /my-courses needs, for every course a user is enrolled in, sorted most-recently-active first. */
export async function getLearnerCourseSummaries(
  userId: string,
): Promise<LearnerCourseSummary[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          estimatedMinutes: true,
          modules: { select: { lessons: { select: { id: true } } } },
        },
      },
    },
  });

  if (enrollments.length === 0) return [];

  const courseIds = enrollments.map((e) => e.course.id);

  // One query for every course's progress rows, grouped below, rather than
  // one query per enrolled course.
  const progressRows = await prisma.lessonProgress.findMany({
    where: { userId, lesson: { module: { courseId: { in: courseIds } } } },
    select: {
      completedAt: true,
      updatedAt: true,
      lesson: { select: { module: { select: { courseId: true } } } },
    },
  });

  const progressByCourse = new Map<
    string,
    { completed: number; lastActivityAt: Date }
  >();
  for (const row of progressRows) {
    const courseId = row.lesson.module.courseId;
    const bucket = progressByCourse.get(courseId) ?? {
      completed: 0,
      lastActivityAt: row.updatedAt,
    };
    if (row.completedAt) bucket.completed += 1;
    if (row.updatedAt > bucket.lastActivityAt) {
      bucket.lastActivityAt = row.updatedAt;
    }
    progressByCourse.set(courseId, bucket);
  }

  const summaries = enrollments.map((enrollment) => {
    const totalLessons = enrollment.course.modules.reduce(
      (sum, m) => sum + m.lessons.length,
      0,
    );
    const activity = progressByCourse.get(enrollment.course.id);

    return {
      enrollmentId: enrollment.id,
      courseId: enrollment.course.id,
      courseSlug: enrollment.course.slug,
      courseTitle: enrollment.course.title,
      estimatedMinutes: enrollment.course.estimatedMinutes,
      completedAt: enrollment.completedAt,
      totalLessons,
      completedLessons: activity?.completed ?? 0,
      percent: completionPercent(activity?.completed ?? 0, totalLessons),
      lastActivityAt: activity?.lastActivityAt ?? enrollment.grantedAt,
    };
  });

  return summaries.sort(
    (a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime(),
  );
}

/** Whether every lesson in a course is complete for this user. */
export async function isCourseFullyCompleted(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const lessons = await getOrderedLessons(courseId);
  if (lessons.length === 0) return false;

  const completedCount = await prisma.lessonProgress.count({
    where: {
      userId,
      completedAt: { not: null },
      lessonId: { in: lessons.map((l) => l.id) },
    },
  });

  return completedCount >= lessons.length;
}

/**
 * Explicit, learner-initiated completion — never inferred from playback.
 * When this finishes the last incomplete lesson in the course, it also
 * stamps Enrollment.completedAt. The caller (a Server Action) is
 * responsible for authenticating the caller and checking canViewLesson
 * first; this function trusts the userId/lessonId/courseId it's given.
 */
export async function markLessonComplete(
  userId: string,
  lessonId: string,
  courseId: string,
): Promise<void> {
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { completedAt: new Date() },
    create: { userId, lessonId, completedAt: new Date() },
  });

  if (!(await isCourseFullyCompleted(userId, courseId))) return;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: {
      id: true,
      completedAt: true,
      user: { select: { name: true, email: true } },
      course: { select: { title: true, track: true } },
    },
  });
  // Already completed (a second lesson finishing after the course was
  // already done, e.g. re-marking one) — nothing new to do.
  if (!enrollment || enrollment.completedAt) return;

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { completedAt: new Date() },
  });

  // Best-effort: a certificate or email hiccup should never turn the
  // learner's own "Mark complete" click into a failure. The enrollment is
  // already completed above, regardless of what happens here.
  try {
    await issueCertificate(enrollment.id);
    const nextCourse = await findRecommendedNextCourse(
      userId,
      enrollment.course.track,
      courseId,
    );
    await sendCourseCompletionEmail({
      to: enrollment.user.email,
      name: enrollment.user.name,
      courseTitle: enrollment.course.title,
      enrollmentId: enrollment.id,
      nextCourse,
    });
  } catch (error) {
    console.error("Course completion side effects failed", error);
  }
}

/** Position saves this fresh (or fresher) are dropped rather than written again. */
export const POSITION_SAVE_THROTTLE_MS = 10_000;

/**
 * Persists video playback position, throttled server-side (not just by the
 * caller) so a runaway client can't write more than once every ten seconds.
 * Never touches completedAt — completion is a separate, explicit action.
 */
export async function saveLessonPosition(
  userId: string,
  lessonId: string,
  positionSeconds: number,
): Promise<{ saved: boolean }> {
  const position = Math.max(0, Math.trunc(positionSeconds));

  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { updatedAt: true },
  });

  if (
    existing &&
    Date.now() - existing.updatedAt.getTime() < POSITION_SAVE_THROTTLE_MS
  ) {
    return { saved: false };
  }

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { lastPositionSeconds: position },
    create: { userId, lessonId, lastPositionSeconds: position },
  });

  return { saved: true };
}
