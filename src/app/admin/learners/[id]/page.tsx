import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { GrantCompAccessForm } from "./GrantCompAccessForm";
import { UnenrollFromLearnerButton } from "./UnenrollFromLearnerButton";

export default async function AdminLearnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(Role.ADMIN);
  const { id } = await params;

  const learner = await prisma.user.findUnique({
    where: { id },
    include: {
      enrollments: {
        orderBy: { grantedAt: "desc" },
        include: { course: { select: { id: true, slug: true, title: true } } },
      },
    },
  });

  if (!learner || learner.role !== Role.LEARNER) {
    notFound();
  }

  const enrolledCourseIds = learner.enrollments.map((e) => e.course.id);
  const grantableCourses = await prisma.course.findMany({
    where: { id: { notIn: enrolledCourseIds } },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <AppShell>
      <p className="mb-2 font-body text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        <Link href="/admin/learners" className="underline underline-offset-2">
          Learners
        </Link>{" "}
        / {learner.name}
      </p>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-[var(--color-olive)]">
        {learner.name}
      </h1>
      <p className="mb-8 font-body text-sm text-[var(--color-ink-muted)]">
        {learner.email}
        {learner.emailVerifiedAt ? null : " · email not confirmed"}
      </p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Enrollments
          </h2>
          {learner.enrollments.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-ink-muted)]">
              Not enrolled in anything yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
                    <th className="py-2 pr-4">Course</th>
                    <th className="py-2 pr-4">Source</th>
                    <th className="py-2 pr-4">Granted</th>
                    <th className="py-2 pr-4">Completed</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {learner.enrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className="border-b border-black/5 last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/courses/${enrollment.course.id}`}
                          className="text-[var(--color-olive)] underline underline-offset-2"
                        >
                          {enrollment.course.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">{enrollment.source}</td>
                      <td className="py-3 pr-4 text-[var(--color-ink-muted)]">
                        {enrollment.grantedAt.toLocaleDateString("en-US", {
                          dateStyle: "medium",
                        })}
                      </td>
                      <td className="py-3 pr-4 text-[var(--color-ink-muted)]">
                        {enrollment.completedAt
                          ? enrollment.completedAt.toLocaleDateString("en-US", {
                              dateStyle: "medium",
                            })
                          : "—"}
                      </td>
                      <td className="py-3">
                        <UnenrollFromLearnerButton
                          learnerId={learner.id}
                          enrollmentId={enrollment.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Grant comp access
          </h2>
          <GrantCompAccessForm learnerId={learner.id} courses={grantableCourses} />
          <p className="mt-3 font-body text-xs text-[var(--color-ink-muted)]">
            Creates an enrollment with no payment — same as an instructor
            enrolling a learner from the course page.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
