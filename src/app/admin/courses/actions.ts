"use server";

import { z } from "zod";
import { CourseStatus, Role, Track } from "@prisma/client";
import { revalidatePath } from "next/cache";
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
    select: { publishedAt: true },
  });
  if (!course) {
    return { status: "error", message: "Course not found." };
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
