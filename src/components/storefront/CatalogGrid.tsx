import { CourseCard, type CatalogCourse } from "./CourseCard";

export function CatalogGrid({
  courses,
  emptyMessage,
}: {
  courses: CatalogCourse[];
  emptyMessage: string;
}) {
  if (courses.length === 0) {
    return (
      <p className="font-body text-sm text-[var(--color-ink-muted)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.slug} course={course} />
      ))}
    </div>
  );
}
