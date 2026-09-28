import { test, expect } from "@playwright/test";
import {
  CourseStatus,
  EnrollmentSource,
  PrismaClient,
  PurchaseStatus,
  Role,
  Track,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { appPath, login, SEEDED_ADMIN } from "./helpers";

/**
 * Browser coverage for two admin capabilities: a course carrying several
 * instructors, and deleting an account. Both are exercised through the
 * real UI, since the interesting parts — the byline a visitor reads, the
 * refusal an admin is shown — only exist on the rendered page.
 */
const prisma = new PrismaClient();
const TAG = `multi-e2e-${Date.now()}`;
const courseSlug = `multi-course-${TAG}`;

let secondInstructorName = "";

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash("x", 10);

  const first = await prisma.user.create({
    data: {
      name: `First Teacher ${TAG}`,
      email: `first.${TAG}@example.test`,
      passwordHash,
      role: Role.INSTRUCTOR,
    },
  });
  const second = await prisma.user.create({
    data: {
      name: `Second Teacher ${TAG}`,
      email: `second.${TAG}@example.test`,
      passwordHash,
      role: Role.INSTRUCTOR,
    },
  });
  secondInstructorName = second.name;

  await prisma.course.create({
    data: {
      slug: courseSlug,
      title: `Multi Instructor Course ${TAG}`,
      subtitle: "Two people teach this",
      track: Track.PUBLIC,
      priceCents: 5000,
      estimatedMinutes: 60,
      sortOrder: 0,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      instructors: { create: { userId: first.id, sortOrder: 0 } },
      modules: {
        create: {
          title: "Module 1",
          sortOrder: 1,
          lessons: {
            create: {
              title: "Lesson 1",
              slug: "lesson-1",
              sortOrder: 1,
              type: "TEXT",
              durationSeconds: 60,
              isFreePreview: true,
              body: "Hello",
            },
          },
        },
      },
    },
  });
});

test.afterAll(async () => {
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

test.describe.serial("a course with several instructors", () => {
  test("adds a second instructor, and the sales page names both", async ({
    page,
  }) => {
    const course = await prisma.course.findUniqueOrThrow({
      where: { slug: courseSlug },
    });

    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await page.goto(appPath(`/admin/courses/${course.id}`));

    await page
      .locator('select[name="userId"]')
      .selectOption({ label: secondInstructorName });
    // "Add" alone also matches "Add lesson"/"Add module" further down.
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText(`${secondInstructorName} added.`)).toBeVisible();

    await page.goto(appPath(`/courses/${courseSlug}`));
    await expect(
      page.getByText(
        new RegExp(`Taught by First Teacher .* and Second Teacher `),
      ),
    ).toBeVisible();
  });

  test("removing one leaves the other, and the byline drops to one name", async ({
    page,
  }) => {
    const course = await prisma.course.findUniqueOrThrow({
      where: { slug: courseSlug },
    });

    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await page.goto(appPath(`/admin/courses/${course.id}`));

    await page
      .getByRole("listitem")
      .filter({ hasText: secondInstructorName })
      .getByRole("button", { name: "Remove" })
      .click();
    await expect(page.getByText("Instructor removed.")).toBeVisible();

    await page.goto(appPath(`/courses/${courseSlug}`));
    await expect(page.getByText(/Taught by First Teacher/)).toBeVisible();
    await expect(page.getByText(secondInstructorName)).toHaveCount(0);
  });

  test("refuses to remove the last instructor from a published course", async ({
    page,
  }) => {
    const course = await prisma.course.findUniqueOrThrow({
      where: { slug: courseSlug },
    });

    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await page.goto(appPath(`/admin/courses/${course.id}`));

    await page.getByRole("button", { name: "Remove" }).first().click();
    await expect(
      page.getByText(/published course needs at least one instructor/i),
    ).toBeVisible();

    expect(
      await prisma.courseInstructor.count({ where: { courseId: course.id } }),
    ).toBe(1);
  });
});

test.describe.serial("deleting a user", () => {
  test("removes a plain account from the table", async ({ page }) => {
    const doomed = await prisma.user.create({
      data: {
        name: `Doomed Learner ${TAG}`,
        email: `doomed.${TAG}@example.test`,
        passwordHash: await bcrypt.hash("x", 10),
        role: Role.LEARNER,
      },
    });

    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await page.goto(appPath("/admin/users"));

    page.on("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("row", { name: new RegExp(doomed.name) })
      .getByRole("button", { name: "Delete" })
      .click();

    // The row — and with it the button that held the success message —
    // is gone once the page revalidates. Its absence is the confirmation.
    await expect(
      page.getByRole("row", { name: new RegExp(doomed.name) }),
    ).toHaveCount(0);
    expect(
      await prisma.user.findUnique({ where: { id: doomed.id } }),
    ).toBeNull();
  });

  test("refuses to delete someone who still teaches, and says why", async ({
    page,
  }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await page.goto(appPath("/admin/users"));

    page.on("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("row", { name: new RegExp(`First Teacher ${TAG}`) })
      .getByRole("button", { name: "Delete" })
      .click();

    await expect(page.getByText(/they teach 1 course/i)).toBeVisible();
    expect(
      await prisma.user.findFirst({
        where: { email: `first.${TAG}@example.test` },
      }),
    ).not.toBeNull();
  });

  test("refuses to delete a buyer, because the sale record outlives them", async ({
    page,
  }) => {
    const course = await prisma.course.findUniqueOrThrow({
      where: { slug: courseSlug },
    });
    const buyer = await prisma.user.create({
      data: {
        name: `Paying Learner ${TAG}`,
        email: `buyer.${TAG}@example.test`,
        passwordHash: await bcrypt.hash("x", 10),
        role: Role.LEARNER,
        purchases: {
          create: {
            courseId: course.id,
            stripeCheckoutSessionId: `cs_e2e_${TAG}`,
            amountCents: 5000,
            status: PurchaseStatus.PAID,
            paidAt: new Date(),
          },
        },
        enrollments: {
          create: { courseId: course.id, source: EnrollmentSource.PURCHASE },
        },
      },
    });

    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await page.goto(appPath("/admin/users"));

    page.on("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("row", { name: new RegExp(buyer.name) })
      .getByRole("button", { name: "Delete" })
      .click();

    await expect(page.getByText(/record of a real sale/i)).toBeVisible();
    expect(
      await prisma.user.findUnique({ where: { id: buyer.id } }),
    ).not.toBeNull();
  });
});
