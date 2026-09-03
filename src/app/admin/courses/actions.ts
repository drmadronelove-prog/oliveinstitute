"use server";

import { z } from "zod";
import { CourseStatus, Role, Track } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const createCourseSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug may use lowercase letters, numbers, and single hyphens",
    ),
  title: z.string().trim().min(1, "Title is required").max(200),
  subtitle: z.string().trim().max(300).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  track: z.enum(Track),
  priceCents: z.coerce.number().int().min(0).max(1_000_000),
  estimatedMinutes: z.coerce.number().int().min(0).max(100_000),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
  instructorId: z.string().trim().min(1, "Choose an instructor"),
});

export type CreateCourseState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function createCourseAction(
  _prevState: CreateCourseState,
  formData: FormData,
): Promise<CreateCourseState> {
  await requireRole(Role.ADMIN);

  const parsed = createCourseSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    description: formData.get("description"),
    track: formData.get("track"),
    priceCents: formData.get("priceCents"),
    estimatedMinutes: formData.get("estimatedMinutes"),
    sortOrder: formData.get("sortOrder"),
    instructorId: formData.get("instructorId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const instructor = await prisma.user.findUnique({
    where: { id: parsed.data.instructorId },
  });
  if (!instructor || instructor.role !== Role.INSTRUCTOR) {
    return { status: "error", message: "Selected instructor is invalid." };
  }

  const existing = await prisma.course.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (existing) {
    return { status: "error", message: "That slug is already taken." };
  }

  // Courses start as DRAFT — publishing is a separate, deliberate step.
  await prisma.course.create({
    data: {
      slug: parsed.data.slug,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle,
      description: parsed.data.description,
      track: parsed.data.track,
      priceCents: parsed.data.priceCents,
      estimatedMinutes: parsed.data.estimatedMinutes,
      sortOrder: parsed.data.sortOrder,
      status: CourseStatus.DRAFT,
      instructorId: instructor.id,
    },
  });

  revalidatePath("/admin/courses");

  return { status: "success", message: `Course "${parsed.data.title}" created.` };
}

const statusSchema = z.object({
  courseId: z.string().trim().min(1),
  status: z.enum(CourseStatus),
});

export async function updateCourseStatusAction(
  _prevState: CreateCourseState,
  formData: FormData,
): Promise<CreateCourseState> {
  await requireRole(Role.ADMIN);

  const parsed = statusSchema.safeParse({
    courseId: formData.get("courseId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: {
      status: true,
      publishedAt: true,
      priceCents: true,
      modules: {
        select: { lessons: { select: { isFreePreview: true } } },
      },
    },
  });
  if (!course) {
    return { status: "error", message: "Course not found." };
  }

  if (
    parsed.data.status === CourseStatus.PUBLISHED &&
    course.status !== CourseStatus.PUBLISHED
  ) {
    const lessons = course.modules.flatMap((m) => m.lessons);
    const problems: string[] = [];
    if (lessons.length === 0) problems.push("it has no lessons");
    if (course.priceCents <= 0) problems.push("it has no price set");
    if (!lessons.some((lesson) => lesson.isFreePreview)) {
      problems.push("it has no free-preview lesson");
    }
    if (problems.length > 0) {
      return {
        status: "error",
        message: `Can't publish — ${problems.join("; ")}.`,
      };
    }
  }

  // Stamp publishedAt the first time a course goes live, and leave it in
  // place afterwards so archiving doesn't erase the original date.
  const publishedAt =
    parsed.data.status === CourseStatus.PUBLISHED && course.publishedAt === null
      ? new Date()
      : course.publishedAt;

  await prisma.course.update({
    where: { id: parsed.data.courseId },
    data: { status: parsed.data.status, publishedAt },
  });

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${parsed.data.courseId}`);

  return { status: "success", message: `Status set to ${parsed.data.status}.` };
}

/**
 * Deep-clones a course — its modules and lessons, including each lesson's
 * video, body, transcript, and free-preview flag — as a new DRAFT, never
 * published automatically. Enrollments, purchases, and progress belong to
 * the original, not the copy, so none of that is touched. Redirects
 * straight to the copy's edit page rather than back to the list, since
 * "duplicate" is normally the start of editing a variant, not the end of
 * the task.
 */
export async function duplicateCourseAction(
  _prevState: CreateCourseState,
  formData: FormData,
): Promise<CreateCourseState> {
  await requireRole(Role.ADMIN);

  const courseId = String(formData.get("courseId") ?? "").trim();
  const source = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: { lessons: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!source) {
    return { status: "error", message: "Course not found." };
  }

  let slug = `${source.slug}-copy`;
  let suffix = 2;
  while (
    await prisma.course.findUnique({ where: { slug }, select: { id: true } })
  ) {
    slug = `${source.slug}-copy-${suffix}`;
    suffix += 1;
  }

  const newCourseId = await prisma.$transaction(async (tx) => {
    const newCourse = await tx.course.create({
      data: {
        slug,
        title: `${source.title} (Copy)`,
        subtitle: source.subtitle,
        description: source.description,
        track: source.track,
        priceCents: source.priceCents,
        estimatedMinutes: source.estimatedMinutes,
        sortOrder: source.sortOrder,
        status: CourseStatus.DRAFT,
        instructorId: source.instructorId,
      },
    });

    for (const courseModule of source.modules) {
      const newModule = await tx.module.create({
        data: {
          courseId: newCourse.id,
          title: courseModule.title,
          sortOrder: courseModule.sortOrder,
        },
      });

      for (const lesson of courseModule.lessons) {
        await tx.lesson.create({
          data: {
            moduleId: newModule.id,
            title: lesson.title,
            slug: lesson.slug,
            sortOrder: lesson.sortOrder,
            type: lesson.type,
            videoUid: lesson.videoUid,
            body: lesson.body,
            transcript: lesson.transcript,
            durationSeconds: lesson.durationSeconds,
            isFreePreview: lesson.isFreePreview,
          },
        });
      }
    }

    return newCourse.id;
  });

  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${newCourseId}`);
}
