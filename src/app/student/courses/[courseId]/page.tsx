import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { CREDIT_STATUS_LABEL, SUBMISSION_GRADE_LABEL, formatCourseProfessors } from "@/lib/labels";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MaterialsList } from "@/components/course/MaterialsList";

export default async function StudentCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await requireRole(Role.STUDENT);
  const { courseId } = await params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });

  if (!enrollment) {
    notFound();
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      materials: { orderBy: { uploadedAt: "desc" } },
      professor: { select: { name: true } },
      coProfessors: { include: { professor: { select: { name: true } } } },
      assignments: {
        orderBy: { dueAt: "asc" },
        include: {
          submissions: {
            where: { studentId: session.user.id },
            orderBy: { submittedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: { courseId, studentId: session.user.id },
    orderBy: { sessionDate: "desc" },
  });

  return (
    <AppShell activeHref="/dashboard">
      <p className="mb-2 font-serif text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        <Link href="/dashboard" className="underline underline-offset-2">
          Your enrolled courses
        </Link>{" "}
        / {course.title}
      </p>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-[var(--color-forest)]">
        {course.title}
      </h1>
      <div className="mb-8 flex items-center gap-3">
        <p className="font-serif text-sm text-[var(--color-ink-muted)]">
          {course.term} &middot; {course.credits} credits &middot; Taught by{" "}
          {formatCourseProfessors(course)}
        </p>
        <Badge>{CREDIT_STATUS_LABEL[enrollment.creditStatus]}</Badge>
      </div>

      <Card className="mb-8">
        <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
          Course materials
        </h2>
        <MaterialsList materials={course.materials} />
      </Card>

      <Card className="mb-8">
        <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
          Your attendance
        </h2>
        {attendanceRecords.length === 0 ? (
          <p className="font-serif text-sm text-[var(--color-ink-muted)]">
            No attendance recorded yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {attendanceRecords.map((record) => (
              <li
                key={record.id}
                className="flex items-center justify-between rounded-lg bg-[var(--color-cream)] px-4 py-2"
              >
                <span className="font-serif text-sm text-[var(--color-ink)]">
                  {record.sessionDate.toLocaleDateString("en-US", {
                    dateStyle: "medium",
                  })}
                </span>
                <Badge>{record.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
          Assignments
        </h2>
        {course.assignments.length === 0 ? (
          <p className="font-serif text-sm text-[var(--color-ink-muted)]">
            No assignments yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {course.assignments.map((assignment) => {
              const latest = assignment.submissions[0];
              const statusLabel = latest
                ? `${latest.status}${latest.grade !== null ? ` · ${SUBMISSION_GRADE_LABEL[latest.grade]}` : ""}`
                : "Not submitted";

              return (
                <li key={assignment.id}>
                  <Link
                    href={`/student/courses/${course.id}/assignments/${assignment.id}`}
                    className="flex items-center justify-between gap-4 rounded-lg bg-[var(--color-cream)] px-4 py-3 transition-colors hover:bg-[var(--color-cream-deep)]"
                  >
                    <div>
                      <p className="font-serif text-sm font-medium text-[var(--color-ink)]">
                        {assignment.title}
                      </p>
                      <p className="font-serif text-xs text-[var(--color-ink-muted)]">
                        Due{" "}
                        {assignment.dueAt.toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <span className="font-serif text-xs text-[var(--color-ink-muted)]">
                      {statusLabel}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
