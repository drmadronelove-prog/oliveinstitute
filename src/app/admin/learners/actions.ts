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

const grantSchema = z.object({
  learnerId: z.string().trim().min(1),
  courseId: z.string().trim().min(1, "Choose a course"),
});

/** The learner-page mirror of admin/courses/[courseId]'s enrollStudentAction — same grant, reached from the other direction. */
export async function grantCompAccessAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(Role.ADMIN);

  const parsed = grantSchema.safeParse({
    learnerId: formData.get("learnerId"),
    courseId: formData.get("courseId"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const learner = await prisma.user.findUnique({
    where: { id: parsed.data.learnerId },
  });
  if (!learner || learner.role !== Role.LEARNER) {
    return { status: "error", message: "Learner not found." };
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
  });
  if (!course) {
    return { status: "error", message: "Course not found." };
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId: learner.id, courseId: course.id },
    },
  });
  if (!existing) {
    await prisma.enrollment.create({
      data: {
        userId: learner.id,
        courseId: course.id,
        source: EnrollmentSource.COMP,
      },
    });
  }

  revalidatePath(`/admin/learners/${learner.id}`);
  revalidatePath(`/admin/courses/${course.id}`);

  return { status: "success", message: `Granted access to "${course.title}".` };
}

const unenrollSchema = z.object({
  learnerId: z.string().trim().min(1),
  enrollmentId: z.string().trim().min(1),
});

export async function unenrollFromLearnerPageAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(Role.ADMIN);

  const parsed = unenrollSchema.safeParse({
    learnerId: formData.get("learnerId"),
    enrollmentId: formData.get("enrollmentId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  await prisma.enrollment.delete({ where: { id: parsed.data.enrollmentId } });

  revalidatePath(`/admin/learners/${parsed.data.learnerId}`);

  return { status: "success", message: "Learner unenrolled." };
}
