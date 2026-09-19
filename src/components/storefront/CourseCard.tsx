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
      className="pop-lg pop-hover flex flex-col gap-3 rounded-[22px] bg-white p-7"
    >
      {/* self-start so the pill hugs its text instead of stretching. */}
      <span className="self-start">
        <Badge>{trackLabel(course.track)}</Badge>
      </span>
      <h2 className="font-heading text-2xl font-medium leading-[1.1] tracking-[-0.02em] text-[var(--ink)]">
        {course.title}
      </h2>
      {course.subtitle ? (
        <p className="font-body text-[15px] leading-[1.5] text-[var(--muted)]">
          {course.subtitle}
        </p>
      ) : null}
      <p className="mt-auto pt-2 font-mono text-[13px] text-[var(--ink)]">
        <span className="font-semibold">{formatPrice(course.priceCents)}</span>
        <span className="text-[var(--muted)]">
          {" "}
          · {formatMinutes(course.estimatedMinutes)} · {course.lessonCount}{" "}
          lesson{course.lessonCount === 1 ? "" : "s"}
        </span>
      </p>
    </Link>
  );
}
