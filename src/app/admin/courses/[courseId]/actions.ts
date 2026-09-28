"use server";

import { z } from "zod";
import { CourseStatus, EnrollmentSource, Role, Track } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { storage } from "@/lib/storage";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const enrollSchema = z.object({
  courseId: z.string().trim().min(1),
  studentId: z.string().trim().min(1, "Choose a learner"),
});

export async function enrollStudentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(Role.ADMIN);

  const parsed = enrollSchema.safeParse({
    courseId: formData.get("courseId"),
    studentId: formData.get("studentId"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const student = await prisma.user.findUnique({
    where: { id: parsed.data.studentId },
  });
  if (!student || student.role !== Role.LEARNER) {
    return { status: "error", message: "Selected learner is invalid." };
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: parsed.data.studentId,
        courseId: parsed.data.courseId,
      },
    },
  });

  if (!existing) {
    await prisma.enrollment.create({
      data: {
        userId: parsed.data.studentId,
        courseId: parsed.data.courseId,
        // An admin granting access by hand is a comp, not a purchase.
        source: EnrollmentSource.COMP,
      },
    });
  }

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);

  return { status: "success", message: `${student.name} enrolled.` };
}

const unenrollSchema = z.object({
  enrollmentId: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
});

export async function unenrollStudentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(Role.ADMIN);

  const parsed = unenrollSchema.safeParse({
    enrollmentId: formData.get("enrollmentId"),
    courseId: formData.get("courseId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  await prisma.enrollment.delete({
    where: { id: parsed.data.enrollmentId },
  });

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);

  return { status: "success", message: "Learner unenrolled." };
}

const instructorSchema = z.object({
  courseId: z.string().trim().min(1),
  userId: z.string().trim().min(1, "Choose someone to add"),
});

/**
 * Adds someone to a course's instructor list. A course carries a flat list
 * of instructors rather than one owner, so this is an add, not a reassign.
 *
 * ADMIN counts as eligible alongside INSTRUCTOR — this practice is run by
 * one clinician who is both.
 */
export async function addCourseInstructorAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(Role.ADMIN);

  const parsed = instructorSchema.safeParse({
    courseId: formData.get("courseId"),
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, name: true, role: true },
  });
  if (!user || (user.role !== Role.INSTRUCTOR && user.role !== Role.ADMIN)) {
    return { status: "error", message: "That account cannot teach a course." };
  }

  const last = await prisma.courseInstructor.findFirst({
    where: { courseId: parsed.data.courseId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  // Idempotent: adding someone already listed is a no-op, not an error —
  // two admins on the page at once shouldn't produce a failure.
  await prisma.courseInstructor.upsert({
    where: {
      courseId_userId: { courseId: parsed.data.courseId, userId: user.id },
    },
    update: {},
    create: {
      courseId: parsed.data.courseId,
      userId: user.id,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath("/admin/courses");

  return { status: "success", message: `${user.name} added.` };
}

/**
 * Removes someone from a course's instructor list. Removing the last one
 * is allowed on a DRAFT but refused on a live course: a published course
 * with nobody teaching it would show an empty "Taught by" line, and the
 * publish gate would not let it be published in that state either.
 */
export async function removeCourseInstructorAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(Role.ADMIN);

  const parsed = instructorSchema.safeParse({
    courseId: formData.get("courseId"),
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { status: true, instructors: { select: { userId: true } } },
  });
  if (!course) {
    return { status: "error", message: "Course not found." };
  }

  if (
    course.status === CourseStatus.PUBLISHED &&
    course.instructors.length <= 1
  ) {
    return {
      status: "error",
      message:
        "A published course needs at least one instructor. Add someone else first, or archive the course.",
    };
  }

  await prisma.courseInstructor.deleteMany({
    where: { courseId: parsed.data.courseId, userId: parsed.data.userId },
  });

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath("/admin/courses");

  return { status: "success", message: "Instructor removed." };
}

const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_COVER_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const updateCourseSchema = z.object({
  courseId: z.string().trim().min(1),
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug may use lowercase letters, numbers, and single hyphens",
    ),
  subtitle: z.string().trim().max(300).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  track: z.enum(Track),
  priceDollars: z.coerce.number().min(0).max(10_000),
  estimatedMinutes: z.coerce.number().int().min(0).max(100_000),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
  stripePriceId: z.string().trim().max(200).optional().default(""),
});

/**
 * Edits every Course field an admin can change from the detail page,
 * including an optional cover image replacement. Slug uniqueness is
 * checked against every OTHER course (a course keeping its own slug isn't
 * a conflict with itself).
 */
export async function updateCourseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(Role.ADMIN);

  const parsed = updateCourseSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    subtitle: formData.get("subtitle"),
    description: formData.get("description"),
    track: formData.get("track"),
    priceDollars: formData.get("priceDollars"),
    estimatedMinutes: formData.get("estimatedMinutes"),
    sortOrder: formData.get("sortOrder"),
    stripePriceId: formData.get("stripePriceId"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
  });
  if (!course) {
    return { status: "error", message: "Course not found." };
  }

  const slugTaken = await prisma.course.findFirst({
    where: { slug: parsed.data.slug, NOT: { id: course.id } },
    select: { id: true },
  });
  if (slugTaken) {
    return { status: "error", message: "That slug is already taken." };
  }

  let coverImageKey = course.coverImageKey;
  const coverImage = formData.get("coverImage");
  if (coverImage instanceof File && coverImage.size > 0) {
    if (!ALLOWED_COVER_IMAGE_TYPES.has(coverImage.type)) {
      return {
        status: "error",
        message: "Cover image must be a PNG, JPEG, WEBP, or GIF.",
      };
    }
    if (coverImage.size > MAX_COVER_IMAGE_BYTES) {
      return { status: "error", message: "Cover image must be under 5 MB." };
    }
    const saved = await storage.saveCoverImage(course.id, coverImage);
    coverImageKey = saved.storageKey;
  }

  await prisma.course.update({
    where: { id: course.id },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      subtitle: parsed.data.subtitle,
      description: parsed.data.description,
      track: parsed.data.track,
      priceCents: Math.round(parsed.data.priceDollars * 100),
      estimatedMinutes: parsed.data.estimatedMinutes,
      sortOrder: parsed.data.sortOrder,
      stripePriceId: parsed.data.stripePriceId || null,
      coverImageKey,
    },
  });

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${course.id}`);
  revalidatePath(`/courses/${course.slug}`);
  if (course.slug !== parsed.data.slug) {
    revalidatePath(`/courses/${parsed.data.slug}`);
  }

  return { status: "success", message: "Course updated." };
}
