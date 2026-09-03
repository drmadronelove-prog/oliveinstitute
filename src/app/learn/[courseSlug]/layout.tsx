import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAccess, canViewLesson } from "@/lib/entitlements";
import { getOrderedLessons, getProgressMap } from "@/lib/progress";
import { Wordmark } from "@/components/shell/Wordmark";
import {
  LessonSidebar,
  type SidebarModule,
} from "@/components/learn/LessonSidebar";

async function loadCourse(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, status: true },
  });
}

/**
 * The player shell: a header and the persistent, module-grouped lesson
 * sidebar. Access is NOT enforced here — /learn/[courseSlug] and
 * /learn/[courseSlug]/[lessonSlug] have different gating rules (hasAccess
 * vs. canViewLesson, the latter open to a logged-out visitor for a free
 * preview), so each page decides for itself whether *its* content may be
 * shown. This layout only keeps a DRAFT course's structure from leaking to
 * someone who couldn't otherwise see it, the same rule the sales page and
 * /student/courses/[id] already use.
 */
export default async function LearnLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const course = await loadCourse(courseSlug);

  if (!course) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user.id ?? null;

  const accessible = userId ? await hasAccess(userId, course.id) : false;
  if (!accessible && course.status !== CourseStatus.PUBLISHED) {
    notFound();
  }

  const lessons = await getOrderedLessons(course.id);

  const viewable = new Map(
    await Promise.all(
      lessons.map(
        async (lesson) =>
          [lesson.id, await canViewLesson(userId, lesson.id)] as const,
      ),
    ),
  );

  const progress = userId
    ? await getProgressMap(
        userId,
        lessons.map((lesson) => lesson.id),
      )
    : new Map();

  const modules: SidebarModule[] = [];
  const moduleIndex = new Map<string, SidebarModule>();
  for (const lesson of lessons) {
    let courseModule = moduleIndex.get(lesson.moduleId);
    if (!courseModule) {
      courseModule = { id: lesson.moduleId, title: lesson.moduleTitle, lessons: [] };
      moduleIndex.set(lesson.moduleId, courseModule);
      modules.push(courseModule);
    }
    courseModule.lessons.push({
      slug: lesson.slug,
      title: lesson.title,
      type: lesson.type,
      durationSeconds: lesson.durationSeconds,
      canView: viewable.get(lesson.id) ?? false,
      completed: progress.get(lesson.id)?.completedAt != null,
    });
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="w-full bg-[var(--color-olive)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 md:px-10">
          <Link href="/my-courses" className="flex items-center">
            <Wordmark />
          </Link>
          <p className="truncate font-body text-sm text-[var(--color-ivory)]/85">
            {course.title}
          </p>
          <Link
            href="/my-courses"
            className="shrink-0 font-body text-sm text-[var(--color-ivory)]/85 underline-offset-4 hover:text-[var(--color-ivory)] hover:underline"
          >
            My courses
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 md:flex-row">
        <LessonSidebar courseSlug={course.slug} modules={modules} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
