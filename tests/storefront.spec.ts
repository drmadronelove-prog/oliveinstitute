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
import { appPath, appUrlPattern, login, logout } from "./helpers";

/**
 * The storefront is the logged-out surface, so almost everything here runs
 * with no session. Fixtures cover the two cases the seed can't: a DRAFT
 * course (which must never be listed or reachable) and an enrolled learner
 * (whose Buy button becomes "Go to course").
 */
const prisma = new PrismaClient();
const TAG = `storefront-${Date.now()}`;
const DRAFT_SLUG = `hidden-draft-${TAG}`;
const LEARNER = {
  email: `learner.${TAG}@example.test`,
  password: "storefront-test-pw",
};

let publicCourseSlug = "";
let publicCourseId = "";

test.beforeAll(async () => {
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  if (!admin) throw new Error("Seed the database before running these tests.");

  // A draft course, with a free-preview lesson, that must stay invisible.
  const draft = await prisma.course.create({
    data: {
      slug: DRAFT_SLUG,
      title: `Hidden Draft ${TAG}`,
      subtitle: "Should never be publicly visible",
      track: Track.CLINICIAN,
      priceCents: 1000,
      estimatedMinutes: 30,
      sortOrder: 99,
      status: CourseStatus.DRAFT,
      instructorId: admin.id,
    },
  });
  const draftModule = await prisma.module.create({
    data: { courseId: draft.id, title: "Module 1", sortOrder: 1 },
  });
  await prisma.lesson.create({
    data: {
      moduleId: draftModule.id,
      title: "Draft preview",
      slug: "draft-preview",
      sortOrder: 1,
      type: LessonType.VIDEO,
      durationSeconds: 60,
      isFreePreview: true,
    },
  });

  // A learner enrolled in the seeded public course.
  const course = await prisma.course.findFirstOrThrow({
    where: { status: CourseStatus.PUBLISHED, track: Track.PUBLIC },
    orderBy: { sortOrder: "asc" },
  });
  publicCourseSlug = course.slug;
  publicCourseId = course.id;

  const learner = await prisma.user.create({
    data: {
      name: "Storefront Learner",
      email: LEARNER.email,
      passwordHash: await bcrypt.hash(LEARNER.password, 10),
      role: Role.LEARNER,
    },
  });
  await prisma.enrollment.create({
    data: {
      userId: learner.id,
      courseId: course.id,
      source: EnrollmentSource.COMP,
    },
  });
});

test.afterAll(async () => {
  await prisma.enrollment.deleteMany({
    where: { user: { email: LEARNER.email } },
  });
  await prisma.user.deleteMany({ where: { email: LEARNER.email } });
  await prisma.course.deleteMany({ where: { slug: DRAFT_SLUG } });
  await prisma.$disconnect();
});

test.describe("public routes render logged out", () => {
  for (const path of ["/", "/clinicians", "/explore"]) {
    test(`${path} renders without a session`, async ({ page }) => {
      const response = await page.goto(appPath(path));
      expect(response?.status()).toBe(200);
      // Crucially: not bounced to /login.
      await expect(page).toHaveURL(appUrlPattern(path));
      await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    });
  }

  test("a published sales page renders without a session", async ({ page }) => {
    const response = await page.goto(
      appPath(`/courses/${publicCourseSlug}`),
    );
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "What's inside" }),
    ).toBeVisible();
  });

  test("protected routes still redirect to login", async ({ page }) => {
    for (const path of ["/dashboard", "/admin/courses", "/settings/password"]) {
      await page.goto(appPath(path));
      await expect(page).toHaveURL(appUrlPattern("/login"));
    }
  });
});

test.describe("only published courses are public", () => {
  test("a draft slug returns 404", async ({ page }) => {
    const response = await page.goto(appPath(`/courses/${DRAFT_SLUG}`));
    expect(response?.status()).toBe(404);
  });

  test("a draft course is not listed in any catalog", async ({ page }) => {
    for (const path of ["/", "/clinicians", "/explore"]) {
      await page.goto(appPath(path));
      await expect(page.getByText(`Hidden Draft ${TAG}`)).toHaveCount(0);
    }
  });

  test("each catalog shows only its own track", async ({ page }) => {
    await page.goto(appPath("/clinicians"));
    await expect(
      page.getByRole("heading", { name: "Trauma-Informed Care: Foundations" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Steadier Ground" }),
    ).toHaveCount(0);

    await page.goto(appPath("/explore"));
    await expect(
      page.getByRole("heading", { name: "Steadier Ground" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Trauma-Informed Care: Foundations" }),
    ).toHaveCount(0);
  });
});

test.describe("the free preview", () => {
  test("plays inline for a logged-out visitor", async ({ page }) => {
    await page.goto(appPath(`/courses/${publicCourseSlug}`));
    await expect(
      page.getByRole("heading", { name: "Watch the free preview" }),
    ).toBeVisible();
    // The preview names the first lesson; the rest of the outline is titles
    // and lengths only.
    await expect(page.getByText("A first look at settling")).toHaveCount(2);
  });

  test("every lesson length is visible in the outline", async ({ page }) => {
    await page.goto(appPath(`/courses/${publicCourseSlug}`));
    const outline = page
      .locator("li")
      .filter({ hasText: /^\s*(VIDEO|TEXT|PDF|QUIZ)/ });
    const count = await outline.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(outline.nth(i)).toContainText(/\d+:\d{2}/);
    }
  });
});

test.describe("the buy button", () => {
  test("sends a logged-out visitor to sign in", async ({ page }) => {
    await page.goto(appPath(`/courses/${publicCourseSlug}`));
    const buy = page.getByRole("link", { name: /^Buy — / });
    await expect(buy).toBeVisible();
    await buy.click();
    await expect(page).toHaveURL(appUrlPattern("/login"));
  });

  test("becomes Go to course for an enrolled learner", async ({ page }) => {
    await login(page, LEARNER.email, LEARNER.password);
    await page.goto(appPath(`/courses/${publicCourseSlug}`));

    const go = page.getByRole("link", { name: "Go to course" });
    await expect(go).toBeVisible();
    await expect(page.getByRole("link", { name: /^Buy — / })).toHaveCount(0);

    await go.click();
    await expect(page).toHaveURL(
      appUrlPattern(`/student/courses/${publicCourseId}`),
    );
    await logout(page);
  });
});

test.describe("SEO metadata", () => {
  async function meta(page: import("@playwright/test").Page, property: string) {
    return page
      .locator(`meta[property="${property}"], meta[name="${property}"]`)
      .first()
      .getAttribute("content");
  }

  test("the sales page pulls its metadata from the course", async ({ page }) => {
    await page.goto(appPath(`/courses/${publicCourseSlug}`));

    await expect(page).toHaveTitle(/Steadier Ground — Olive Institute/);
    expect(await meta(page, "description")).toContain("self-paced");
    expect(await meta(page, "og:title")).toBe("Steadier Ground");
    expect(await meta(page, "og:type")).toBe("article");
    expect(await meta(page, "og:site_name")).toBe("Olive Institute");
    expect(await meta(page, "og:url")).toContain(
      `/institute/courses/${publicCourseSlug}`,
    );
    expect(await meta(page, "og:description")).toBeTruthy();
  });

  test("the catalog pages carry their own metadata", async ({ page }) => {
    await page.goto(appPath("/clinicians"));
    await expect(page).toHaveTitle(/Courses for clinicians — Olive Institute/);
    expect(await meta(page, "og:url")).toContain("/institute/clinicians");

    await page.goto(appPath("/explore"));
    await expect(page).toHaveTitle(/Explore courses — Olive Institute/);
    expect(await meta(page, "og:url")).toContain("/institute/explore");
  });

  test("a draft slug is not indexable", async ({ page }) => {
    await page.goto(appPath(`/courses/${DRAFT_SLUG}`));
    expect(await meta(page, "robots")).toContain("noindex");
  });
});
