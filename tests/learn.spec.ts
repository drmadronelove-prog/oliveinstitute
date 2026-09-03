import { test, expect } from "@playwright/test";
import {
  CourseStatus,
  EnrollmentSource,
  LessonType,
  PrismaClient,
  Role,
  Track,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { appPath, appUrlPattern, login } from "./helpers";

/**
 * Browser-level coverage for the learner experience: /my-courses, the
 * /learn player shell and sidebar, the canViewLesson-vs-hasAccess gating
 * split between the course-root and lesson routes, and the explicit
 * Mark complete flow (including the Enrollment.completedAt rollup on the
 * last lesson). Video playback position itself is covered at the unit/
 * integration level (progress.integration.test.ts) rather than here, since
 * there is no real video source to press play on without
 * NEXT_PUBLIC_VIDEO_EMBED_BASE configured — this suite drives the same
 * "no video host configured" state the sales page's preview shows.
 */
const prisma = new PrismaClient();
const TAG = `learn-e2e-${Date.now()}`;

const LEARNER = {
  name: "Enrolled Learner",
  email: `enrolled.${TAG}@example.test`,
  password: "learn-e2e-test-pw",
};
const STRANGER = {
  name: "Unenrolled Learner",
  email: `stranger.${TAG}@example.test`,
  password: "learn-e2e-test-pw",
};

let courseSlug = "";
let previewLessonSlug = "";
let textLessonSlug = "";

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash(LEARNER.password, 10);

  const [learner, , instructor] = await Promise.all([
    prisma.user.create({
      data: {
        name: LEARNER.name,
        email: LEARNER.email,
        passwordHash,
        role: Role.LEARNER,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: STRANGER.name,
        email: STRANGER.email,
        passwordHash,
        role: Role.LEARNER,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: `Instructor ${TAG}`,
        email: `instructor.${TAG}@example.test`,
        passwordHash: "x",
        role: Role.INSTRUCTOR,
      },
    }),
  ]);

  const course = await prisma.course.create({
    data: {
      slug: `learnable-${TAG}`,
      title: `Learnable Course ${TAG}`,
      track: Track.PUBLIC,
      priceCents: 2000,
      estimatedMinutes: 20,
      sortOrder: 0,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
    },
  });
  const courseModule = await prisma.module.create({
    data: { courseId: course.id, title: "Only module", sortOrder: 1 },
  });
  const preview = await prisma.lesson.create({
    data: {
      moduleId: courseModule.id,
      title: "Free preview lesson",
      slug: "preview",
      sortOrder: 1,
      type: LessonType.VIDEO,
      durationSeconds: 120,
      isFreePreview: true,
    },
  });
  const textLesson = await prisma.lesson.create({
    data: {
      moduleId: courseModule.id,
      title: "Text lesson",
      slug: "text-lesson",
      sortOrder: 2,
      type: LessonType.TEXT,
      body: "This is the lesson body.",
      durationSeconds: 60,
    },
  });

  await prisma.enrollment.create({
    data: {
      userId: learner.id,
      courseId: course.id,
      source: EnrollmentSource.COMP,
    },
  });

  courseSlug = course.slug;
  previewLessonSlug = preview.slug;
  textLessonSlug = textLesson.slug;
});

test.afterAll(async () => {
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

test.describe("/learn, logged out", () => {
  test("the course root sends an anonymous visitor to sign in", async ({ page }) => {
    await page.goto(appPath(`/learn/${courseSlug}`));
    await expect(page).toHaveURL(appUrlPattern("/login"));
  });

  test("a non-preview lesson bounces to the sales page", async ({ page }) => {
    await page.goto(appPath(`/learn/${courseSlug}/${textLessonSlug}`));
    await expect(page).toHaveURL(appUrlPattern(`/courses/${courseSlug}`));
  });

  test("the free preview lesson renders with no account", async ({ page }) => {
    await page.goto(appPath(`/learn/${courseSlug}/${previewLessonSlug}`));
    await expect(
      page.getByRole("heading", { name: "Free preview lesson" }),
    ).toBeVisible();
    // No progress features for an anonymous viewer.
    await expect(page.getByRole("button", { name: /mark complete/i })).toHaveCount(0);
  });
});

test.describe("/learn, signed in but not enrolled", () => {
  test("the course root bounces to the sales page instead of the player", async ({ page }) => {
    await login(page, STRANGER.email, STRANGER.password);
    await page.goto(appPath(`/learn/${courseSlug}`));
    await expect(page).toHaveURL(appUrlPattern(`/courses/${courseSlug}`));
  });
});

test.describe("/learn, enrolled", () => {
  test("continues to the first lesson, completes both, and rolls up to the enrollment", async ({
    page,
  }) => {
    await login(page, LEARNER.email, LEARNER.password);

    await page.goto(appPath("/my-courses"));
    await expect(
      page.getByRole("heading", { name: `Learnable Course ${TAG}` }),
    ).toBeVisible();
    await expect(page.getByText("0% complete")).toBeVisible();

    await page.getByRole("link", { name: /start course/i }).click();
    await expect(page).toHaveURL(
      appUrlPattern(`/learn/${courseSlug}/${previewLessonSlug}`),
    );

    await page.getByRole("button", { name: /mark complete/i }).click();
    await expect(page.getByText("Marked complete")).toBeVisible();

    // Sidebar reflects the completed lesson and lets the next lesson through.
    await page.getByRole("link", { name: /text lesson/i }).first().click();
    await expect(page).toHaveURL(
      appUrlPattern(`/learn/${courseSlug}/${textLessonSlug}`),
    );
    await expect(page.getByText("This is the lesson body.")).toBeVisible();

    await page.getByRole("button", { name: /mark complete/i }).click();
    await expect(page.getByText("Marked complete")).toBeVisible();

    const enrollment = await prisma.enrollment.findFirstOrThrow({
      where: { user: { email: LEARNER.email }, course: { slug: courseSlug } },
    });
    expect(enrollment.completedAt).not.toBeNull();

    await page.goto(appPath("/my-courses"));
    await expect(page.getByText("100% complete")).toBeVisible();
    await expect(page.getByRole("link", { name: /review course/i })).toBeVisible();
  });
});
