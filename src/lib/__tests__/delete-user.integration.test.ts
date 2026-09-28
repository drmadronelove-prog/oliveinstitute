import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CourseStatus,
  EnrollmentSource,
  MaterialType,
  LessonType,
  PrismaClient,
  PurchaseStatus,
  Role,
  Track,
} from "@prisma/client";

/**
 * Integration coverage for the rules `deleteUserAction` enforces. These
 * hit a real database on purpose: every rule is a question about rows
 * that exist elsewhere (a course taught, a purchase recorded), and the
 * foreign keys are half the mechanism — stubbing Prisma would only prove
 * the stub agrees with itself.
 *
 * `requireRole` is mocked, since the point here is the deletion rules and
 * not the session plumbing, which every other admin action already shares.
 */
const prisma = new PrismaClient();
const TAG = `delete-user-${Date.now()}`;

let actingAdminId = "";

vi.mock("@/lib/rbac", () => ({
  requireRole: vi.fn(async () => ({
    user: { id: actingAdminId, role: Role.ADMIN },
  })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { deleteUserAction } = await import("@/app/admin/users/actions");

function formOf(userId: string): FormData {
  const form = new FormData();
  form.set("userId", userId);
  return form;
}

async function makeUser(role: Role, label: string) {
  return prisma.user.create({
    data: {
      name: `${label} ${TAG}`,
      email: `${label}.${TAG}@example.test`.toLowerCase(),
      passwordHash: "x",
      role,
    },
  });
}

async function makeCourse(instructorId?: string) {
  return prisma.course.create({
    data: {
      slug: `${TAG}-course-${Math.random().toString(36).slice(2, 8)}`,
      title: `Course ${TAG}`,
      track: Track.PUBLIC,
      priceCents: 1000,
      estimatedMinutes: 30,
      sortOrder: 0,
      status: CourseStatus.PUBLISHED,
      ...(instructorId
        ? { instructors: { create: { userId: instructorId } } }
        : {}),
    },
  });
}

beforeEach(async () => {
  const admin = await makeUser(Role.ADMIN, "acting-admin");
  actingAdminId = admin.id;
});

afterEach(async () => {
  await prisma.lessonProgress.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await prisma.enrollment.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await prisma.purchase.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await prisma.lessonResource.deleteMany({ where: { uploadedBy: { email: { contains: TAG } } } });
  await prisma.course.deleteMany({ where: { slug: { contains: TAG } } });
  await prisma.user.deleteMany({ where: { email: { contains: TAG } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("deleteUserAction", () => {
  it("deletes a plain account", async () => {
    const learner = await makeUser(Role.LEARNER, "plain");

    const result = await deleteUserAction({ status: "idle" }, formOf(learner.id));

    expect(result.status).toBe("success");
    expect(
      await prisma.user.findUnique({ where: { id: learner.id } }),
    ).toBeNull();
  });

  it("takes enrollments and progress with it", async () => {
    const learner = await makeUser(Role.LEARNER, "enrolled");
    const course = await makeCourse();
    const courseModule = await prisma.module.create({
      data: { courseId: course.id, title: "M1", sortOrder: 1 },
    });
    const lesson = await prisma.lesson.create({
      data: {
        moduleId: courseModule.id,
        title: "L1",
        slug: "l1",
        sortOrder: 1,
        type: LessonType.TEXT,
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
    await prisma.lessonProgress.create({
      data: { userId: learner.id, lessonId: lesson.id },
    });

    const result = await deleteUserAction({ status: "idle" }, formOf(learner.id));

    expect(result.status).toBe("success");
    expect(
      await prisma.enrollment.count({ where: { userId: learner.id } }),
    ).toBe(0);
    expect(
      await prisma.lessonProgress.count({ where: { userId: learner.id } }),
    ).toBe(0);
  });

  it("refuses to delete the admin doing the deleting", async () => {
    const result = await deleteUserAction({ status: "idle" }, formOf(actingAdminId));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/your own account/i);
    expect(
      await prisma.user.findUnique({ where: { id: actingAdminId } }),
    ).not.toBeNull();
  });

  it("refuses to delete someone who teaches a course, naming the remedy", async () => {
    const instructor = await makeUser(Role.INSTRUCTOR, "teaches");
    await makeCourse(instructor.id);

    const result = await deleteUserAction({ status: "idle" }, formOf(instructor.id));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/teach 1 course/);
    expect(result.message).toMatch(/course page/);
    expect(
      await prisma.user.findUnique({ where: { id: instructor.id } }),
    ).not.toBeNull();
  });

  it("refuses to delete someone with a purchase, because that is a sale record", async () => {
    const buyer = await makeUser(Role.LEARNER, "bought");
    const course = await makeCourse();
    await prisma.purchase.create({
      data: {
        userId: buyer.id,
        courseId: course.id,
        stripeCheckoutSessionId: `cs_${TAG}`,
        amountCents: 1000,
        status: PurchaseStatus.PAID,
      },
    });

    const result = await deleteUserAction({ status: "idle" }, formOf(buyer.id));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/purchase/);
    expect(await prisma.user.findUnique({ where: { id: buyer.id } })).not.toBeNull();
  });

  it("refuses to delete someone whose uploaded resources are still on lessons", async () => {
    const uploader = await makeUser(Role.INSTRUCTOR, "uploader");
    const course = await makeCourse();
    const courseModule = await prisma.module.create({
      data: { courseId: course.id, title: "M1", sortOrder: 1 },
    });
    const lesson = await prisma.lesson.create({
      data: {
        moduleId: courseModule.id,
        title: "L1",
        slug: "l1",
        sortOrder: 1,
        type: LessonType.TEXT,
        durationSeconds: 60,
      },
    });
    await prisma.lessonResource.create({
      data: {
        lessonId: lesson.id,
        type: MaterialType.LINK,
        title: "Reading",
        url: "https://example.test/x",
        uploadedById: uploader.id,
      },
    });

    const result = await deleteUserAction({ status: "idle" }, formOf(uploader.id));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/lesson resource/);
  });

  it("reports every blocker at once rather than one at a time", async () => {
    const busy = await makeUser(Role.INSTRUCTOR, "busy");
    const taught = await makeCourse(busy.id);
    await prisma.purchase.create({
      data: {
        userId: busy.id,
        courseId: taught.id,
        stripeCheckoutSessionId: `cs_busy_${TAG}`,
        amountCents: 500,
        status: PurchaseStatus.PAID,
      },
    });

    const result = await deleteUserAction({ status: "idle" }, formOf(busy.id));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/teach/);
    expect(result.message).toMatch(/purchase/);
  });

  it("deletes another admin while more than one remains", async () => {
    const spare = await makeUser(Role.ADMIN, "spare");

    const result = await deleteUserAction({ status: "idle" }, formOf(spare.id));

    expect(result.status).toBe("success");
    expect(await prisma.user.findUnique({ where: { id: spare.id } })).toBeNull();
  });

  it("refuses to remove the last remaining admin", async () => {
    const soleAdmin = await makeUser(Role.ADMIN, "sole");

    // The guard counts ADMINs across the whole table, so the only way to
    // reach it is to be the only one. Every other admin — the acting one
    // and whatever the database was seeded with — is demoted for the
    // duration and put back afterwards.
    const others = await prisma.user.findMany({
      where: { role: Role.ADMIN, id: { not: soleAdmin.id } },
      select: { id: true },
    });
    await prisma.user.updateMany({
      where: { id: { in: others.map((o) => o.id) } },
      data: { role: Role.INSTRUCTOR },
    });

    try {
      const result = await deleteUserAction(
        { status: "idle" },
        formOf(soleAdmin.id),
      );

      expect(result.status).toBe("error");
      expect(result.message).toMatch(/only admin account/i);
      expect(
        await prisma.user.findUnique({ where: { id: soleAdmin.id } }),
      ).not.toBeNull();
    } finally {
      await prisma.user.updateMany({
        where: { id: { in: others.map((o) => o.id) } },
        data: { role: Role.ADMIN },
      });
    }
  });
});
