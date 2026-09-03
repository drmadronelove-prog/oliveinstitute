import Link from "next/link";

type CourseLink = { id: string; title: string };

function CourseDropdown({
  label,
  courses,
}: {
  label: string;
  courses: CourseLink[];
}) {
  return (
    <details className="group shadow-tile rounded-[14px] border border-black/10 bg-gradient-to-b from-[var(--color-cream-warm-top)] to-[var(--color-cream-warm)]">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-[14px] px-6 py-[13px] font-serif text-[1.0625rem] font-medium text-[var(--color-ink)] marker:content-none [&::-webkit-details-marker]:hidden">
        {label}
        <span className="text-xs text-[var(--color-ink-muted)] transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="px-3 pb-3">
        {courses.length === 0 ? (
          <p className="px-2 pt-2 font-serif text-xs text-[var(--color-ink-muted)]">
            None yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 pt-1">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  href={`/student/courses/${course.id}`}
                  className="block rounded-lg px-2 py-1.5 font-serif text-sm text-[var(--color-ink)] underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
                >
                  {course.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

export function Sidebar({
  studentCourses,
}: {
  studentCourses?: { active: CourseLink[]; past: CourseLink[] } | null;
}) {
  if (studentCourses == null) {
    return null;
  }

  return (
    <aside className="w-full shrink-0 md:w-64">
      <ul className="flex flex-col gap-3">
        <li>
          <CourseDropdown label="Enrolled Courses" courses={studentCourses.active} />
        </li>
        <li>
          <CourseDropdown label="Past Enrolled" courses={studentCourses.past} />
        </li>
      </ul>
    </aside>
  );
}
