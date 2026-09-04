import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  CourseStatus,
  EnrollmentSource,
  PrismaClient,
  Role,
  Track,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { appPath, login, SEEDED_ADMIN } from "./helpers";

/**
 * axe-core scans across one representative page of every kind the app
 * serves: public storefront, the auth/legal pages, the learner experience
 * (including a text lesson, a quiz lesson, and an issued certificate), and
 * the admin authoring tool. Two already-seeded PUBLISHED courses
 * (`steadier-ground`, PUBLIC; `trauma-informed-care-foundations`,
 * CLINICIAN) stand in for the two track disclaimers rather than creating
 * new fixtures for something the seed already provides.
 */
const prisma = new PrismaClient();
const TAG = `a11y-${Date.now()}`;

const LEARNER = {
  name: "A11y Learner",
  email: `learner.${TAG}@example.test`,
  password: "a11y-test-pw",
};

const PUBLIC_SLUG = "steadier-ground";
const CLINICIAN_SLUG = "trauma-informed-care-foundations";
const TEXT_LESSON_SLUG = "core-principles";
const QUIZ_LESSON_SLUG = "knowledge-check";

let clinicianCourseId = "";
let certEnrollmentId = "";

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash(LEARNER.password, 10);
  const learner = await prisma.user.create({
    data: {
      name: LEARNER.name,
      email: LEARNER.email,
      passwordHash,
      role: Role.LEARNER,
      emailVerifiedAt: new Date(),
    },
  });
  const instructor = await prisma.user.create({
    data: {
      name: `Instructor ${TAG}`,
      email: `instructor.${TAG}@example.test`,
      passwordHash: "x",
      role: Role.INSTRUCTOR,
    },
  });

  // A throwaway already-completed course, just to have a certificate to scan.
  const certCourse = await prisma.course.create({
    data: {
      slug: `a11y-cert-${TAG}`,
      title: `A11y Certificate Course ${TAG}`,
      track: Track.PUBLIC,
      priceCents: 1000,
      estimatedMinutes: 30,
      sortOrder: 0,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
    },
  });
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.id,
      courseId: certCourse.id,
      source: EnrollmentSource.COMP,
      completedAt: new Date(),
    },
  });
  certEnrollmentId = enrollment.id;

  const clinicianCourse = await prisma.course.findUniqueOrThrow({
    where: { slug: CLINICIAN_SLUG },
    select: { id: true },
  });
  clinicianCourseId = clinicianCourse.id;

  // Real access to the seeded CLINICIAN course, to scan the learner-side
  // pages (course overview, a text lesson, a quiz lesson) with something
  // real to render rather than an empty/locked state.
  await prisma.enrollment.create({
    data: {
      userId: learner.id,
      courseId: clinicianCourseId,
      source: EnrollmentSource.COMP,
    },
  });
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

async function expectNoViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).analyze();
  if (results.violations.length > 0) {
    const report = results.violations
      .map(
        (v) =>
          `  ${v.id} (${v.impact}): ${v.help}\n` +
          v.nodes.map((n) => `    - ${n.target.join(" ")}`).join("\n"),
      )
      .join("\n");
    console.log(`\naxe violations on ${label}:\n${report}`);
  }
  expect(results.violations, `axe violations on ${label}`).toEqual([]);
}

test.describe("accessibility: public pages", () => {
  const paths = [
    "/",
    "/explore",
    "/clinicians",
    "/terms",
    "/privacy",
    "/refunds",
    "/login",
    "/register",
    "/forgot-password",
    `/courses/${PUBLIC_SLUG}`,
    `/courses/${CLINICIAN_SLUG}`,
  ];

  for (const path of paths) {
    test(`no violations on ${path}`, async ({ page }) => {
      await page.goto(appPath(path));
      await expectNoViolations(page, path);
    });
  }
});

test.describe("accessibility: learner pages", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, LEARNER.email, LEARNER.password);
  });

  const paths = ["/dashboard", "/my-courses", "/settings"];
  for (const path of paths) {
    test(`no violations on ${path}`, async ({ page }) => {
      await page.goto(appPath(path));
      await expectNoViolations(page, path);
    });
  }

  test("no violations on the student course overview", async ({ page }) => {
    await page.goto(appPath(`/student/courses/${clinicianCourseId}`));
    await expectNoViolations(page, "/student/courses/[id]");
  });

  test("no violations on a text lesson", async ({ page }) => {
    await page.goto(appPath(`/learn/${CLINICIAN_SLUG}/${TEXT_LESSON_SLUG}`));
    await expectNoViolations(page, "/learn/[course]/[lesson] (text)");
  });

  test("no violations on a quiz lesson", async ({ page }) => {
    await page.goto(appPath(`/learn/${CLINICIAN_SLUG}/${QUIZ_LESSON_SLUG}`));
    await expectNoViolations(page, "/learn/[course]/[lesson] (quiz)");
  });

  test("no violations on an issued certificate", async ({ page }) => {
    await page.goto(appPath(`/certificates/${certEnrollmentId}`));
    await expectNoViolations(page, "/certificates/[id]");
  });
});

test.describe("accessibility: admin pages", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
  });

  const paths = ["/admin/courses", "/admin/learners", "/admin/purchases", "/admin/users"];
  for (const path of paths) {
    test(`no violations on ${path}`, async ({ page }) => {
      await page.goto(appPath(path));
      await expectNoViolations(page, path);
    });
  }

  test("no violations on the course builder", async ({ page }) => {
    await page.goto(appPath(`/admin/courses/${clinicianCourseId}`));
    await expectNoViolations(page, "/admin/courses/[id]");
  });
});

/**
 * Tabs forward from the top of the page until document.activeElement's
 * accessible text matches `name`, then returns. Throws if `maxTabs` presses
 * never reach it — the point of a keyboard-only walkthrough is that every
 * control on the golden path is reachable this way, with no mouse.
 */
async function tabToElement(page: Page, name: RegExp, maxTabs = 60) {
  for (let i = 0; i < maxTabs; i++) {
    const text = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el?.textContent?.trim() ?? el?.getAttribute("aria-label") ?? "";
    });
    if (name.test(text)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Could not reach an element matching ${name} within ${maxTabs} Tab presses`);
}

test.describe("keyboard-only walkthrough", () => {
  test("the Buy button on a course sales page is reachable and activatable by keyboard alone", async ({
    page,
  }) => {
    await login(page, LEARNER.email, LEARNER.password);
    await page.goto(appPath(`/courses/${PUBLIC_SLUG}`));

    await tabToElement(page, /^Buy — /);
    // Confirms the button actually has focus, not just matching text
    // somewhere on the page.
    await expect(page.getByRole("button", { name: /^Buy — /, exact: false })).toBeFocused();

    // Activate with the keyboard, not a click. This environment has no
    // route to Stripe's API, so the guaranteed outcome is the button's own
    // error path — proof enough that Enter, not a pointer, drove it.
    await page.keyboard.press("Enter");
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
  });

  test("Mark complete on a lesson is reachable and activatable by keyboard alone", async ({
    page,
  }) => {
    await login(page, LEARNER.email, LEARNER.password);
    await page.goto(appPath(`/learn/${CLINICIAN_SLUG}/${TEXT_LESSON_SLUG}`));

    await tabToElement(page, /^Mark complete$/, 80);
    await expect(page.getByRole("button", { name: "Mark complete" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Marked complete")).toBeVisible();
  });
});
