import { notFound } from "next/navigation";
import Link from "next/link";
import { LessonType, Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatMinutes, formatPrice, trackLabel } from "@/lib/format";
import { streamConfigured } from "@/lib/video";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EnrollStudentForm } from "./EnrollStudentForm";
import { UnenrollButton } from "./UnenrollButton";
import { ReassignInstructorForm } from "./ReassignInstructorForm";
import { CourseStatusForm } from "./CourseStatusForm";
import { VideoUploadPanel } from "./VideoUploadPanel";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireRole(Role.ADMIN);
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: { select: { id: true, name: true } },
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              durationSeconds: true,
              videoUid: true,
              transcript: true,
            },
          },
        },
      },
      enrollments: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { grantedAt: "asc" },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const [instructors, enrollableLearners] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.INSTRUCTOR },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: {
        role: Role.LEARNER,
        id: { notIn: course.enrollments.map((e) => e.user.id) },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const lessonCount = course.modules.reduce(
    (total, m) => total + m.lessons.length,
    0,
  );

  return (
    <AppShell>
      <p className="mb-2 font-body text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        <Link href="/admin/courses" className="underline underline-offset-2">
          Manage courses
        </Link>{" "}
        / {course.title}
      </p>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-[var(--color-olive)]">
        {course.title}
      </h1>
      <p className="mb-8 font-body text-sm text-[var(--color-ink-muted)]">
        /{course.slug} &middot; {trackLabel(course.track)} &middot;{" "}
        {formatPrice(course.priceCents)} &middot;{" "}
        {formatMinutes(course.estimatedMinutes)} &middot; {course.modules.length}{" "}
        modules, {lessonCount} lessons
      </p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-8">
          <Card>
            <h2 className="mb-3 font-heading text-lg font-semibold text-[var(--color-ink)]">
              Status
            </h2>
            <CourseStatusForm
              courseId={course.id}
              currentStatus={course.status}
            />
            <p className="mt-2 font-body text-xs text-[var(--color-ink-muted)]">
              {course.publishedAt
                ? `First published ${course.publishedAt.toLocaleDateString("en-US", { dateStyle: "medium" })}.`
                : "Not published yet."}
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 font-heading text-lg font-semibold text-[var(--color-ink)]">
              Instructor
            </h2>
            <ReassignInstructorForm
              courseId={course.id}
              currentInstructorId={course.instructor.id}
              instructors={instructors}
            />
          </Card>

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
                    {courseModule.lessons.length === 0 ? (
                      <p className="font-body text-xs text-[var(--color-ink-muted)]">
                        No lessons in this module.
                      </p>
                    ) : (
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
                            </div>
                            {lesson.type === LessonType.VIDEO ? (
                              <div className="mt-3">
                                <VideoUploadPanel
                                  lessonId={lesson.id}
                                  initialVideoUid={lesson.videoUid}
                                  initialDurationSeconds={lesson.durationSeconds}
                                  hasTranscript={Boolean(lesson.transcript)}
                                  streamConfigured={streamConfigured}
                                />
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
              Enrolled learners
            </h2>
            {course.enrollments.length === 0 ? (
              <p className="font-body text-sm text-[var(--color-ink-muted)]">
                No learners enrolled yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-sm">
                  <thead>
                    <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Source</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {course.enrollments.map((enrollment) => (
                      <tr
                        key={enrollment.id}
                        className="border-b border-black/5 last:border-0"
                      >
                        <td className="py-3 pr-4">{enrollment.user.name}</td>
                        <td className="py-3 pr-4">{enrollment.user.email}</td>
                        <td className="py-3 pr-4">{enrollment.source}</td>
                        <td className="py-3">
                          <UnenrollButton
                            courseId={course.id}
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
        </div>

        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Enroll a learner
          </h2>
          <EnrollStudentForm courseId={course.id} students={enrollableLearners} />
        </Card>
      </div>
    </AppShell>
  );
}
