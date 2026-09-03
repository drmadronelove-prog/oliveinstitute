import { notFound } from "next/navigation";
import Link from "next/link";
import { CourseStatus } from "@prisma/client";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { canViewLesson, hasAccess } from "@/lib/entitlements";
import { formatDuration, formatMinutes, trackLabel } from "@/lib/format";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ResourceList } from "@/components/course/ResourceList";

export default async function LearnerCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await requireSession();
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: { select: { name: true } },
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            include: { resources: { orderBy: { uploadedAt: "desc" } } },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const enrolled = await hasAccess(session.user.id, course.id);

  // A draft is invisible to anyone without access; a published course is
  // browsable so its free preview can be sampled before buying.
  if (!enrolled && course.status !== CourseStatus.PUBLISHED) {
    notFound();
  }

  const lessons = course.modules.flatMap((m) => m.lessons);

  // Ask the entitlement rules per lesson rather than re-deriving them here —
  // free previews are viewable without an enrollment, and that logic lives in
  // one place. Concurrent, and bounded by the lesson count of one course.
  const viewable = new Map(
    await Promise.all(
      lessons.map(
        async (lesson) =>
          [lesson.id, await canViewLesson(session.user.id, lesson.id)] as const,
      ),
    ),
  );

  return (
    <AppShell>
      <p className="mb-2 font-body text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        <Link href="/dashboard" className="underline underline-offset-2">
          Your courses
        </Link>{" "}
        / {course.title}
      </p>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-[var(--color-olive)]">
        {course.title}
      </h1>
      {course.subtitle ? (
        <p className="mb-1 font-body text-base text-[var(--color-ink)]">
          {course.subtitle}
        </p>
      ) : null}
      <p className="mb-8 font-body text-sm text-[var(--color-ink-muted)]">
        {trackLabel(course.track)} &middot;{" "}
        {formatMinutes(course.estimatedMinutes)} &middot; Taught by{" "}
        {course.instructor.name}
      </p>

      {!enrolled ? (
        <Card accentColor="var(--color-terracotta)" className="mb-8">
          <p className="font-body text-sm text-[var(--color-ink)]">
            You aren&apos;t enrolled in this course. The free preview lesson is
            open — the rest unlocks once you have access.
          </p>
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
          Curriculum
        </h2>
        {course.modules.length === 0 ? (
          <p className="font-body text-sm text-[var(--color-ink-muted)]">
            No lessons have been published yet.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {course.modules.map((courseModule) => (
              <section key={courseModule.id}>
                <h3 className="mb-2 font-heading text-base font-semibold text-[var(--color-ink)]">
                  {courseModule.sortOrder}. {courseModule.title}
                </h3>
                <ul className="flex flex-col gap-3">
                  {courseModule.lessons.map((lesson) => {
                    const canView = viewable.get(lesson.id) ?? false;

                    return (
                      <li
                        key={lesson.id}
                        className={`rounded-lg p-4 ${
                          canView
                            ? "bg-[var(--color-sage-pale)]"
                            : "bg-black/[0.03]"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{lesson.type}</Badge>
                          <span
                            className={`font-body text-sm font-medium ${
                              canView
                                ? "text-[var(--color-ink)]"
                                : "text-[var(--color-ink-muted)]"
                            }`}
                          >
                            {lesson.title}
                          </span>
                          <span className="font-body text-xs text-[var(--color-ink-muted)]">
                            {formatDuration(lesson.durationSeconds)}
                          </span>
                          {lesson.isFreePreview ? (
                            <Badge>Free preview</Badge>
                          ) : null}
                          {!canView ? (
                            <span className="font-body text-xs text-[var(--color-ink-muted)]">
                              🔒 Locked
                            </span>
                          ) : null}
                        </div>

                        {canView ? (
                          <>
                            {lesson.body ? (
                              <p className="mt-2 whitespace-pre-wrap font-body text-sm text-[var(--color-ink-muted)]">
                                {lesson.body}
                              </p>
                            ) : null}
                            {lesson.resources.length > 0 ? (
                              <div className="mt-3">
                                <ResourceList resources={lesson.resources} />
                              </div>
                            ) : null}
                          </>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
