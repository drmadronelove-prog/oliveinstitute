"use server";

import { z } from "zod";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const enrollSchema = z.object({
  courseId: z.string().trim().min(1),
  studentId: z.string().trim().min(1, "Choose a student"),
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

  await prisma.enrollment.update({
    where: { id: parsed.data.enrollmentId },
    data: { status: "DROPPED" },
  });

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);

  return { status: "success", message: "Student unenrolled." };
}

const reassignSchema = z.object({
  courseId: z.string().trim().min(1),
  professorId: z.string().trim().min(1, "Choose a professor"),
});

export async function reassignProfessorAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(Role.ADMIN);

  const parsed = reassignSchema.safeParse({
    courseId: formData.get("courseId"),
    professorId: formData.get("professorId"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const professor = await prisma.user.findUnique({
    where: { id: parsed.data.professorId },
  });
  if (!professor || professor.role !== Role.PROFESSOR) {
    return { status: "error", message: "Selected professor is invalid." };
  }

  await prisma.course.update({
    where: { id: parsed.data.courseId },
    data: { professorId: professor.id },
  });

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);

  return { status: "success", message: `Professor set to ${professor.name}.` };
}

const meetingTimesSchema = z.object({
  courseId: z.string().trim().min(1),
  meetingTimes: z.string().trim().max(200),
});

export async function updateMeetingTimesAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(Role.ADMIN);

  const parsed = meetingTimesSchema.safeParse({
    courseId: formData.get("courseId"),
    meetingTimes: formData.get("meetingTimes"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  await prisma.course.update({
    where: { id: parsed.data.courseId },
    data: { meetingTimes: parsed.data.meetingTimes },
  });

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath("/schedule");

  return { status: "success", message: "Meeting times updated." };
}
