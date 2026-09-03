import { CourseStatus, Track } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CatalogCourse } from "@/components/storefront/CourseCard";

/**
 * The catalogue query. Only PUBLISHED courses are ever listed — every public
 * listing goes through here so that filter cannot be forgotten at a call
 * site.
 */
export async function listPublishedCourses(
  track?: Track,
): Promise<CatalogCourse[]> {
  const courses = await prisma.course.findMany({
    where: { status: CourseStatus.PUBLISHED, ...(track ? { track } : {}) },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      slug: true,
      title: true,
      subtitle: true,
      track: true,
      priceCents: true,
      estimatedMinutes: true,
      modules: { select: { _count: { select: { lessons: true } } } },
    },
  });

  return courses.map((course) => ({
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    track: course.track,
    priceCents: course.priceCents,
    estimatedMinutes: course.estimatedMinutes,
    lessonCount: course.modules.reduce((n, m) => n + m._count.lessons, 0),
  }));
}
