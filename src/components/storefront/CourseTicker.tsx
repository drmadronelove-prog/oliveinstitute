import Link from "next/link";
import { formatMinutes } from "@/lib/format";
import type { CatalogCourse } from "./CourseCard";

/**
 * The scrolling strip of everything on sale, under the hero.
 *
 * Two identical copies of the list scroll left; when the first has moved
 * exactly its own width the animation restarts, so the seam never shows
 * (see `.ticker-track` in globals.css). It pauses on hover and on keyboard
 * focus, and under `prefers-reduced-motion` it stops moving and becomes an
 * ordinary scrollable row with the duplicate copy hidden.
 *
 * Only the first appearance of each course is reachable: every repeat is
 * `aria-hidden` with `tabindex="-1"`, so a keyboard user walks the list
 * once rather than three times.
 */

const SEPARATOR_COLORS = ["bg-[var(--gold)]", "bg-[var(--rose)]", "bg-[var(--glass)]"];

/** How many entries each copy of the list needs before it is wide enough to scroll without a gap. */
const MIN_ENTRIES = 6;

function audienceLabel(track: string): string {
  return track === "CLINICIAN" ? "clinicians" : "individuals & allies";
}

/**
 * A course whose title announces it as a certificate is badged as one.
 * There is no `kind` column — the distinction is editorial (a certificate
 * is a long course, not a different kind of record), so it is read off the
 * title rather than invented in the schema.
 */
function isCertificate(title: string): boolean {
  return title.toLowerCase().startsWith("certificate");
}

function Entry({
  course,
  hidden,
  index,
}: {
  course: CatalogCourse;
  hidden: boolean;
  index: number;
}) {
  const certificate = isCertificate(course.title);

  return (
    <>
      <li aria-hidden={hidden ? "true" : undefined}>
        <Link
          href={`/courses/${course.slug}`}
          tabIndex={hidden ? -1 : undefined}
          className="flex items-center gap-3 whitespace-nowrap rounded-full px-6 py-[18px] transition-colors hover:bg-[var(--paper)]/[0.08]"
        >
          <span
            className={`rounded-full border-[1.5px] px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.12em] ${
              certificate
                ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--ink)]"
                : "border-[var(--paper)] text-[var(--paper)]"
            }`}
          >
            {certificate ? "Certificate" : "Course"}
          </span>
          <span className="font-heading text-[22px] font-medium leading-none tracking-[-0.015em]">
            {course.title}
          </span>
          <span className="font-mono text-[13px] font-medium text-[var(--mist)]">
            {formatMinutes(course.estimatedMinutes)} · {audienceLabel(course.track)}
          </span>
        </Link>
      </li>
      <li aria-hidden="true" className="flex items-center">
        <span
          className={`relative block h-[18px] w-[18px] shrink-0 rounded-full ${
            SEPARATOR_COLORS[index % SEPARATOR_COLORS.length]
          }`}
        >
          <span className="absolute left-[52%] top-[16%] h-[32%] w-[32%] rounded-full bg-[var(--ink)]" />
        </span>
      </li>
    </>
  );
}

function TickerSet({
  courses,
  duplicate,
}: {
  courses: CatalogCourse[];
  /** The second copy exists only to hide the seam, so none of it is reachable. */
  duplicate: boolean;
}) {
  const entries: CatalogCourse[] = [];
  while (entries.length < MIN_ENTRIES) {
    entries.push(...courses);
  }

  return (
    <ul
      className={`m-0 flex list-none items-center p-0 ${duplicate ? "ticker-duplicate" : ""}`}
      aria-hidden={duplicate ? "true" : undefined}
    >
      {entries.map((course, index) => (
        <Entry
          key={`${course.slug}-${index}`}
          course={course}
          // Only the first pass through the real courses is focusable.
          hidden={duplicate || index >= courses.length}
          index={index}
        />
      ))}
    </ul>
  );
}

export function CourseTicker({ courses }: { courses: CatalogCourse[] }) {
  if (courses.length === 0) return null;

  return (
    <section
      aria-label="Courses and certificates"
      className="ticker relative overflow-hidden border-b-2 border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
    >
      {/* The two edges fade into the bar so entries arrive and leave rather
          than being clipped. Decorative, and never over a link's hit area
          that matters — pointer events pass through. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[var(--ink)] to-transparent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--ink)] to-transparent"
      />
      <div className="ticker-track">
        <TickerSet courses={courses} duplicate={false} />
        <TickerSet courses={courses} duplicate />
      </div>
    </section>
  );
}
