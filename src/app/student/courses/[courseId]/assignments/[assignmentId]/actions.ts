"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { storage, hasDangerousExtension } from "@/lib/storage";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const MAX_SUBMISSION_BYTES = 25 * 1024 * 1024; // 25 MB

export async function submitAssignmentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(Role.STUDENT);

  const courseId = String(formData.get("courseId") ?? "");
  const assignmentId = String(formData.get("assignmentId") ?? "");

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (!enrollment || enrollment.status !== "ACTIVE") {
    return { status: "error", message: "You are not enrolled in this course." };
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment || assignment.courseId !== courseId) {
    return { status: "error", message: "Assignment not found." };
  }

  const text = String(formData.get("text") ?? "").trim();
  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;

  if (!hasFile && !text) {
    return {
      status: "error",
      message: "Upload a file or write a text submission.",
    };
  }

  let fileUrl: string | undefined;
  if (hasFile && file instanceof File) {
    if (file.size > MAX_SUBMISSION_BYTES) {
      return { status: "error", message: "File must be under 25 MB." };
    }
    if (hasDangerousExtension(file.name)) {
      return {
        status: "error",
        message: "That file type isn't allowed. Executable and script files are blocked.",
      };
    }
    const saved = await storage.saveFile(
      `${courseId}/submissions/${assignmentId}`,
      file,
    );
    fileUrl = saved.url;
  }

  const isLate = new Date() > assignment.dueAt;

  await prisma.submission.create({
    data: {
      assignmentId,
      studentId: session.user.id,
      fileUrl,
      text: hasFile ? undefined : text,
      status: isLate ? "LATE" : "SUBMITTED",
    },
  });

  revalidatePath(`/student/courses/${courseId}/assignments/${assignmentId}`);
  revalidatePath(`/professor/courses/${courseId}/assignments/${assignmentId}`);
  revalidatePath(`/student/courses/${courseId}`);

  return {
    status: "success",
    message: isLate
      ? "Submitted — this was after the due date and is marked late."
      : "Submitted on time.",
  };
}
