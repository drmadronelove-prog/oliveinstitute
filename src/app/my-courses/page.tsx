import Link from "next/link";
import { requireSession } from "@/lib/rbac";
import { getLearnerCourseSummaries, resolveContinueLessonSlug } from "@/lib/progress";
import { formatMinutes } from "@/lib/format";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function MyCoursesPage() {
  const session = await requireSession();
  const summaries = await getLearnerCourseSummaries(session.user.id);

  // Bounded by how many courses one learner owns — the same
  // Promise.all-per-enrollment shape used for canViewLesson elsewhere.
  const continueSlugs = new Map(
    await Promise.all(
      summaries.map(
        async (summary) =>
          [
            summary.courseId,
            await resolveContinueLessonSlug(session.user.id, summary.courseId),
          ] as const,
      ),
    ),
  );

  return (
    <AppShell>
      <h1 className="mb-2 font-heading text-3xl font-semibold text-[var(--color-olive)]">
        My courses
      </h1>
      <p className="mb-8 font-body text-sm text-[var(--color-ink-muted)]">
        Pick up right where you left off.
      </p>

      {summaries.length === 0 ? (
        <Card>
          <p className="font-body text-sm text-[var(--color-ink-muted)]">
            You aren&apos;t enrolled in any courses yet.{" "}
            <Link
              href="/explore"
              className="text-[var(--color-olive)] underline underline-offset-2"
            >
              Browse the catalogue
            </Link>
            .
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {summaries.map((summary) => {
            const continueSlug = continueSlugs.get(summary.courseId) ?? null;
            const continueHref = continueSlug
              ? `/learn/${summary.courseSlug}/${continueSlug}`
              : null;
            const continueLabel = summary.completedAt
              ? "Review course"
              : summary.completedLessons > 0
                ? "Continue where you left off"
                : "Start course";

            return (
              <Card key={summary.enrollmentId}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-lg font-semibold text-[var(--color-ink)]">
                        {summary.courseTitle}
                      </h2>
                      {summary.completedAt ? <Badge>Completed</Badge> : null}
                    </div>
                    <p className="font-body text-xs text-[var(--color-ink-muted)]">
                      {formatMinutes(summary.estimatedMinutes)} &middot;{" "}
                      {summary.completedLessons}/{summary.totalLessons} lessons
                      complete
                    </p>
                  </div>

                  {continueHref ? (
                    <Link
                      href={continueHref}
                      className="shrink-0 rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)]"
                    >
                      {continueLabel}
                    </Link>
                  ) : (
                    <span className="font-body text-xs text-[var(--color-ink-muted)]">
                      No lessons yet
                    </span>
                  )}
                </div>

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-[var(--color-sage)]"
                    style={{ width: `${summary.percent}%` }}
                  />
                </div>
                <p className="mt-1.5 font-body text-xs text-[var(--color-ink-muted)]">
                  {summary.percent}% complete
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
