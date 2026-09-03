import { test, expect } from "@playwright/test";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { appPath, login, SEEDED_ADMIN } from "./helpers";

/**
 * Browser-level coverage for the admin course-authoring tool: create, edit,
 * the module/lesson builder (add/rename/reorder/delete), the publish gate,
 * duplicate, archive, and the learners/purchases pages. Runs through the
 * seeded admin account and the real UI rather than fixture rows, since the
 * whole point is exercising what an admin actually clicks through.
 */
const prisma = new PrismaClient();
const TAG = `builder-e2e-${Date.now()}`;
const courseTitle = `Builder Test Course ${TAG}`;
const courseSlug = `builder-test-${TAG}`;

test.afterAll(async () => {
  await prisma.lessonProgress.deleteMany({
    where: { lesson: { module: { course: { slug: { contains: TAG } } } } },
  });
  await prisma.enrollment.deleteMany({
    where: { course: { slug: { contains: TAG } } },
  });
  await prisma.purchase.deleteMany({
    where: { course: { slug: { contains: TAG } } },
  });
  await prisma.course.deleteMany({ where: { slug: { contains: TAG } } });
  await prisma.user.deleteMany({ where: { email: { contains: TAG } } });
  await prisma.$disconnect();
});

function rowFor(page: import("@playwright/test").Page, courseId: string) {
  return page
    .locator("tr")
    .filter({ has: page.locator(`a[href$="/admin/courses/${courseId}"]`) });
}

test.describe.serial("admin course builder", () => {
  test.beforeAll(async () => {
    // The seed provisions only the one ADMIN — this suite needs a real
    // INSTRUCTOR to assign when creating a course.
    await prisma.user.create({
      data: {
        name: `Builder Instructor ${TAG}`,
        email: `instructor.${TAG}@example.test`,
        passwordHash: await bcrypt.hash("x", 10),
        role: Role.INSTRUCTOR,
      },
    });
  });

  test("creates a course as a draft", async ({ page }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await page.goto(appPath("/admin/courses"));

    await page.locator('input[name="title"]').fill(courseTitle);
    await page.locator('input[name="slug"]').fill(courseSlug);
    await page.locator('input[name="priceCents"]').fill("0");
    await page.locator('input[name="estimatedMinutes"]').fill("30");
    await page
      .locator('select[name="instructorId"]')
      .selectOption({ label: `Builder Instructor ${TAG}` });

    await page.getByRole("button", { name: "Create course" }).click();
    await expect(page.getByText(`Course "${courseTitle}" created.`)).toBeVisible();

    const course = await prisma.course.findUniqueOrThrow({
      where: { slug: courseSlug },
    });
    expect(course.status).toBe("DRAFT");
  });

  test("refuses to publish with no lessons, no price, and no free preview", async ({
    page,
  }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    const course = await prisma.course.findUniqueOrThrow({
      where: { slug: courseSlug },
    });
    await page.goto(appPath(`/admin/courses/${course.id}`));

    const statusForm = page
      .locator("form")
      .filter({ has: page.locator('select[name="status"]') });
    await statusForm.locator('select[name="status"]').selectOption("PUBLISHED");
    await statusForm.getByRole("button", { name: "Save" }).click();

    const errorText = await page.getByText(/can't publish/i).textContent();
    expect(errorText).toMatch(/no lessons/);
    expect(errorText).toMatch(/no price/);
    expect(errorText).toMatch(/no free-preview lesson/);

    const stillDraft = await prisma.course.findUniqueOrThrow({
      where: { id: course.id },
    });
    expect(stillDraft.status).toBe("DRAFT");
  });

  test("edits every course field, including the price and a cover image", async ({
    page,
  }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    const course = await prisma.course.findUniqueOrThrow({
      where: { slug: courseSlug },
    });
    await page.goto(appPath(`/admin/courses/${course.id}`));

    await page.locator('input[name="subtitle"]').fill("A subtitle for the builder test");
    await page.locator('input[name="priceDollars"]').fill("49.00");
    await page.locator('input[name="coverImage"]').setInputFiles({
      name: "cover.png",
      mimeType: "image/png",
      // A minimal 1x1 transparent PNG.
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await page.getByRole("button", { name: "Save course" }).click();
    await expect(page.getByText("Course updated.")).toBeVisible();

    const updated = await prisma.course.findUniqueOrThrow({
      where: { id: course.id },
    });
    expect(updated.priceCents).toBe(4900);
    expect(updated.subtitle).toBe("A subtitle for the builder test");
    expect(updated.coverImageKey).not.toBeNull();

    const coverResponse = await page.request.get(
      appPath(`/api/course-covers/${updated.coverImageKey}`),
    );
    expect(coverResponse.status()).toBe(200);
  });

  test("adds modules and lessons, reorders them, and edits a lesson's markdown body", async ({
    page,
  }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    const course = await prisma.course.findUniqueOrThrow({
      where: { slug: courseSlug },
    });
    await page.goto(appPath(`/admin/courses/${course.id}`));

    await page.getByLabel("Add a module").fill("Orientation");
    await page.getByRole("button", { name: "Add module" }).click();
    await expect(page.getByText("No modules yet")).toHaveCount(0);

    await page.getByLabel("New lesson title").fill("Welcome");
    await page.getByLabel("Type").selectOption("TEXT");
    await page.getByRole("button", { name: "Add lesson" }).click();
    await expect(page.getByText("Welcome", { exact: true })).toBeVisible();

    await page.getByLabel("New lesson title").fill("Wrap-up");
    await page.getByRole("button", { name: "Add lesson" }).click();
    await expect(page.getByText("Wrap-up", { exact: true })).toBeVisible();

    // Reorder: move "Wrap-up" (currently second) above "Welcome".
    const wrapUpRow = page.locator("div").filter({ hasText: "Wrap-up" }).last();
    await wrapUpRow.getByRole("button", { name: "Move lesson up" }).click();
    await expect(
      wrapUpRow.getByRole("button", { name: "Move lesson up" }),
    ).toBeDisabled();

    const lessonsInOrder = await prisma.lesson.findMany({
      where: { module: { courseId: course.id } },
      orderBy: { sortOrder: "asc" },
      select: { title: true },
    });
    expect(lessonsInOrder.map((l) => l.title)).toEqual(["Wrap-up", "Welcome"]);

    // Open "Welcome" for editing: markdown body, free preview, save.
    const welcomeRow = page.locator("div").filter({ hasText: "Welcome" }).last();
    await welcomeRow.getByRole("button", { name: "Edit" }).click();
    await page
      .locator(`#lesson-body-${(await prisma.lesson.findFirstOrThrow({ where: { title: "Welcome" } })).id}`)
      .fill("Some **bold** text and a [link](https://example.com).");
    await page.getByLabel(/free preview/i).check();
    await page.getByRole("button", { name: "Save lesson" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    const welcome = await prisma.lesson.findFirstOrThrow({
      where: { title: "Welcome", module: { courseId: course.id } },
    });
    expect(welcome.isFreePreview).toBe(true);
    expect(welcome.body).toContain("**bold**");
  });

  test("publishes successfully once price, a lesson, and a free preview all exist", async ({
    page,
  }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    const course = await prisma.course.findUniqueOrThrow({
      where: { slug: courseSlug },
    });
    await page.goto(appPath(`/admin/courses/${course.id}`));

    const statusForm = page
      .locator("form")
      .filter({ has: page.locator('select[name="status"]') });
    await statusForm.locator('select[name="status"]').selectOption("PUBLISHED");
    await statusForm.getByRole("button", { name: "Save" }).click();
    await expect(statusForm.getByText("Saved.")).toBeVisible();

    const published = await prisma.course.findUniqueOrThrow({
      where: { id: course.id },
    });
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).not.toBeNull();
  });

  test("the free-preview lesson's markdown renders as real formatting on the sales page", async ({
    page,
  }) => {
    await page.goto(appPath(`/courses/${courseSlug}`));
    await expect(page.locator("strong", { hasText: "bold" })).toBeVisible();
    await expect(page.locator('a[href="https://example.com"]')).toBeVisible();
  });

  test("the Preview button on the admin page opens the real sales page", async ({
    page,
  }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    const course = await prisma.course.findUniqueOrThrow({
      where: { slug: courseSlug },
    });
    await page.goto(appPath(`/admin/courses/${course.id}`));
    const previewLink = page.getByRole("link", { name: /preview sales page/i });
    await expect(previewLink).toHaveAttribute("href", `/courses/${courseSlug}`);
    await expect(previewLink).toHaveAttribute("target", "_blank");
  });

  test("deletes a lesson after confirming", async ({ page }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    const course = await prisma.course.findUniqueOrThrow({
      where: { slug: courseSlug },
    });
    await page.goto(appPath(`/admin/courses/${course.id}`));

    page.once("dialog", (dialog) => dialog.accept());
    const wrapUpRow = page.locator("div").filter({ hasText: "Wrap-up" }).last();
    await wrapUpRow.getByRole("button", { name: "Delete", exact: true }).click();

    await expect(page.getByText("Wrap-up", { exact: true })).toHaveCount(0);
    const remaining = await prisma.lesson.count({
      where: { module: { courseId: course.id } },
    });
    expect(remaining).toBe(1);
  });

  test("duplicates the course as a new draft with its lessons copied", async ({
    page,
  }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    const original = await prisma.course.findUniqueOrThrow({
      where: { slug: courseSlug },
    });
    await page.goto(appPath("/admin/courses"));
    await rowFor(page, original.id).getByRole("button", { name: "Duplicate" }).click();

    await page.waitForURL(/\/admin\/courses\//);
    await expect(
      page.getByRole("heading", { name: `${courseTitle} (Copy)` }),
    ).toBeVisible();

    const copy = await prisma.course.findFirstOrThrow({
      where: { title: `${courseTitle} (Copy)` },
    });
    expect(copy.status).toBe("DRAFT");
    const copiedLessons = await prisma.lesson.count({
      where: { module: { courseId: copy.id } },
    });
    expect(copiedLessons).toBe(1);
  });

  test("archives the original course from the list", async ({ page }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    const original = await prisma.course.findUniqueOrThrow({
      where: { slug: courseSlug },
    });
    await page.goto(appPath("/admin/courses"));
    await rowFor(page, original.id).getByRole("button", { name: "Archive" }).click();
    await expect(rowFor(page, original.id).getByText(/archiving/i)).toHaveCount(0, {
      timeout: 5000,
    });

    const course = await prisma.course.findUniqueOrThrow({
      where: { id: original.id },
    });
    expect(course.status).toBe("ARCHIVED");
  });
});

test.describe("admin learners and purchases", () => {
  const learnerEmail = `learner.${TAG}@example.test`;

  test.beforeAll(async () => {
    await prisma.user.create({
      data: {
        name: `Builder Learner ${TAG}`,
        email: learnerEmail,
        passwordHash: await bcrypt.hash("x", 10),
        role: Role.LEARNER,
      },
    });
  });

  test("finds a learner by search and grants comp access", async ({ page }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await page.goto(appPath(`/admin/learners?q=${TAG}`));
    await expect(page.getByText(learnerEmail)).toBeVisible();

    await page.getByRole("link", { name: "View →" }).click();
    await page.waitForURL(/\/admin\/learners\/[^/?]+$/);

    const copy = await prisma.course.findFirstOrThrow({
      where: { title: `${courseTitle} (Copy)` },
    });
    await page
      .locator('select[name="courseId"]')
      .selectOption({ label: `${courseTitle} (Copy)` });
    await page.getByRole("button", { name: "Grant access" }).click();
    await expect(page.getByText(/granted access/i)).toBeVisible();

    const learner = await prisma.user.findUniqueOrThrow({
      where: { email: learnerEmail },
    });
    const enrollment = await prisma.enrollment.findUniqueOrThrow({
      where: { userId_courseId: { userId: learner.id, courseId: copy.id } },
    });
    expect(enrollment.source).toBe("COMP");
  });

  test("purchases page renders without error", async ({ page }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await page.goto(appPath("/admin/purchases"));
    await expect(page.getByRole("heading", { name: "Purchases" })).toBeVisible();
  });
});
