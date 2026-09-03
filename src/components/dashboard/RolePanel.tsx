import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CourseTile } from "@/components/dashboard/CourseTile";

type CourseSummary = {
  id: string;
  title: string;
  meta: string;
  secondaryLabel?: string;
};

type RolePanelProps =
  | { role: "ADMIN" }
  | { role: "INSTRUCTOR"; courses: (CourseSummary & { secondaryLabel: string })[] }
  | { role: "LEARNER"; courses: CourseSummary[] };

export function RolePanel(props: RolePanelProps) {
  if (props.role === "ADMIN") {
    const toolButtonClassName =
      "flex h-[100px] items-center rounded-[22px] border border-[var(--color-olive-dark)]/40 bg-[var(--color-olive)] px-[55px] opacity-60 transition-colors duration-150 hover:bg-[var(--color-olive-dark)]";
    const toolLabelClassName = "font-heading text-2xl font-semibold text-white";

    return (
      <div className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-[5px] border-b border-[var(--color-olive)]/[0.14] pb-3">
          <h2 className="font-heading text-2xl font-semibold text-[var(--color-olive)]">
            Admin tools
          </h2>
          <p className="text-[13.5px] font-body text-[#5a6360]">
            Create and manage Instructor and Learner accounts, courses, and
            enrollment.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Link href="/admin/courses" className={toolButtonClassName}>
            <span className={toolLabelClassName}>Manage courses</span>
          </Link>
          <Link href="/admin/users" className={toolButtonClassName}>
            <span className={toolLabelClassName}>Manage users</span>
          </Link>
          <div className={toolButtonClassName}>
            <span className={toolLabelClassName}>Enrollment</span>
          </div>
          <div className={toolButtonClassName}>
            <span className={toolLabelClassName}>Finances</span>
          </div>
        </div>
      </div>
    );
  }

  if (props.role === "LEARNER") {
    return (
      <div>
        <h3 className="mb-3 font-heading text-lg font-semibold text-[var(--color-ink)]">
          Your courses
        </h3>
        {props.courses.length === 0 ? (
          <p className="font-body text-sm text-[var(--color-ink-muted)]">
            You aren&apos;t enrolled in any courses yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {props.courses.map((course) => (
              <CourseTile
                key={course.id}
                href={`/student/courses/${course.id}`}
                title={course.title}
                meta={course.meta}
                secondaryLabel={course.secondaryLabel}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card accentColor="var(--color-sage)">
      <h3 className="mb-3 font-heading text-lg font-semibold text-[var(--color-ink)]">
        Your courses
      </h3>
      {props.courses.length === 0 ? (
        <p className="font-body text-sm text-[var(--color-ink-muted)]">
          You haven&apos;t been assigned any courses yet. Ask an admin to
          assign you as instructor on a course.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {props.courses.map((course) => (
            <li key={course.id}>
              <Link
                href={`/professor/courses/${course.id}`}
                className="flex items-center justify-between gap-4 rounded-lg bg-[var(--color-sage-pale)] px-4 py-3 transition-colors hover:bg-[var(--color-sage-pale-deep)]"
              >
                <div>
                  <p className="font-body text-sm font-medium text-[var(--color-ink)]">
                    {course.title}
                  </p>
                  <p className="font-body text-xs text-[var(--color-ink-muted)]">
                    {course.meta}
                  </p>
                </div>
                <span className="font-body text-xs text-[var(--color-ink-muted)]">
                  {course.secondaryLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
