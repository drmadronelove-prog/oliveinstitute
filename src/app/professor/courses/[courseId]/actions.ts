"use server";

import { z } from "zod";
import { MaterialType, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, canManageCourse } from "@/lib/rbac";
import { storage } from "@/lib/storage";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Resolves a lesson to the course that owns it, but only if this session may
 * manage that course. Resources hang off lessons now, so every write has to
 * walk lesson -> module -> course before it can authorize.
 */
async function requireManageableLesson(
  lessonId: string,
  session: { user: { id: string; role: Role } },
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      module: { select: { course: { select: { id: true, instructorId: true } } } },
    },
  });

  if (!lesson || !canManageCourse(session, lesson.module.course)) {
    return null;
  }
  return { lessonId: lesson.id, courseId: lesson.module.course.id };
}

const linkVideoSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  url: z.string().trim().url("Enter a valid URL"),
});

export async function addResourceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole([Role.INSTRUCTOR, Role.ADMIN]);

  const lessonId = String(formData.get("lessonId") ?? "");
  const type = formData.get("type");

  const target = await requireManageableLesson(lessonId, session);
  if (!target) {
    return { status: "error", message: "Lesson not found." };
  }

  if (type === MaterialType.PDF) {
    const title = String(formData.get("title") ?? "").trim();
    const file = formData.get("file");

    if (!title) {
      return { status: "error", message: "Title is required." };
    }
    if (!(file instanceof File) || file.size === 0) {
      return { status: "error", message: "Choose a PDF file." };
    }
    if (file.type !== "application/pdf") {
      return { status: "error", message: "Only PDF files are supported." };
    }
    if (file.size > MAX_PDF_BYTES) {
      return { status: "error", message: "PDF must be under 15 MB." };
    }

    const { url } = await storage.saveFile(target.lessonId, file);

    await prisma.lessonResource.create({
      data: {
        lessonId: target.lessonId,
        type: MaterialType.PDF,
        title,
        url,
        uploadedById: session.user.id,
      },
    });
  } else if (type === MaterialType.LINK || type === MaterialType.VIDEO) {
    const parsed = linkVideoSchema.safeParse({
      title: formData.get("title"),
      url: formData.get("url"),
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    await prisma.lessonResource.create({
      data: {
        lessonId: target.lessonId,
        type,
        title: parsed.data.title,
        url: parsed.data.url,
        uploadedById: session.user.id,
      },
    });
  } else {
    return { status: "error", message: "Invalid resource type." };
  }

  revalidatePath(`/professor/courses/${target.courseId}`);
  revalidatePath(`/student/courses/${target.courseId}`);

  return { status: "success", message: "Resource added." };
}

const deleteSchema = z.object({
  resourceId: z.string().trim().min(1),
  lessonId: z.string().trim().min(1),
});

export async function deleteResourceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole([Role.INSTRUCTOR, Role.ADMIN]);

  const parsed = deleteSchema.safeParse({
    resourceId: formData.get("resourceId"),
    lessonId: formData.get("lessonId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const target = await requireManageableLesson(parsed.data.lessonId, session);
  if (!target) {
    return { status: "error", message: "Lesson not found." };
  }

  await prisma.lessonResource.deleteMany({
    where: { id: parsed.data.resourceId, lessonId: target.lessonId },
  });

  revalidatePath(`/professor/courses/${target.courseId}`);
  revalidatePath(`/student/courses/${target.courseId}`);

  return { status: "success", message: "Resource removed." };
}

const enrollSchema = z.object({
  courseId: z.string().trim().min(1),
  studentId: z.string().trim().min(1, "Choose a learner"),
});

export async function enrollStudentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole([Role.INSTRUCTOR, Role.ADMIN]);

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

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true, instructorId: true },
  });
  if (!course || !canManageCourse(session, course)) {
    return { status: "error", message: "Course not found." };
  }

  const learner = await prisma.user.findUnique({
    where: { id: parsed.data.studentId },
  });
  if (!learner || learner.role !== Role.LEARNER) {
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
        // Granted by hand rather than bought.
        source: "COMP",
      },
    });
  }

  revalidatePath(`/professor/courses/${parsed.data.courseId}`);
  revalidatePath(`/admin/courses/${parsed.data.courseId}`);

  return { status: "success", message: `${learner.name} enrolled.` };
}
