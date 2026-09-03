"use server";

import { z } from "zod";
import { EnrollmentSource, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

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

const reassignSchema = z.object({
  courseId: z.string().trim().min(1),
  instructorId: z.string().trim().min(1, "Choose an instructor"),
});

export async function reassignInstructorAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(Role.ADMIN);

  const parsed = reassignSchema.safeParse({
    courseId: formData.get("courseId"),
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

  await prisma.course.update({
    where: { id: parsed.data.courseId },
    data: { instructorId: instructor.id },
  });

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);

  return { status: "success", message: `Instructor set to ${instructor.name}.` };
}
