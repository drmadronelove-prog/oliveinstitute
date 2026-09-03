import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FeedbackThread } from "@/components/course/FeedbackThread";
import { SUBMISSION_GRADE_LABEL } from "@/lib/labels";
import { SubmissionForm } from "./SubmissionForm";

export default async function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const session = await requireRole(Role.STUDENT);
  const { courseId, assignmentId } = await params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (!enrollment || enrollment.status !== "ACTIVE") {
    notFound();
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: { select: { title: true } },
      submissions: {
        where: { studentId: session.user.id },
        orderBy: { submittedAt: "desc" },
        include: {
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

  const isPastDue = new Date() > assignment.dueAt;

  return (
    <AppShell activeHref="/dashboard">
      <p className="mb-2 font-serif text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        <Link href={`/student/courses/${courseId}`} className="underline underline-offset-2">
          {assignment.course.title}
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
        {isPastDue ? (
          <span className="ml-2 font-serif text-xs text-red-700">
            Past due
          </span>
        ) : null}
      </p>
      {assignment.description ? (
        <p className="mb-8 max-w-prose font-serif text-sm text-[var(--color-ink)]">
          {assignment.description}
        </p>
      ) : (
        <div className="mb-8" />
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Your submissions
          </h2>
          {assignment.submissions.length === 0 ? (
            <p className="font-serif text-sm text-[var(--color-ink-muted)]">
              You haven&apos;t submitted anything yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {assignment.submissions.map((submission) => (
                <li key={submission.id} className="rounded-lg bg-[var(--color-cream)] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Badge>{submission.status}</Badge>
                    {submission.grade !== null ? (
                      <span className="font-serif text-xs text-[var(--color-ink-muted)]">
                        Grade: {SUBMISSION_GRADE_LABEL[submission.grade]}
                      </span>
                    ) : null}
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
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            {assignment.submissions.length > 0 ? "Resubmit" : "Submit"}
          </h2>
          <SubmissionForm courseId={courseId} assignmentId={assignmentId} />
        </Card>
      </div>
    </AppShell>
  );
}
