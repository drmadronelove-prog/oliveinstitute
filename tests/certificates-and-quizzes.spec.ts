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
import {
  appPath,
  appUrlPattern,
  clearCapturedEmails,
  login,
  waitForEmail,
} from "./helpers";

/**
 * Browser-level coverage for certificates and knowledge-check quizzes:
 * completing a course's only lesson issues a certificate, sends a
 * completion email, and the certificate page/PDF are owner-only. Quiz
 * answers reveal correctness and an explanation without affecting Mark
 * complete.
 */
const prisma = new PrismaClient();
const TAG = `cert-quiz-e2e-${Date.now()}`;

const LEARNER = {
  name: "Cert Learner",
  email: `learner.${TAG}@example.test`,
  password: "cert-e2e-test-pw",
};
const STRANGER = {
  name: "Cert Stranger",
  email: `stranger.${TAG}@example.test`,
  password: "cert-e2e-test-pw",
};

let courseSlug = "";
let lessonSlug = "";
let quizLessonSlug = "";
let enrollmentId = "";

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
      slug: `cert-quiz-${TAG}`,
      title: `Cert Quiz Course ${TAG}`,
      track: Track.CLINICIAN,
      priceCents: 2000,
      estimatedMinutes: 120,
      sortOrder: 0,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
    },
  });
  const courseModule = await prisma.module.create({
    data: { courseId: course.id, title: "Only module", sortOrder: 1 },
  });
  const lesson = await prisma.lesson.create({
    data: {
      moduleId: courseModule.id,
      title: "The one lesson",
      slug: "the-one-lesson",
      sortOrder: 1,
      type: LessonType.TEXT,
      body: "Content.",
      durationSeconds: 60,
    },
  });
  const quizLesson = await prisma.lesson.create({
    data: {
      moduleId: courseModule.id,
      title: "Knowledge check",
      slug: "knowledge-check",
      sortOrder: 2,
      type: LessonType.QUIZ,
      durationSeconds: 60,
    },
  });
  const quiz = await prisma.quiz.create({
    data: { moduleId: courseModule.id, title: "Knowledge check" },
  });
  await prisma.quizQuestion.create({
    data: {
      quizId: quiz.id,
      sortOrder: 1,
      prompt: "What is 2 + 2?",
      options: ["3", "4", "5"],
      correctIndex: 1,
      explanation: "2 + 2 is 4.",
    },
  });

  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.id,
      courseId: course.id,
      source: EnrollmentSource.COMP,
    },
  });

  courseSlug = course.slug;
  lessonSlug = lesson.slug;
  quizLessonSlug = quizLesson.slug;
  enrollmentId = enrollment.id;
});

test.afterAll(async () => {
  await prisma.quizQuestion.deleteMany({
    where: { quiz: { module: { course: { slug: { contains: TAG } } } } },
  });
  await prisma.quiz.deleteMany({
    where: { module: { course: { slug: { contains: TAG } } } },
  });
  await prisma.lessonProgress.deleteMany({
    where: { user: { email: { contains: TAG } } },
  });
  await prisma.enrollment.deleteMany({
    where: { course: { slug: { contains: TAG } } },
  });
  await prisma.course.deleteMany({ where: { slug: { contains: TAG } } });
  await prisma.user.deleteMany({ where: { email: { contains: TAG } } });
  await prisma.$disconnect();
});

test("answering a knowledge-check question reveals correctness and an explanation", async ({
  page,
}) => {
  await login(page, LEARNER.email, LEARNER.password);
  await page.goto(appPath(`/learn/${courseSlug}/${quizLessonSlug}`));

  await page.getByLabel("4").check();
  await expect(page.getByText("Correct")).toBeVisible();
  await expect(page.getByText("2 + 2 is 4.")).toBeVisible();

  // Unlimited attempts — picking a different option updates the feedback
  // rather than locking the question.
  await page.getByLabel("3").check();
  await expect(page.getByText("Not quite")).toBeVisible();

  // The quiz never gates completion — Mark complete is present regardless.
  await expect(page.getByRole("button", { name: /mark complete/i })).toBeVisible();
});

test("completing a course's last lesson issues a certificate and emails it", async ({
  page,
}) => {
  await clearCapturedEmails();
  await login(page, LEARNER.email, LEARNER.password);

  await page.goto(appPath(`/learn/${courseSlug}/${lessonSlug}`));
  await page.getByRole("button", { name: /mark complete/i }).click();
  await expect(page.getByText("Marked complete")).toBeVisible();

  await page.goto(appPath(`/learn/${courseSlug}/${quizLessonSlug}`));
  await page.getByRole("button", { name: /mark complete/i }).click();
  await expect(page.getByText("Marked complete")).toBeVisible();

  const enrollment = await prisma.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
  });
  expect(enrollment.completedAt).not.toBeNull();
  expect(enrollment.certificateIssuedAt).not.toBeNull();
  expect(enrollment.certificateStorageKey).not.toBeNull();

  const email = await waitForEmail(LEARNER.email, {
    subjectContains: "completed",
  });
  expect(email.body).toContain(`/certificates/${enrollmentId}`);

  await page.goto(appPath(`/certificates/${enrollmentId}`));
  await expect(
    page.getByRole("heading", { name: "Certificate of Completion" }),
  ).toBeVisible();
  await expect(page.getByText(LEARNER.name)).toBeVisible();
  await expect(page.getByText(/not APA-approved continuing education/i)).toBeVisible();

  const pdfResponse = await page.request.get(
    appPath(`/api/certificates/${enrollmentId}/pdf`),
  );
  expect(pdfResponse.status()).toBe(200);
  expect(pdfResponse.headers()["content-type"]).toContain("application/pdf");
});

test("the certificate is owner-only — a different learner is denied", async ({
  page,
}) => {
  await login(page, STRANGER.email, STRANGER.password);
  await page.goto(appPath(`/certificates/${enrollmentId}`));
  await expect(page.getByText("404 — Page not found")).toBeVisible();

  const pdfResponse = await page.request.get(
    appPath(`/api/certificates/${enrollmentId}/pdf`),
  );
  expect(pdfResponse.status()).toBe(403);
});

test("an anonymous visitor is sent to sign in rather than shown the certificate", async ({
  page,
}) => {
  await page.goto(appPath(`/certificates/${enrollmentId}`));
  await expect(page).toHaveURL(appUrlPattern("/login"));
});
