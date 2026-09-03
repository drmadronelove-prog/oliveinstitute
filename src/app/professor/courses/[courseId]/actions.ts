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

async function requireOwnedCourse(
  courseId: string,
  session: { user: { id: string; role: Role } },
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !canManageCourse(session, course)) {
    return null;
  }
  return course;
}

const linkVideoSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  url: z.string().trim().url("Enter a valid URL"),
});

export async function addMaterialAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole([Role.PROFESSOR, Role.ADMIN]);

  const courseId = String(formData.get("courseId") ?? "");
  const type = formData.get("type");

  const course = await requireOwnedCourse(courseId, session);
  if (!course) {
    return { status: "error", message: "Course not found." };
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

    const { url } = await storage.saveFile(courseId, file);

    await prisma.courseMaterial.create({
      data: {
        courseId,
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

    await prisma.courseMaterial.create({
      data: {
        courseId,
        type,
        title: parsed.data.title,
        url: parsed.data.url,
        uploadedById: session.user.id,
      },
    });
  } else {
    return { status: "error", message: "Invalid material type." };
  }

  revalidatePath(`/professor/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);

  return { status: "success", message: "Material added." };
}

const deleteSchema = z.object({
  materialId: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
});

export async function deleteMaterialAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole([Role.PROFESSOR, Role.ADMIN]);

  const parsed = deleteSchema.safeParse({
    materialId: formData.get("materialId"),
    courseId: formData.get("courseId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const course = await requireOwnedCourse(parsed.data.courseId, session);
  if (!course) {
    return { status: "error", message: "Course not found." };
  }

  await prisma.courseMaterial.deleteMany({
    where: { id: parsed.data.materialId, courseId: parsed.data.courseId },
  });

  revalidatePath(`/professor/courses/${parsed.data.courseId}`);
  revalidatePath(`/student/courses/${parsed.data.courseId}`);

  return { status: "success", message: "Material removed." };
}

const enrollSchema = z.object({
  courseId: z.string().trim().min(1),
  studentId: z.string().trim().min(1, "Choose a student"),
});

export async function enrollStudentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole([Role.PROFESSOR, Role.ADMIN]);

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

  const course = await requireOwnedCourse(parsed.data.courseId, session);
  if (!course) {
    return { status: "error", message: "Course not found." };
  }

  const student = await prisma.user.findUnique({
    where: { id: parsed.data.studentId },
  });
  if (!student || student.role !== Role.STUDENT) {
    return { status: "error", message: "Selected student is invalid." };
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: parsed.data.studentId,
        courseId: parsed.data.courseId,
      },
    },
  });

  if (existing) {
    if (existing.status !== "ACTIVE") {
      await prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: "ACTIVE" },
      });
    }
  } else {
    await prisma.enrollment.create({
      data: {
        userId: parsed.data.studentId,
        courseId: parsed.data.courseId,
      },
    });
  }

  revalidatePath(`/professor/courses/${parsed.data.courseId}`);
  revalidatePath(`/admin/courses/${parsed.data.courseId}`);

  return { status: "success", message: `${student.name} enrolled.` };
}
