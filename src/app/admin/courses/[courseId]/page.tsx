import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatMinutes, formatPrice, trackLabel } from "@/lib/format";
import { streamConfigured } from "@/lib/video";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { EnrollStudentForm } from "./EnrollStudentForm";
import { UnenrollButton } from "./UnenrollButton";
import { ReassignInstructorForm } from "./ReassignInstructorForm";
import { CourseStatusForm } from "./CourseStatusForm";
import { EditCourseForm } from "./EditCourseForm";
import { CourseBuilder } from "./CourseBuilder";

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
            include: {
              resources: { orderBy: { uploadedAt: "desc" } },
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
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 font-body text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
            <Link href="/admin/courses" className="underline underline-offset-2">
              Manage courses
            </Link>{" "}
            / {course.title}
          </p>
          <h1 className="mb-1 font-heading text-3xl font-semibold text-[var(--color-olive)]">
            {course.title}
          </h1>
          <p className="font-body text-sm text-[var(--color-ink-muted)]">
            /{course.slug} &middot; {trackLabel(course.track)} &middot;{" "}
            {formatPrice(course.priceCents)} &middot;{" "}
            {formatMinutes(course.estimatedMinutes)} &middot;{" "}
            {course.modules.length} modules, {lessonCount} lessons
          </p>
        </div>
        <a
          href={`/courses/${course.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md border border-[var(--color-olive)] px-4 py-2 font-body text-sm text-[var(--color-olive)] transition-colors hover:bg-[var(--color-olive)] hover:text-white"
        >
          Preview sales page ↗
        </a>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-8">
          <Card>
            <h2 className="mb-3 font-heading text-lg font-semibold text-[var(--color-ink)]">
              Course details
            </h2>
            <EditCourseForm
              course={{
                id: course.id,
                title: course.title,
                slug: course.slug,
                subtitle: course.subtitle,
                description: course.description,
                track: course.track,
                priceCents: course.priceCents,
                estimatedMinutes: course.estimatedMinutes,
                sortOrder: course.sortOrder,
                stripePriceId: course.stripePriceId,
                coverImageKey: course.coverImageKey,
              }}
            />
          </Card>

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
            <CourseBuilder
              courseId={course.id}
              modules={course.modules}
              streamConfigured={streamConfigured}
            />
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
