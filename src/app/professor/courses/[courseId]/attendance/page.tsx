import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole, canManageCourse } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AttendanceForm } from "./AttendanceForm";
import { CreditStatusForm } from "./CreditStatusForm";

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ProfessorAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await requireRole([Role.PROFESSOR, Role.ADMIN]);
  const { courseId } = await params;
  const { date } = await searchParams;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !canManageCourse(session, course)) {
    notFound();
  }

  const sessionDateString = date && !Number.isNaN(Date.parse(date)) ? date : todayDateString();
  const sessionDate = new Date(sessionDateString);

  const [enrollments, recordsForDate, history] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId, status: "ACTIVE" },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.attendanceRecord.findMany({
      where: { courseId, sessionDate },
    }),
    prisma.attendanceRecord.findMany({
      where: { courseId },
      orderBy: [{ sessionDate: "desc" }, { student: { name: "asc" } }],
      include: { student: { select: { name: true } } },
      take: 50,
    }),
  ]);

  const statusByStudent = new Map(recordsForDate.map((r) => [r.studentId, r.status]));

  const roster = enrollments.map((enrollment) => ({
    studentId: enrollment.user.id,
    name: enrollment.user.name,
    currentStatus: statusByStudent.get(enrollment.user.id) ?? null,
  }));

  return (
    <AppShell activeHref="/dashboard">
      <p className="mb-2 font-serif text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        <Link href={`/professor/courses/${courseId}`} className="underline underline-offset-2">
          {course.title}
        </Link>{" "}
        / Attendance &amp; credit
      </p>
      <h1 className="mb-8 font-heading text-3xl font-semibold text-[var(--color-forest)]">
        Attendance &amp; credit
      </h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Take attendance
          </h2>
          <form method="GET" className="mb-4 flex items-center gap-2">
            <label className="font-serif text-sm text-[var(--color-ink-muted)]">
              Session date
            </label>
            <input
              type="date"
              name="date"
              defaultValue={sessionDateString}
              className="rounded-md border border-black/10 bg-white px-2 py-1 font-serif text-sm text-[var(--color-ink)]"
            />
            <button
              type="submit"
              className="rounded-md border border-black/10 px-3 py-1 font-serif text-xs text-[var(--color-ink)] hover:bg-[var(--color-cream)]"
            >
              Go
            </button>
          </form>

          {roster.length === 0 ? (
            <p className="font-serif text-sm text-[var(--color-ink-muted)]">
              No students enrolled yet.
            </p>
          ) : (
            <AttendanceForm courseId={courseId} sessionDate={sessionDateString} roster={roster} />
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Course credit
          </h2>
          {enrollments.length === 0 ? (
            <p className="font-serif text-sm text-[var(--color-ink-muted)]">
              No students enrolled yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {enrollments.map((enrollment) => (
                <li
                  key={enrollment.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-cream)] px-4 py-3"
                >
                  <span className="font-serif text-sm text-[var(--color-ink)]">
                    {enrollment.user.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <CreditStatusForm
                      courseId={courseId}
                      enrollmentId={enrollment.id}
                      currentStatus={enrollment.creditStatus}
                    />
                    <Link
                      href={`/professor/students/${enrollment.user.id}/email`}
                      className="font-serif text-xs text-[var(--color-forest)] underline underline-offset-2"
                    >
                      Email
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
          Recent attendance history
        </h2>
        {history.length === 0 ? (
          <p className="font-serif text-sm text-[var(--color-ink-muted)]">
            No attendance recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left font-serif text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Student</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.id} className="border-b border-black/5 last:border-0">
                  <td className="py-2 pr-4">
                    {record.sessionDate.toLocaleDateString("en-US", {
                      dateStyle: "medium",
                    })}
                  </td>
                  <td className="py-2 pr-4">{record.student.name}</td>
                  <td className="py-2">
                    <Badge>{record.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
