import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole, canManageCourse } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatMinutes, trackLabel } from "@/lib/format";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ResourceList } from "@/components/course/ResourceList";
import { AddResourceForm } from "./AddResourceForm";
import { DeleteResourceButton } from "./DeleteResourceButton";
import { EnrollStudentForm } from "./EnrollStudentForm";

export default async function InstructorCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await requireRole([Role.INSTRUCTOR, Role.ADMIN]);
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            include: { resources: { orderBy: { uploadedAt: "desc" } } },
          },
        },
      },
      enrollments: { select: { userId: true } },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course || !canManageCourse(session, course)) {
    notFound();
  }

  const enrollableLearners = await prisma.user.findMany({
    where: {
      role: Role.LEARNER,
      id: { notIn: course.enrollments.map((e) => e.userId) },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const lessonOptions = course.modules.flatMap((courseModule) =>
    courseModule.lessons.map((lesson) => ({
      id: lesson.id,
      label: `${courseModule.title} — ${lesson.title}`,
    })),
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
      <p className="mb-8 font-body text-sm text-[var(--color-ink-muted)]">
        {trackLabel(course.track)} &middot; {course.status} &middot;{" "}
        {formatMinutes(course.estimatedMinutes)} &middot;{" "}
        {course._count.enrollments} enrolled
      </p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Curriculum
          </h2>
          {course.modules.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-ink-muted)]">
              No modules yet.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {course.modules.map((courseModule) => (
                <section key={courseModule.id}>
                  <h3 className="mb-2 font-heading text-base font-semibold text-[var(--color-ink)]">
                    {courseModule.sortOrder}. {courseModule.title}
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {courseModule.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="rounded-lg bg-[var(--color-sage-pale)] p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{lesson.type}</Badge>
                          <span className="font-body text-sm font-medium text-[var(--color-ink)]">
                            {lesson.title}
                          </span>
                          <span className="font-body text-xs text-[var(--color-ink-muted)]">
                            {formatDuration(lesson.durationSeconds)}
                          </span>
                          {lesson.isFreePreview ? (
                            <Badge>Free preview</Badge>
                          ) : null}
                        </div>
                        <div className="mt-3">
                          <ResourceList
                            resources={lesson.resources}
                            renderActions={(resource) => (
                              <DeleteResourceButton
                                lessonId={lesson.id}
                                resourceId={resource.id}
                              />
                            )}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-8">
          <Card>
            <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
              Add a resource
            </h2>
            <AddResourceForm lessons={lessonOptions} />
          </Card>

          <Card>
            <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
              Enroll a learner
            </h2>
            <EnrollStudentForm
              courseId={course.id}
              students={enrollableLearners}
            />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
