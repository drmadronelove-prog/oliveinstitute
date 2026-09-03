import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole, canManageCourse } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FeedbackThread } from "@/components/course/FeedbackThread";
import { SUBMISSION_GRADE_LABEL } from "@/lib/labels";
import { ReviewForm } from "./ReviewForm";

export default async function ProfessorAssignmentDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const session = await requireRole([Role.PROFESSOR, Role.ADMIN]);
  const { courseId, assignmentId } = await params;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !canManageCourse(session, course)) {
    notFound();
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      submissions: {
        orderBy: { submittedAt: "desc" },
        include: {
          student: { select: { name: true, email: true } },
          feedback: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!assignment || assignment.courseId !== courseId) {
    notFound();
  }

  return (
    <AppShell activeHref="/dashboard">
      <p className="mb-2 font-serif text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        <Link href={`/professor/courses/${courseId}`} className="underline underline-offset-2">
          {course.title}
        </Link>{" "}
        / {assignment.title}
      </p>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-[var(--color-forest)]">
        {assignment.title}
      </h1>
      <p className="mb-2 font-serif text-sm text-[var(--color-ink-muted)]">
        Due{" "}
        {assignment.dueAt.toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>
      {assignment.description ? (
        <p className="mb-8 max-w-prose font-serif text-sm text-[var(--color-ink)]">
          {assignment.description}
        </p>
      ) : (
        <div className="mb-8" />
      )}

      <Card>
        <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
          Submissions
        </h2>
        {assignment.submissions.length === 0 ? (
          <p className="font-serif text-sm text-[var(--color-ink-muted)]">
            No submissions yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {assignment.submissions.map((submission) => (
              <li key={submission.id} className="rounded-lg bg-[var(--color-cream)] p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-serif text-sm font-medium text-[var(--color-ink)]">
                      {submission.student.name}
                    </p>
                    <p className="font-serif text-xs text-[var(--color-ink-muted)]">
                      {submission.student.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{submission.status}</Badge>
                    {submission.grade !== null ? (
                      <span className="font-serif text-xs text-[var(--color-ink-muted)]">
                        {SUBMISSION_GRADE_LABEL[submission.grade]}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="mb-2 font-serif text-xs text-[var(--color-ink-muted)]">
                  Submitted{" "}
                  {submission.submittedAt.toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {submission.fileUrl ? (
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-sm text-[var(--color-forest)] underline underline-offset-2"
                  >
                    View submitted file ↗
                  </a>
                ) : (
                  <p className="whitespace-pre-wrap font-serif text-sm text-[var(--color-ink)]">
                    {submission.text}
                  </p>
                )}

                <FeedbackThread feedback={submission.feedback} />

                <ReviewForm
                  courseId={courseId}
                  assignmentId={assignmentId}
                  submissionId={submission.id}
                  currentGrade={submission.grade}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
