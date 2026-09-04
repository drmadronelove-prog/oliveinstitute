import Link from "next/link";
import { formatMinutes, formatPrice, trackLabel } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

export type CatalogCourse = {
  slug: string;
  title: string;
  subtitle: string;
  track: string;
  priceCents: number;
  estimatedMinutes: number;
  lessonCount: number;
};

export function CourseCard({ course }: { course: CatalogCourse }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="flex flex-col gap-3 rounded-xl bg-[var(--color-card)] p-6 shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* self-start so the pill hugs its text instead of stretching. */}
      <span className="self-start">
        <Badge>{trackLabel(course.track)}</Badge>
      </span>
      <h2 className="font-heading text-xl font-semibold text-[var(--color-olive)]">
        {course.title}
      </h2>
      {course.subtitle ? (
        <p className="font-body text-sm text-[var(--color-ink-muted)]">
          {course.subtitle}
        </p>
      ) : null}
      <p className="mt-auto font-body text-sm text-[var(--color-ink)]">
        <span className="font-medium">{formatPrice(course.priceCents)}</span>
        <span className="text-[var(--color-ink-muted)]">
          {" "}
          · {formatMinutes(course.estimatedMinutes)} · {course.lessonCount}{" "}
          lesson{course.lessonCount === 1 ? "" : "s"}
        </span>
      </p>
    </Link>
  );
}
