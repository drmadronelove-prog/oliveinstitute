import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CourseStatus,
  EnrollmentSource,
  PrismaClient,
  Role,
  Track,
} from "@prisma/client";
import {
  getCertificateData,
  issueCertificate,
} from "@/lib/certificate";
import { findRecommendedNextCourse } from "@/lib/completionEmails";

/**
 * Integration coverage for certificate issuance. Unlike Stripe/Cloudflare,
 * nothing here needs network access — pdfkit generates the PDF entirely
 * locally, and storage.saveGeneratedFile just writes to disk — so this is
 * a real end-to-end test against a real database and a real generated
 * file, not a mocked substitute.
 */
const prisma = new PrismaClient();
const TAG = `certificate-test-${Date.now()}`;

type Fixture = {
  learnerId: string;
  courseId: string;
  courseSlug: string;
  enrollmentId: string;
  incompleteEnrollmentId: string;
  otherPublicCourseId: string;
};

let f: Fixture;

beforeAll(async () => {
  const instructor = await prisma.user.create({
    data: {
      name: `Instructor ${TAG}`,
      email: `instructor.${TAG}@example.test`,
      passwordHash: "x",
      role: Role.INSTRUCTOR,
    },
  });
  const learner = await prisma.user.create({
    data: {
      name: `Learner ${TAG}`,
      email: `learner.${TAG}@example.test`,
      passwordHash: "x",
      role: Role.LEARNER,
    },
  });

  const course = await prisma.course.create({
    data: {
      slug: `cert-course-${TAG}`,
      title: `Certificate Course ${TAG}`,
      track: Track.CLINICIAN,
      priceCents: 1000,
      estimatedMinutes: 150, // 2.5 hours
      sortOrder: 0,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
    },
  });

  const incompleteCourse = await prisma.course.create({
    data: {
      slug: `cert-incomplete-${TAG}`,
      title: `Incomplete Course ${TAG}`,
      track: Track.CLINICIAN,
      priceCents: 1000,
      estimatedMinutes: 60,
      sortOrder: 0,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
    },
  });

  // A second PUBLIC-track course the learner isn't enrolled in, and one
  // more CLINICIAN course, to prove the recommendation only ever suggests
  // the same track.
  const otherPublic = await prisma.course.create({
    data: {
      slug: `cert-other-public-${TAG}`,
      title: `Other Public Course ${TAG}`,
      track: Track.PUBLIC,
      priceCents: 1000,
      estimatedMinutes: 60,
      sortOrder: 0,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
    },
  });
  await prisma.course.create({
    data: {
      slug: `cert-other-clinician-${TAG}`,
      title: `Other Clinician Course ${TAG}`,
      track: Track.CLINICIAN,
      priceCents: 1000,
      estimatedMinutes: 60,
      sortOrder: 1,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
    },
  });

  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.id,
      courseId: course.id,
      source: EnrollmentSource.COMP,
      completedAt: new Date(),
    },
  });
  const incompleteEnrollment = await prisma.enrollment.create({
    data: {
      userId: learner.id,
      courseId: incompleteCourse.id,
      source: EnrollmentSource.COMP,
    },
  });

  f = {
    learnerId: learner.id,
    courseId: course.id,
    courseSlug: course.slug,
    enrollmentId: enrollment.id,
    incompleteEnrollmentId: incompleteEnrollment.id,
    otherPublicCourseId: otherPublic.id,
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

describe("getCertificateData", () => {
  it("returns null for an incomplete enrollment", async () => {
    expect(await getCertificateData(f.incompleteEnrollmentId)).toBeNull();
  });

  it("returns null for an unknown enrollment", async () => {
    expect(await getCertificateData("nope")).toBeNull();
  });

  it("computes hours from the course's estimatedMinutes", async () => {
    const data = await getCertificateData(f.enrollmentId);
    expect(data?.hours).toBe("2.5");
    expect(data?.track).toBe(Track.CLINICIAN);
  });
});

describe("issueCertificate", () => {
  it("returns null for an incomplete enrollment, without writing anything", async () => {
    expect(await issueCertificate(f.incompleteEnrollmentId)).toBeNull();
    const enrollment = await prisma.enrollment.findUniqueOrThrow({
      where: { id: f.incompleteEnrollmentId },
    });
    expect(enrollment.certificateIssuedAt).toBeNull();
    expect(enrollment.certificateStorageKey).toBeNull();
  });

  it("generates and stores a real PDF, stamping the enrollment", async () => {
    const result = await issueCertificate(f.enrollmentId);
    expect(result).not.toBeNull();

    const enrollment = await prisma.enrollment.findUniqueOrThrow({
      where: { id: f.enrollmentId },
    });
    expect(enrollment.certificateIssuedAt).not.toBeNull();
    expect(enrollment.certificateStorageKey).toBe(result?.storageKey);

    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const uploadsDir = process.env.UPLOADS_DIR ?? "./uploads";
    const fullPath = path.join(uploadsDir, "generated", result!.storageKey);
    const pdfBytes = await readFile(fullPath);
    // A real PDF file starts with this magic header.
    expect(pdfBytes.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(pdfBytes.length).toBeGreaterThan(500);
  });

  it("is idempotent — a second call returns the same stored file, not a new one", async () => {
    const first = await issueCertificate(f.enrollmentId);
    const second = await issueCertificate(f.enrollmentId);
    expect(second?.storageKey).toBe(first?.storageKey);
  });
});

describe("findRecommendedNextCourse", () => {
  it("recommends a course on the same track the learner isn't enrolled in", async () => {
    const next = await findRecommendedNextCourse(
      f.learnerId,
      Track.CLINICIAN,
      f.courseId,
    );
    expect(next).not.toBeNull();
    expect(next?.slug).not.toBe(f.courseSlug);
  });

  it("never recommends a course from a different track", async () => {
    // The seeded catalogue and other test suites' fixtures both add
    // courses of their own, so this can't assume it's the only candidate —
    // only that whichever one comes back is really on the requested track.
    const next = await findRecommendedNextCourse(
      f.learnerId,
      Track.CLINICIAN,
      f.courseId,
    );
    expect(next).not.toBeNull();
    const recommended = await prisma.course.findUniqueOrThrow({
      where: { slug: next!.slug },
      select: { track: true },
    });
    expect(recommended.track).toBe(Track.CLINICIAN);
  });

  it("returns null once the learner is enrolled in every course on the track", async () => {
    const allPublicCourses = await prisma.course.findMany({
      where: { track: Track.PUBLIC, status: CourseStatus.PUBLISHED },
      select: { id: true },
    });
    await prisma.enrollment.createMany({
      data: allPublicCourses
        .filter((course) => course.id !== f.otherPublicCourseId)
        .map((course) => ({
          userId: f.learnerId,
          courseId: course.id,
          source: EnrollmentSource.COMP,
        })),
      skipDuplicates: true,
    });

    const next = await findRecommendedNextCourse(
      f.learnerId,
      Track.PUBLIC,
      f.otherPublicCourseId,
    );
    expect(next).toBeNull();
  });
});
