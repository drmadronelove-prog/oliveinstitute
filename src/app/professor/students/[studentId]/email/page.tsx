import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { ComposeEmailForm } from "@/components/email/ComposeEmailForm";

export default async function ProfessorEmailStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await requireRole(Role.PROFESSOR);
  const { studentId } = await params;

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: studentId,
      status: "ACTIVE",
      course: { professorId: session.user.id },
    },
    include: { user: true, course: { select: { title: true } } },
  });

  if (!enrollment) {
    notFound();
  }

  return (
    <AppShell activeHref="/dashboard">
      <p className="mb-2 font-serif text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        <Link
          href={`/professor/courses/${enrollment.courseId}`}
          className="underline underline-offset-2"
        >
          {enrollment.course.title}
        </Link>{" "}
        / Email {enrollment.user.name}
      </p>
      <h1 className="mb-8 font-heading text-3xl font-semibold text-[var(--color-forest)]">
        Email {enrollment.user.name}
      </h1>

      <Card className="max-w-lg">
        <ComposeEmailForm
          recipientId={enrollment.user.id}
          recipientName={enrollment.user.name}
          recipientEmail={enrollment.user.email}
        />
      </Card>
    </AppShell>
  );
}
