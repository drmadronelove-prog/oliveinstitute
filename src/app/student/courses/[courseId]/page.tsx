import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { MaterialsList } from "@/components/course/MaterialsList";

export default async function StudentCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await requireRole(Role.LEARNER);
  const { courseId } = await params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });

  if (!enrollment) {
    notFound();
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      materials: { orderBy: { uploadedAt: "desc" } },
      professor: { select: { name: true } },
    },
  });

  if (!course) {
    notFound();
  }

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
        {course.term} &middot; {course.credits} credits &middot; Taught by{" "}
        {course.professor.name}
      </p>

      <Card>
        <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
          Course materials
        </h2>
        <MaterialsList materials={course.materials} />
      </Card>

    </AppShell>
  );
}
