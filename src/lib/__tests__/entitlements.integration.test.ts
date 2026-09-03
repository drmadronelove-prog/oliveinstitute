import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CourseStatus,
  EnrollmentSource,
  LessonType,
  PrismaClient,
  Role,
  Track,
} from "@prisma/client";
import { canViewLesson, hasAccess } from "@/lib/entitlements";

/**
 * Integration coverage for the access rules. These hit a real database —
 * the rules are all queries, so stubbing them would only test the stub.
 *
 * Run with `npm run test:integration`, which needs DATABASE_URL pointing at a
 * migrated database. `npm run test:unit` excludes this file.
 */
const prisma = new PrismaClient();

const TAG = `entitlements-test-${Date.now()}`;

type Fixture = {
  adminId: string;
  instructorId: string;
  otherInstructorId: string;
  enrolledLearnerId: string;
  strangerId: string;
  publishedCourseId: string;
  draftCourseId: string;
  archivedCourseId: string;
  previewLessonId: string;
  paidLessonId: string;
  draftPreviewLessonId: string;
  archivedLessonId: string;
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

async function makeCourse(
  slug: string,
  status: CourseStatus,
  instructorId: string,
) {
  const course = await prisma.course.create({
    data: {
      slug: `${slug}-${TAG}`,
      title: slug,
      track: Track.PUBLIC,
      priceCents: 1000,
      estimatedMinutes: 60,
      sortOrder: 0,
      status,
      instructorId,
    },
  });
  const courseModule = await prisma.module.create({
    data: { courseId: course.id, title: "Module 1", sortOrder: 1 },
  });
  const preview = await prisma.lesson.create({
    data: {
      moduleId: courseModule.id,
      title: "Preview",
      slug: "preview",
      sortOrder: 1,
      type: LessonType.VIDEO,
      durationSeconds: 60,
      isFreePreview: true,
    },
  });
  const paid = await prisma.lesson.create({
    data: {
      moduleId: courseModule.id,
      title: "Paid",
      slug: "paid",
      sortOrder: 2,
      type: LessonType.VIDEO,
      durationSeconds: 60,
    },
  });
  return { course, preview, paid };
}

beforeAll(async () => {
  const [admin, instructor, otherInstructor, learner, stranger] =
    await Promise.all([
      makeUser(Role.ADMIN, "admin"),
      makeUser(Role.INSTRUCTOR, "instructor"),
      makeUser(Role.INSTRUCTOR, "other-instructor"),
      makeUser(Role.LEARNER, "learner"),
      makeUser(Role.LEARNER, "stranger"),
    ]);

  const published = await makeCourse(
    "published",
    CourseStatus.PUBLISHED,
    instructor.id,
  );
  const draft = await makeCourse("draft", CourseStatus.DRAFT, instructor.id);
  const archived = await makeCourse(
    "archived",
    CourseStatus.ARCHIVED,
    instructor.id,
  );

  await prisma.enrollment.createMany({
    data: [
      {
        userId: learner.id,
        courseId: published.course.id,
        source: EnrollmentSource.PURCHASE,
      },
      {
        userId: learner.id,
        courseId: draft.course.id,
        source: EnrollmentSource.COMP,
      },
      {
        userId: learner.id,
        courseId: archived.course.id,
        source: EnrollmentSource.PURCHASE,
      },
    ],
  });

  f = {
    adminId: admin.id,
    instructorId: instructor.id,
    otherInstructorId: otherInstructor.id,
    enrolledLearnerId: learner.id,
    strangerId: stranger.id,
    publishedCourseId: published.course.id,
    draftCourseId: draft.course.id,
    archivedCourseId: archived.course.id,
    previewLessonId: published.preview.id,
    paidLessonId: published.paid.id,
    draftPreviewLessonId: draft.preview.id,
    archivedLessonId: archived.paid.id,
  };
});

afterAll(async () => {
  await prisma.enrollment.deleteMany({
    where: { user: { email: { contains: TAG } } },
  });
  await prisma.course.deleteMany({ where: { slug: { contains: TAG } } });
  await prisma.user.deleteMany({ where: { email: { contains: TAG } } });
  await prisma.$disconnect();
});

describe("hasAccess", () => {
  it("lets an admin into any course, including a draft", async () => {
    expect(await hasAccess(f.adminId, f.publishedCourseId)).toBe(true);
    expect(await hasAccess(f.adminId, f.draftCourseId)).toBe(true);
  });

  it("lets a course's own instructor in, including its draft", async () => {
    expect(await hasAccess(f.instructorId, f.publishedCourseId)).toBe(true);
    expect(await hasAccess(f.instructorId, f.draftCourseId)).toBe(true);
  });

  it("keeps a different instructor out", async () => {
    expect(await hasAccess(f.otherInstructorId, f.publishedCourseId)).toBe(
      false,
    );
  });

  it("lets an enrolled learner into a published course", async () => {
    expect(await hasAccess(f.enrolledLearnerId, f.publishedCourseId)).toBe(true);
  });

  it("keeps an enrolled learner out of a draft", async () => {
    expect(await hasAccess(f.enrolledLearnerId, f.draftCourseId)).toBe(false);
  });

  it("keeps an enrolled learner in an archived course", async () => {
    expect(await hasAccess(f.enrolledLearnerId, f.archivedCourseId)).toBe(true);
  });

  it("keeps an unenrolled learner out", async () => {
    expect(await hasAccess(f.strangerId, f.publishedCourseId)).toBe(false);
  });

  it("denies unknown users and courses rather than throwing", async () => {
    expect(await hasAccess("nope", f.publishedCourseId)).toBe(false);
    expect(await hasAccess(f.adminId, "nope")).toBe(false);
    expect(await hasAccess("", "")).toBe(false);
  });
});

describe("canViewLesson", () => {
  it("opens a free preview on a published course to anyone signed in", async () => {
    expect(await canViewLesson(f.strangerId, f.previewLessonId)).toBe(true);
  });

  it("keeps a non-preview lesson closed to an unenrolled learner", async () => {
    expect(await canViewLesson(f.strangerId, f.paidLessonId)).toBe(false);
  });

  it("does not leak a draft course's preview", async () => {
    expect(await canViewLesson(f.strangerId, f.draftPreviewLessonId)).toBe(
      false,
    );
  });

  it("opens every lesson to an enrolled learner", async () => {
    expect(await canViewLesson(f.enrolledLearnerId, f.paidLessonId)).toBe(true);
    expect(await canViewLesson(f.enrolledLearnerId, f.archivedLessonId)).toBe(
      true,
    );
  });

  it("opens a draft's lessons to its instructor and to an admin", async () => {
    expect(await canViewLesson(f.instructorId, f.draftPreviewLessonId)).toBe(
      true,
    );
    expect(await canViewLesson(f.adminId, f.draftPreviewLessonId)).toBe(true);
  });

  it("denies an unknown lesson rather than throwing", async () => {
    expect(await canViewLesson(f.adminId, "nope")).toBe(false);
  });
});

describe("canViewLesson, logged out", () => {
  it("opens a free preview on a published course", async () => {
    expect(await canViewLesson(null, f.previewLessonId)).toBe(true);
  });

  it("keeps every other lesson closed", async () => {
    expect(await canViewLesson(null, f.paidLessonId)).toBe(false);
    expect(await canViewLesson(null, f.archivedLessonId)).toBe(false);
  });

  it("does not leak a draft course's preview", async () => {
    expect(await canViewLesson(null, f.draftPreviewLessonId)).toBe(false);
  });

  it("denies an unknown lesson rather than throwing", async () => {
    expect(await canViewLesson(null, "nope")).toBe(false);
    expect(await canViewLesson(null, "")).toBe(false);
  });
});
