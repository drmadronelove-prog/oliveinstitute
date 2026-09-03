"use server";

import { revalidatePath } from "next/cache";
import { LessonType, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export type BuilderResult = { ok: true } | { ok: false; error: string };

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "lesson";
}

function revalidateCourse(courseId: string, courseSlug: string) {
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath(`/learn/${courseSlug}`, "layout");
}

// ---- Modules --------------------------------------------------------------

export async function addModuleAction(
  courseId: string,
  title: string,
): Promise<BuilderResult> {
  await requireRole(Role.ADMIN);

  const trimmed = title.trim();
  if (!trimmed) return { ok: false, error: "Title is required." };

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, slug: true },
  });
  if (!course) return { ok: false, error: "Course not found." };

  const last = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.module.create({
    data: { courseId, title: trimmed, sortOrder: (last?.sortOrder ?? 0) + 1 },
  });

  revalidateCourse(course.id, course.slug);
  return { ok: true };
}

export async function renameModuleAction(
  moduleId: string,
  title: string,
): Promise<BuilderResult> {
  await requireRole(Role.ADMIN);

  const trimmed = title.trim();
  if (!trimmed) return { ok: false, error: "Title is required." };

  const courseModule = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true, course: { select: { slug: true } } },
  });
  if (!courseModule) return { ok: false, error: "Module not found." };

  await prisma.module.update({ where: { id: moduleId }, data: { title: trimmed } });

  revalidateCourse(courseModule.courseId, courseModule.course.slug);
  return { ok: true };
}

export async function deleteModuleAction(moduleId: string): Promise<BuilderResult> {
  await requireRole(Role.ADMIN);

  const courseModule = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true, course: { select: { slug: true } } },
  });
  if (!courseModule) return { ok: false, error: "Module not found." };

  // Cascades to its lessons, and from there to lesson_resources and
  // lesson_progress — the schema's onDelete: Cascade chain.
  await prisma.module.delete({ where: { id: moduleId } });

  revalidateCourse(courseModule.courseId, courseModule.course.slug);
  return { ok: true };
}

export async function reorderModuleAction(
  moduleId: string,
  direction: "up" | "down",
): Promise<BuilderResult> {
  await requireRole(Role.ADMIN);

  const current = await prisma.module.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      sortOrder: true,
      courseId: true,
      course: { select: { slug: true } },
    },
  });
  if (!current) return { ok: false, error: "Module not found." };

  const sibling = await prisma.module.findFirst({
    where: {
      courseId: current.courseId,
      sortOrder:
        direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    select: { id: true, sortOrder: true },
  });
  // Already first/last — nothing to swap with, not an error.
  if (!sibling) return { ok: true };

  await prisma.$transaction([
    prisma.module.update({
      where: { id: current.id },
      data: { sortOrder: sibling.sortOrder },
    }),
    prisma.module.update({
      where: { id: sibling.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);

  revalidateCourse(current.courseId, current.course.slug);
  return { ok: true };
}

// ---- Lessons ----------------------------------------------------------------

export async function addLessonAction(
  moduleId: string,
  title: string,
  type: LessonType,
): Promise<BuilderResult> {
  await requireRole(Role.ADMIN);

  const trimmedTitle = title.trim();
  if (!trimmedTitle) return { ok: false, error: "Title is required." };

  const courseModule = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { id: true, courseId: true, course: { select: { slug: true } } },
  });
  if (!courseModule) return { ok: false, error: "Module not found." };

  const base = slugify(trimmedTitle);
  let slug = base;
  let suffix = 2;
  while (
    await prisma.lesson.findUnique({
      where: { moduleId_slug: { moduleId, slug } },
      select: { id: true },
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  const last = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.lesson.create({
    data: {
      moduleId,
      title: trimmedTitle,
      slug,
      sortOrder: (last?.sortOrder ?? 0) + 1,
      type,
      durationSeconds: 0,
    },
  });

  revalidateCourse(courseModule.courseId, courseModule.course.slug);
  return { ok: true };
}

export type UpdateLessonInput = {
  title: string;
  slug: string;
  type: LessonType;
  isFreePreview: boolean;
  body: string;
  transcript: string;
  /** Minutes, as entered in the form — converted to durationSeconds here. */
  durationMinutes: number;
};

/**
 * The lesson editor's save action — every field the builder lets an admin
 * hand-edit (video upload and resources are handled by their own actions).
 */
export async function updateLessonAction(
  lessonId: string,
  input: UpdateLessonInput,
): Promise<BuilderResult> {
  await requireRole(Role.ADMIN);

  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) return { ok: false, error: "Title is required." };

  const slug = input.slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      error: "Slug may use lowercase letters, numbers, and single hyphens.",
    };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      moduleId: true,
      module: { select: { courseId: true, course: { select: { slug: true } } } },
    },
  });
  if (!lesson) return { ok: false, error: "Lesson not found." };

  const slugTaken = await prisma.lesson.findFirst({
    where: { moduleId: lesson.moduleId, slug, NOT: { id: lessonId } },
    select: { id: true },
  });
  if (slugTaken) {
    return {
      ok: false,
      error: "That slug is already used by another lesson in this module.",
    };
  }

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: trimmedTitle,
      slug,
      type: input.type,
      isFreePreview: input.isFreePreview,
      body: input.body.trim() || null,
      transcript: input.transcript.trim() || null,
      durationSeconds: Math.max(0, Math.round(input.durationMinutes * 60)),
    },
  });

  revalidateCourse(lesson.module.courseId, lesson.module.course.slug);
  return { ok: true };
}

export async function deleteLessonAction(lessonId: string): Promise<BuilderResult> {
  await requireRole(Role.ADMIN);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      module: { select: { courseId: true, course: { select: { slug: true } } } },
    },
  });
  if (!lesson) return { ok: false, error: "Lesson not found." };

  // Cascades to lesson_resources and lesson_progress.
  await prisma.lesson.delete({ where: { id: lessonId } });

  revalidateCourse(lesson.module.courseId, lesson.module.course.slug);
  return { ok: true };
}

export async function reorderLessonAction(
  lessonId: string,
  direction: "up" | "down",
): Promise<BuilderResult> {
  await requireRole(Role.ADMIN);

  const current = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      moduleId: true,
      sortOrder: true,
      module: { select: { courseId: true, course: { select: { slug: true } } } },
    },
  });
  if (!current) return { ok: false, error: "Lesson not found." };

  const sibling = await prisma.lesson.findFirst({
    where: {
      moduleId: current.moduleId,
      sortOrder:
        direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    select: { id: true, sortOrder: true },
  });
  if (!sibling) return { ok: true };

  await prisma.$transaction([
    prisma.lesson.update({
      where: { id: current.id },
      data: { sortOrder: sibling.sortOrder },
    }),
    prisma.lesson.update({
      where: { id: sibling.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);

  revalidateCourse(current.module.courseId, current.module.course.slug);
  return { ok: true };
}
