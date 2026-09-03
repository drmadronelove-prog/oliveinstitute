"use server";

import { z } from "zod";
import { Role, SubmissionGrade } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, canManageCourse } from "@/lib/rbac";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const reviewSchema = z.object({
  submissionId: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
  assignmentId: z.string().trim().min(1),
  grade: z.enum(["", "PASS", "NO_PASS"]),
  feedback: z.string().trim().max(5000),
});

export async function reviewSubmissionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole([Role.PROFESSOR, Role.ADMIN]);

  const parsed = reviewSchema.safeParse({
    submissionId: formData.get("submissionId"),
    courseId: formData.get("courseId"),
    assignmentId: formData.get("assignmentId"),
    grade: formData.get("grade"),
    feedback: formData.get("feedback"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const { submissionId, courseId, assignmentId, grade, feedback } = parsed.data;

  if (!grade && !feedback) {
    return {
      status: "error",
      message: "Enter a grade or write feedback before saving.",
    };
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: { select: { professorId: true } } },
  });
  if (
    !assignment ||
    assignment.courseId !== courseId ||
    !canManageCourse(session, assignment.course)
  ) {
    return { status: "error", message: "Assignment not found." };
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });
  if (!submission || submission.assignmentId !== assignmentId) {
    return { status: "error", message: "Submission not found." };
  }

  const gradeValue: SubmissionGrade | undefined =
    grade === "" ? undefined : (grade as SubmissionGrade);

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submissionId },
      data: {
        ...(gradeValue !== undefined ? { grade: gradeValue } : {}),
        status: "REVIEWED",
        reviewedAt: new Date(),
      },
    });

    if (feedback) {
      await tx.feedback.create({
        data: {
          submissionId,
          authorId: session.user.id,
          body: feedback,
        },
      });
    }
  });

  revalidatePath(`/professor/courses/${courseId}/assignments/${assignmentId}`);
  revalidatePath(`/student/courses/${courseId}/assignments/${assignmentId}`);
  revalidatePath(`/student/courses/${courseId}`);

  return { status: "success", message: "Review saved." };
}
