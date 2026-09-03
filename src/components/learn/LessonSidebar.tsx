"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDuration } from "@/lib/format";

export type SidebarLesson = {
  slug: string;
  title: string;
  type: string;
  durationSeconds: number;
  canView: boolean;
  completed: boolean;
};

export type SidebarModule = {
  id: string;
  title: string;
  lessons: SidebarLesson[];
};

/**
 * The persistent lesson list. A client component only so it can read the
 * current pathname to highlight the open lesson — everything it renders is
 * handed down from the server, including which lessons are locked.
 */
export function LessonSidebar({
  courseSlug,
  modules,
}: {
  courseSlug: string;
  modules: SidebarModule[];
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Course lessons"
      className="w-full shrink-0 md:w-72 md:overflow-y-auto"
    >
      <div className="flex flex-col gap-5">
        {modules.map((courseModule) => (
          <div key={courseModule.id}>
            <h2 className="mb-2 px-1 font-heading text-sm font-semibold text-[var(--color-ink)]">
              {courseModule.title}
            </h2>
            <ul className="flex flex-col gap-1">
              {courseModule.lessons.map((lesson) => {
                const href = `/learn/${courseSlug}/${lesson.slug}`;
                const active = pathname?.endsWith(href);

                const content = (
                  <div
                    className={`flex items-start gap-2 rounded-lg px-3 py-2 font-body text-sm ${
                      active
                        ? "bg-[var(--color-olive)] text-white"
                        : lesson.canView
                          ? "text-[var(--color-ink)] hover:bg-[var(--color-sage-pale)]"
                          : "text-[var(--color-ink-muted)]"
                    }`}
                  >
                    <span className="mt-0.5">
                      {lesson.canView ? (lesson.completed ? "✓" : "○") : "🔒"}
                    </span>
                    <span className="flex-1">
                      <span className="block">{lesson.title}</span>
                      <span
                        className={`block text-xs ${
                          active
                            ? "text-white/75"
                            : "text-[var(--color-ink-muted)]"
                        }`}
                      >
                        {formatDuration(lesson.durationSeconds)}
                      </span>
                    </span>
                  </div>
                );

                return (
                  <li key={lesson.slug}>
                    {lesson.canView ? (
                      <Link href={href}>{content}</Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
