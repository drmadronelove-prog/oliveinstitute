import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole, canManageCourse } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { MaterialsList } from "@/components/course/MaterialsList";
import { AddMaterialForm } from "./AddMaterialForm";
import { DeleteMaterialButton } from "./DeleteMaterialButton";
import { CreateAssignmentForm } from "./assignments/CreateAssignmentForm";
import { EnrollStudentForm } from "./EnrollStudentForm";

export default async function ProfessorCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await requireRole([Role.PROFESSOR, Role.ADMIN]);
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      materials: { orderBy: { uploadedAt: "desc" } },
      assignments: {
        orderBy: { dueAt: "asc" },
        include: { _count: { select: { submissions: true } } },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        select: { userId: true },
      },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
  });

  if (!course || !canManageCourse(session, course)) {
    notFound();
  }

  const availableStudents = await prisma.user.findMany({
    where: {
      role: Role.STUDENT,
      id: { notIn: course.enrollments.map((e) => e.userId) },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <AppShell activeHref="/dashboard">
      <p className="mb-2 font-serif text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        <Link href="/dashboard" className="underline underline-offset-2">
          Your courses
        </Link>{" "}
        / {course.title}
      </p>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-[var(--color-forest)]">
        {course.title}
      </h1>
      <p className="mb-2 font-serif text-sm text-[var(--color-ink-muted)]">
        {course.term} &middot; {course.credits} credits &middot;{" "}
        {course._count.enrollments} enrolled
      </p>
      <p className="mb-8">
        <Link
          href={`/professor/courses/${course.id}/attendance`}
          className="font-serif text-sm text-[var(--color-forest)] underline underline-offset-2"
        >
          Take attendance &amp; set course credit →
        </Link>
      </p>

      <Card className="mb-8 max-w-sm">
        <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
          Enroll a student
        </h2>
        <EnrollStudentForm courseId={course.id} students={availableStudents} />
      </Card>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Course materials
          </h2>
          <MaterialsList
            materials={course.materials}
            renderActions={(material) => (
              <DeleteMaterialButton courseId={course.id} materialId={material.id} />
            )}
          />
        </Card>

        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Add material
          </h2>
          <AddMaterialForm courseId={course.id} />
        </Card>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Assignments
          </h2>
          {course.assignments.length === 0 ? (
            <p className="font-serif text-sm text-[var(--color-ink-muted)]">
              No assignments yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {course.assignments.map((assignment) => (
                <li key={assignment.id}>
                  <Link
                    href={`/professor/courses/${course.id}/assignments/${assignment.id}`}
                    className="flex items-center justify-between gap-4 rounded-lg bg-[var(--color-cream)] px-4 py-3 transition-colors hover:bg-[var(--color-cream-deep)]"
                  >
                    <div>
                      <p className="font-serif text-sm font-medium text-[var(--color-ink)]">
                        {assignment.title}
                      </p>
                      <p className="font-serif text-xs text-[var(--color-ink-muted)]">
                        Due{" "}
                        {assignment.dueAt.toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <span className="font-serif text-xs text-[var(--color-ink-muted)]">
                      {assignment._count.submissions} submission
                      {assignment._count.submissions === 1 ? "" : "s"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            New assignment
          </h2>
          <CreateAssignmentForm courseId={course.id} />
        </Card>
      </div>
    </AppShell>
  );
}
