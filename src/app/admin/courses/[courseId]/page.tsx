import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { EnrollStudentForm } from "./EnrollStudentForm";
import { UnenrollButton } from "./UnenrollButton";
import { ReassignProfessorForm } from "./ReassignProfessorForm";
import { MeetingTimesForm } from "./MeetingTimesForm";

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
      professor: { select: { id: true, name: true } },
      enrollments: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const [professors, enrolledStudents] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.PROFESSOR },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: {
        role: Role.STUDENT,
        id: { notIn: course.enrollments.map((e) => e.user.id) },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <AppShell>
      <p className="mb-2 font-serif text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        <Link href="/admin/courses" className="underline underline-offset-2">
          Manage courses
        </Link>{" "}
        / {course.title}
      </p>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-[var(--color-forest)]">
        {course.title}
      </h1>
      <p className="mb-8 font-serif text-sm text-[var(--color-ink-muted)]">
        {course.term} &middot; {course.credits} credits
      </p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-8">
          <Card>
            <h2 className="mb-3 font-heading text-lg font-semibold text-[var(--color-ink)]">
              Professor
            </h2>
            <ReassignProfessorForm
              courseId={course.id}
              currentProfessorId={course.professor.id}
              professors={professors}
            />
          </Card>

          <Card>
            <h2 className="mb-3 font-heading text-lg font-semibold text-[var(--color-ink)]">
              Meeting times
            </h2>
            <MeetingTimesForm courseId={course.id} currentValue={course.meetingTimes} />
          </Card>

          <Card>
            <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
              Enrolled students
            </h2>
            {course.enrollments.length === 0 ? (
              <p className="font-serif text-sm text-[var(--color-ink-muted)]">
                No students enrolled yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-left font-serif text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
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
            Enroll a student
          </h2>
          <EnrollStudentForm courseId={course.id} students={enrolledStudents} />
        </Card>
      </div>
    </AppShell>
  );
}
