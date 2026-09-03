"use server";

import { z } from "zod";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, canManageCourse } from "@/lib/rbac";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const createAssignmentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().default(""),
  dueAt: z.string().trim().min(1, "Due date is required"),
});

export async function createAssignmentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole([Role.PROFESSOR, Role.ADMIN]);

  const courseId = String(formData.get("courseId") ?? "");
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !canManageCourse(session, course)) {
    return { status: "error", message: "Course not found." };
  }

  const parsed = createAssignmentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    dueAt: formData.get("dueAt"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const dueAt = new Date(parsed.data.dueAt);
  if (Number.isNaN(dueAt.getTime())) {
    return { status: "error", message: "Enter a valid due date." };
  }

  await prisma.assignment.create({
    data: {
      courseId,
      title: parsed.data.title,
      description: parsed.data.description,
      dueAt,
    },
  });

  revalidatePath(`/professor/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);

  return { status: "success", message: "Assignment created." };
}
