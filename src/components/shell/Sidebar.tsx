import Link from "next/link";

type CourseLink = { id: string; title: string };

export function Sidebar({
  learnerCourses,
}: {
  learnerCourses?: CourseLink[] | null;
}) {
  if (learnerCourses == null) {
    return null;
  }

  return (
    <aside className="w-full shrink-0 md:w-64">
      <details
        open
        className="pop group rounded-[18px] bg-[var(--paper)]"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-[16px] px-5 py-3 font-body text-[1.0625rem] font-medium text-[var(--ink)] marker:content-none [&::-webkit-details-marker]:hidden">
          Your Courses
          <span className="text-xs text-[var(--muted)] transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="px-3 pb-3">
          {learnerCourses.length === 0 ? (
            <p className="px-2 pt-2 font-body text-xs text-[var(--muted)]">
              None yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1 pt-1">
              {learnerCourses.map((course) => (
                <li key={course.id}>
                  <Link
                    href={`/student/courses/${course.id}`}
                    className="block rounded-lg px-2 py-1.5 font-body text-sm text-[var(--ink)] underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
                  >
                    {course.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </aside>
  );
}
