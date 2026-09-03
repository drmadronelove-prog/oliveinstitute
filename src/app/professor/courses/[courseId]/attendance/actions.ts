"use server";

import { z } from "zod";
import { AttendanceStatus, CreditStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, canManageCourse } from "@/lib/rbac";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

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

const ATTENDANCE_STATUS_PREFIX = "status_";

export async function saveAttendanceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole([Role.PROFESSOR, Role.ADMIN]);

  const courseId = String(formData.get("courseId") ?? "");
  const sessionDateRaw = String(formData.get("sessionDate") ?? "");

  const course = await requireOwnedCourse(courseId, session);
  if (!course) {
    return { status: "error", message: "Course not found." };
  }

  const sessionDate = new Date(sessionDateRaw);
  if (Number.isNaN(sessionDate.getTime())) {
    return { status: "error", message: "Enter a valid session date." };
  }

  const entries: Array<{ studentId: string; status: AttendanceStatus }> = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(ATTENDANCE_STATUS_PREFIX)) continue;
    const studentId = key.slice(ATTENDANCE_STATUS_PREFIX.length);
    const parsedStatus = z.enum(AttendanceStatus).safeParse(value);
    if (parsedStatus.success) {
      entries.push({ studentId, status: parsedStatus.data });
    }
  }

  if (entries.length === 0) {
    return { status: "error", message: "No roster entries to save." };
  }

  // Only allow marking students actually (still) enrolled in this course.
  const validEnrollments = await prisma.enrollment.findMany({
    where: {
      courseId,
      status: "ACTIVE",
      userId: { in: entries.map((entry) => entry.studentId) },
    },
    select: { userId: true },
  });
  const validStudentIds = new Set(validEnrollments.map((e) => e.userId));

  await prisma.$transaction(
    entries
      .filter((entry) => validStudentIds.has(entry.studentId))
      .map((entry) =>
        prisma.attendanceRecord.upsert({
          where: {
            courseId_studentId_sessionDate: {
              courseId,
              studentId: entry.studentId,
              sessionDate,
            },
          },
          update: { status: entry.status },
          create: {
            courseId,
            studentId: entry.studentId,
            sessionDate,
            status: entry.status,
          },
        }),
      ),
  );

  revalidatePath(`/professor/courses/${courseId}/attendance`);
  revalidatePath(`/student/courses/${courseId}`);

  return { status: "success", message: "Attendance saved." };
}

const creditStatusSchema = z.object({
  enrollmentId: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
  creditStatus: z.enum(CreditStatus),
});

export async function updateCreditStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole([Role.PROFESSOR, Role.ADMIN]);

  const parsed = creditStatusSchema.safeParse({
    enrollmentId: formData.get("enrollmentId"),
    courseId: formData.get("courseId"),
    creditStatus: formData.get("creditStatus"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const course = await requireOwnedCourse(parsed.data.courseId, session);
  if (!course) {
    return { status: "error", message: "Course not found." };
  }

  const updated = await prisma.enrollment.updateMany({
    where: { id: parsed.data.enrollmentId, courseId: parsed.data.courseId },
    data: { creditStatus: parsed.data.creditStatus },
  });

  if (updated.count === 0) {
    return { status: "error", message: "Enrollment not found." };
  }

  revalidatePath(`/professor/courses/${parsed.data.courseId}/attendance`);
  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath(`/student/courses/${parsed.data.courseId}`);
  revalidatePath("/dashboard");

  return { status: "success", message: "Credit status updated." };
}
