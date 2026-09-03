import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CourseStatus,
  EnrollmentSource,
  LessonType,
  PrismaClient,
  Role,
  Track,
} from "@prisma/client";
import {
  completionPercent,
  getLearnerCourseSummaries,
  getOrderedLessons,
  getProgressMap,
  isCourseFullyCompleted,
  markLessonComplete,
  resolveContinueLessonSlug,
  saveLessonPosition,
} from "@/lib/progress";

/**
 * Integration coverage for progress tracking. These hit a real database —
 * the interesting behavior (the position-save throttle, the completion
 * rollup into Enrollment.completedAt) is all in the query layer, so
 * stubbing Prisma would only test the stub.
 *
 * Run with `npm run test:integration`. `npm run test:unit` excludes this file.
 */
const prisma = new PrismaClient();

const TAG = `progress-test-${Date.now()}`;

type Fixture = {
  learnerId: string;
  courseAId: string;
  courseASlug: string;
  lessonA1Id: string;
  lessonA1Slug: string;
  lessonA2Id: string;
  lessonA2Slug: string;
  courseAEnrollmentId: string;
  courseBId: string;
  courseBEnrollmentId: string;
};

let f: Fixture;

async function makeUser(role: Role, label: string) {
  return prisma.user.create({
    data: {
      name: `${label} ${TAG}`,
      email: `${label}.${TAG}@example.test`,
      passwordHash: "x",
      role,
    },
  });
}

beforeAll(async () => {
  const instructor = await makeUser(Role.INSTRUCTOR, "instructor");
  const learner = await makeUser(Role.LEARNER, "learner");

  // Course A: two lessons, for completion-rollup and resume tests.
  const courseA = await prisma.course.create({
    data: {
      slug: `course-a-${TAG}`,
      title: "Course A",
      track: Track.PUBLIC,
      priceCents: 1000,
      estimatedMinutes: 30,
      sortOrder: 0,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
    },
  });
  const moduleA = await prisma.module.create({
    data: { courseId: courseA.id, title: "Module A", sortOrder: 1 },
  });
  const lessonA1 = await prisma.lesson.create({
    data: {
      moduleId: moduleA.id,
      title: "Lesson A1",
      slug: "a1",
      sortOrder: 1,
      type: LessonType.VIDEO,
      durationSeconds: 60,
    },
  });
  const lessonA2 = await prisma.lesson.create({
    data: {
      moduleId: moduleA.id,
      title: "Lesson A2",
      slug: "a2",
      sortOrder: 2,
      type: LessonType.VIDEO,
      durationSeconds: 60,
    },
  });

  // Course B: one lesson, no progress — its enrollment's recency comes
  // entirely from grantedAt, which getLearnerCourseSummaries's sort exercises.
  const courseB = await prisma.course.create({
    data: {
      slug: `course-b-${TAG}`,
      title: "Course B",
      track: Track.PUBLIC,
      priceCents: 1000,
      estimatedMinutes: 15,
      sortOrder: 0,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
    },
  });
  const moduleB = await prisma.module.create({
    data: { courseId: courseB.id, title: "Module B", sortOrder: 1 },
  });
  await prisma.lesson.create({
    data: {
      moduleId: moduleB.id,
      title: "Lesson B1",
      slug: "b1",
      sortOrder: 1,
      type: LessonType.TEXT,
      durationSeconds: 60,
      body: "Hello",
    },
  });

  // B granted first (further in the past), A granted after — the summary
  // sort should start with A by grantedAt alone, before any progress exists.
  const courseBEnrollment = await prisma.enrollment.create({
    data: {
      userId: learner.id,
      courseId: courseB.id,
      source: EnrollmentSource.COMP,
      grantedAt: new Date(Date.now() - 60_000),
    },
  });
  const courseAEnrollment = await prisma.enrollment.create({
    data: {
      userId: learner.id,
      courseId: courseA.id,
      source: EnrollmentSource.COMP,
      grantedAt: new Date(Date.now() - 30_000),
    },
  });

  f = {
    learnerId: learner.id,
    courseAId: courseA.id,
    courseASlug: courseA.slug,
    lessonA1Id: lessonA1.id,
    lessonA1Slug: lessonA1.slug,
    lessonA2Id: lessonA2.id,
    lessonA2Slug: lessonA2.slug,
    courseAEnrollmentId: courseAEnrollment.id,
    courseBId: courseB.id,
    courseBEnrollmentId: courseBEnrollment.id,
  };
});

afterAll(async () => {
  await prisma.lessonProgress.deleteMany({
    where: { user: { email: { contains: TAG } } },
  });
  await prisma.enrollment.deleteMany({
    where: { user: { email: { contains: TAG } } },
  });
  await prisma.course.deleteMany({ where: { slug: { contains: TAG } } });
  await prisma.user.deleteMany({ where: { email: { contains: TAG } } });
  await prisma.$disconnect();
});

describe("completionPercent", () => {
  it("is 0 for a course with no lessons, not NaN", () => {
    expect(completionPercent(0, 0)).toBe(0);
  });

  it("rounds to the nearest whole percent", () => {
    expect(completionPercent(1, 3)).toBe(33);
    expect(completionPercent(2, 3)).toBe(67);
  });
});

describe("getOrderedLessons", () => {
  it("orders by module sortOrder then lesson sortOrder", async () => {
    const lessons = await getOrderedLessons(f.courseAId);
    expect(lessons.map((l) => l.slug)).toEqual([
      f.lessonA1Slug,
      f.lessonA2Slug,
    ]);
  });
});

describe("getProgressMap", () => {
  it("returns an empty map for an empty lesson list", async () => {
    expect(await getProgressMap(f.learnerId, [])).toEqual(new Map());
  });
});

describe("resolveContinueLessonSlug", () => {
  it("falls back to the first lesson when there's no progress yet", async () => {
    expect(await resolveContinueLessonSlug(f.learnerId, f.courseAId)).toBe(
      f.lessonA1Slug,
    );
  });

  it("follows the most recently touched lesson once there is progress", async () => {
    await saveLessonPosition(f.learnerId, f.lessonA2Id, 10);
    expect(await resolveContinueLessonSlug(f.learnerId, f.courseAId)).toBe(
      f.lessonA2Slug,
    );
  });
});

describe("saveLessonPosition throttling", () => {
  it("saves the first position write", async () => {
    const result = await saveLessonPosition(f.learnerId, f.lessonA1Id, 5);
    expect(result.saved).toBe(true);

    const map = await getProgressMap(f.learnerId, [f.lessonA1Id]);
    expect(map.get(f.lessonA1Id)?.lastPositionSeconds).toBe(5);
  });

  it("drops a second write inside the ten-second window", async () => {
    const result = await saveLessonPosition(f.learnerId, f.lessonA1Id, 42);
    expect(result.saved).toBe(false);

    const map = await getProgressMap(f.learnerId, [f.lessonA1Id]);
    // Unchanged — the throttled write never reached the database.
    expect(map.get(f.lessonA1Id)?.lastPositionSeconds).toBe(5);
  });

  it("allows a write again once the throttle window has passed", async () => {
    // Backdate the row directly rather than waiting ten real seconds.
    await prisma.$executeRaw`
      UPDATE "lesson_progress"
      SET "updatedAt" = NOW() - INTERVAL '11 seconds'
      WHERE "userId" = ${f.learnerId} AND "lessonId" = ${f.lessonA1Id}
    `;

    const result = await saveLessonPosition(f.learnerId, f.lessonA1Id, 42);
    expect(result.saved).toBe(true);

    const map = await getProgressMap(f.learnerId, [f.lessonA1Id]);
    expect(map.get(f.lessonA1Id)?.lastPositionSeconds).toBe(42);
  });

  it("never touches completedAt", async () => {
    await markLessonComplete(f.learnerId, f.lessonA1Id, f.courseAId);
    await prisma.$executeRaw`
      UPDATE "lesson_progress"
      SET "updatedAt" = NOW() - INTERVAL '11 seconds'
      WHERE "userId" = ${f.learnerId} AND "lessonId" = ${f.lessonA1Id}
    `;

    await saveLessonPosition(f.learnerId, f.lessonA1Id, 99);

    const map = await getProgressMap(f.learnerId, [f.lessonA1Id]);
    expect(map.get(f.lessonA1Id)?.completedAt).not.toBeNull();
  });
});

describe("markLessonComplete and isCourseFullyCompleted", () => {
  it("does not complete the course until every lesson is marked", async () => {
    // lessonA1 is already complete from the throttling suite above;
    // lessonA2 is not yet.
    expect(await isCourseFullyCompleted(f.learnerId, f.courseAId)).toBe(
      false,
    );
    const enrollment = await prisma.enrollment.findUniqueOrThrow({
      where: { id: f.courseAEnrollmentId },
    });
    expect(enrollment.completedAt).toBeNull();
  });

  it("stamps Enrollment.completedAt once the last lesson is marked complete", async () => {
    await markLessonComplete(f.learnerId, f.lessonA2Id, f.courseAId);

    expect(await isCourseFullyCompleted(f.learnerId, f.courseAId)).toBe(true);
    const enrollment = await prisma.enrollment.findUniqueOrThrow({
      where: { id: f.courseAEnrollmentId },
    });
    expect(enrollment.completedAt).not.toBeNull();
  });
});

describe("getLearnerCourseSummaries", () => {
  it("computes percent complete and sorts by most recently active", async () => {
    const summaries = await getLearnerCourseSummaries(f.learnerId);
    const bySlug = new Map(summaries.map((s) => [s.courseSlug, s]));

    const courseA = bySlug.get(f.courseASlug);
    expect(courseA?.totalLessons).toBe(2);
    expect(courseA?.completedLessons).toBe(2);
    expect(courseA?.percent).toBe(100);

    // Course A has real LessonProgress activity from the earlier suites;
    // Course B has none, so it falls back to grantedAt — which was set
    // further in the past. A's activity should sort it first regardless.
    expect(summaries[0]?.courseSlug).toBe(f.courseASlug);
  });
});
