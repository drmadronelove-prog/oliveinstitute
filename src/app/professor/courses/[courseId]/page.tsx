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
import { EnrollStudentForm } from "./EnrollStudentForm";

export default async function ProfessorCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await requireRole([Role.INSTRUCTOR, Role.ADMIN]);
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      materials: { orderBy: { uploadedAt: "desc" } },
      enrollments: { select: { userId: true } },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course || !canManageCourse(session, course)) {
    notFound();
  }

  const availableStudents = await prisma.user.findMany({
    where: {
      role: Role.LEARNER,
      id: { notIn: course.enrollments.map((e) => e.userId) },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

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
        {course.term} &middot; {course.credits} credits &middot;{" "}
        {course._count.enrollments} enrolled
      </p>

      <Card className="mb-8 max-w-sm">
        <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
          Enroll a learner
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

    </AppShell>
  );
}
