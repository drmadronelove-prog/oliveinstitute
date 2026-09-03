import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { CreateCourseForm } from "./CreateCourseForm";

export default async function AdminCoursesPage() {
  await requireRole(Role.ADMIN);

  const [courses, professors] = await Promise.all([
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        professor: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: Role.INSTRUCTOR },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

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
                    <th className="py-2 pr-4">Term</th>
                    <th className="py-2 pr-4">Credits</th>
                    <th className="py-2 pr-4">Instructor</th>
                    <th className="py-2 pr-4">Enrolled</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="border-b border-black/5 last:border-0">
                      <td className="py-3 pr-4">{course.title}</td>
                      <td className="py-3 pr-4">{course.term}</td>
                      <td className="py-3 pr-4">{course.credits}</td>
                      <td className="py-3 pr-4">{course.professor.name}</td>
                      <td className="py-3 pr-4">{course._count.enrollments}</td>
                      <td className="py-3">
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="font-body text-xs text-[var(--color-olive)] underline underline-offset-2"
                        >
                          Manage →
                        </Link>
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
          <CreateCourseForm professors={professors} />
        </Card>
      </div>
    </AppShell>
  );
}
