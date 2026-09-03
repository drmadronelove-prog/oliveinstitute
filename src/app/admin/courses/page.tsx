import Link from "next/link";
import { PurchaseStatus, Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatMinutes, formatPrice, trackLabel } from "@/lib/format";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { CreateCourseForm } from "./CreateCourseForm";
import { DuplicateCourseButton } from "./DuplicateCourseButton";
import { ArchiveCourseButton } from "./ArchiveCourseButton";

export default async function AdminCoursesPage() {
  await requireRole(Role.ADMIN);

  const [courses, instructors, revenueByCourse] = await Promise.all([
    prisma.course.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        instructor: { select: { name: true } },
        _count: { select: { enrollments: true, modules: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: Role.INSTRUCTOR },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.purchase.groupBy({
      by: ["courseId"],
      where: { status: PurchaseStatus.PAID },
      _sum: { amountCents: true },
    }),
  ]);

  const revenueCentsByCourseId = new Map(
    revenueByCourse.map((row) => [row.courseId, row._sum.amountCents ?? 0]),
  );

  // formatPrice reads a zero amount as "Free" — right for a course price,
  // wrong for a revenue total, which should read as $0.00.
  const formatRevenue = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
      cents / 100,
    );

  return (
    <AppShell>
      <h1 className="mb-2 font-heading text-3xl font-semibold text-[var(--color-olive)]">
        Manage courses
      </h1>
      <p className="mb-8 max-w-prose font-body text-sm text-[var(--color-ink-muted)]">
        Create courses, assign an instructor, and manage each course&apos;s
        enrolled learners.
      </p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            All courses
          </h2>
          {courses.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-ink-muted)]">
              No courses yet — create the first one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Track</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Price</th>
                    <th className="py-2 pr-4">Length</th>
                    <th className="py-2 pr-4">Modules</th>
                    <th className="py-2 pr-4">Instructor</th>
                    <th className="py-2 pr-4">Enrolled</th>
                    <th className="py-2 pr-4">Revenue</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="border-b border-black/5 last:border-0">
                      <td className="py-3 pr-4">
                        <span className="font-medium">{course.title}</span>
                        <span className="block text-xs text-[var(--color-ink-muted)]">
                          /{course.slug}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{trackLabel(course.track)}</td>
                      <td className="py-3 pr-4">{course.status}</td>
                      <td className="py-3 pr-4">{formatPrice(course.priceCents)}</td>
                      <td className="py-3 pr-4">
                        {formatMinutes(course.estimatedMinutes)}
                      </td>
                      <td className="py-3 pr-4">{course._count.modules}</td>
                      <td className="py-3 pr-4">{course.instructor.name}</td>
                      <td className="py-3 pr-4">{course._count.enrollments}</td>
                      <td className="py-3 pr-4">
                        {formatRevenue(revenueCentsByCourseId.get(course.id) ?? 0)}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="font-body text-xs text-[var(--color-olive)] underline underline-offset-2"
                          >
                            Manage →
                          </Link>
                          <DuplicateCourseButton courseId={course.id} />
                          {course.status !== "ARCHIVED" ? (
                            <ArchiveCourseButton courseId={course.id} />
                          ) : null}
                        </div>
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
            Add a course
          </h2>
          <CreateCourseForm instructors={instructors} />
        </Card>
      </div>
    </AppShell>
  );
}
