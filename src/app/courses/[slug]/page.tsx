import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewLesson, hasAccess } from "@/lib/entitlements";
import { formatDuration, formatMinutes, formatPrice, trackLabel } from "@/lib/format";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { PublicShell } from "@/components/shell/PublicShell";
import { Badge } from "@/components/ui/Badge";
import { LessonPreview } from "@/components/storefront/LessonPreview";

/**
 * The sales page only ever serves a PUBLISHED course. A draft — or an
 * archived course, which is no longer sold — is a 404 here, whoever is
 * asking; people who already own an archived course reach it through
 * /student/courses/[id] instead.
 */
async function loadPublishedCourse(slug: string) {
  return prisma.course.findFirst({
    where: { slug, status: CourseStatus.PUBLISHED },
    include: {
      instructor: { select: { name: true } },
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            include: {
              resources: {
                orderBy: { uploadedAt: "desc" },
                select: { id: true, type: true, title: true, url: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findFirst({
    where: { slug, status: CourseStatus.PUBLISHED },
    select: {
      title: true,
      subtitle: true,
      description: true,
      track: true,
      instructor: { select: { name: true } },
    },
  });

  // Bail here, not just in the page body. Metadata resolves before the
  // response is committed, so calling notFound() from the page alone renders
  // the 404 UI under a 200 status — a soft 404 that crawlers will index.
  if (!course) {
    notFound();
  }

  const description =
    course.description || course.subtitle || `${course.title} — a self-paced course from ${SITE_NAME}.`;
  const url = absoluteUrl(`/courses/${slug}`);

  return {
    title: course.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title: course.title,
      description,
      url,
      authors: [course.instructor.name],
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description,
    },
    other: {
      "course:track": trackLabel(course.track),
    },
  };
}

export default async function CourseSalesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await loadPublishedCourse(slug);

  if (!course) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user.id ?? null;

  const enrolled = userId ? await hasAccess(userId, course.id) : false;

  const lessons = course.modules.flatMap((m) => m.lessons);
  const totalLessons = lessons.length;

  // The sample lesson. Whether it may be shown is canViewLesson's call — this
  // page does not re-read isFreePreview to decide, so a logged-out visitor
  // and a signed-in one go through exactly the same rule.
  const candidate = lessons.find((lesson) => lesson.isFreePreview) ?? null;
  const previewLesson =
    candidate && (await canViewLesson(userId, candidate.id)) ? candidate : null;

  return (
    <PublicShell>
      <section className="bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-olive)]">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
          <p className="mb-3 font-body text-xs uppercase tracking-[0.14em] text-[var(--color-ivory)]/75">
            {trackLabel(course.track)}
          </p>
          <h1 className="max-w-3xl font-heading text-5xl font-semibold leading-[1.05] text-[var(--color-ivory)]">
            {course.title}
          </h1>
          {course.subtitle ? (
            <p className="mt-3 max-w-2xl font-body text-lg text-[var(--color-ivory)]/85">
              {course.subtitle}
            </p>
          ) : null}
          <p className="mt-4 font-body text-sm text-[var(--color-ivory)]/75">
            Taught by {course.instructor.name} &middot;{" "}
            {formatMinutes(course.estimatedMinutes)} &middot; {totalLessons}{" "}
            lesson{totalLessons === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:px-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-10">
          {course.description ? (
            <section>
              <h2 className="mb-3 font-heading text-2xl font-semibold text-[var(--color-olive)]">
                About this course
              </h2>
              <p className="max-w-prose whitespace-pre-wrap font-body text-[var(--color-ink-muted)]">
                {course.description}
              </p>
            </section>
          ) : null}

          {previewLesson ? (
            <section>
              <h2 className="mb-3 font-heading text-2xl font-semibold text-[var(--color-olive)]">
                Watch the free preview
              </h2>
              <LessonPreview lesson={previewLesson} />
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 font-heading text-2xl font-semibold text-[var(--color-olive)]">
              What&apos;s inside
            </h2>
            <div className="flex flex-col gap-6">
              {course.modules.map((courseModule) => (
                <div key={courseModule.id}>
                  <h3 className="mb-2 font-heading text-lg font-semibold text-[var(--color-ink)]">
                    {courseModule.sortOrder}. {courseModule.title}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {courseModule.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--color-sage-pale)] px-4 py-2.5"
                      >
                        <Badge>{lesson.type}</Badge>
                        <span className="font-body text-sm text-[var(--color-ink)]">
                          {lesson.title}
                        </span>
                        <span className="ml-auto font-body text-xs text-[var(--color-ink-muted)]">
                          {formatDuration(lesson.durationSeconds)}
                        </span>
                        {lesson.isFreePreview ? <Badge>Free preview</Badge> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-xl bg-[var(--color-card)] p-6 shadow-sm ring-1 ring-black/5">
            <p className="font-heading text-4xl font-semibold text-[var(--color-olive)]">
              {formatPrice(course.priceCents)}
            </p>
            <p className="mt-1 font-body text-sm text-[var(--color-ink-muted)]">
              {formatMinutes(course.estimatedMinutes)} of self-paced material ·
              lifetime access
            </p>

            <div className="mt-5">
              {enrolled ? (
                <Link
                  href={`/student/courses/${course.id}`}
                  className="block rounded-md bg-[var(--color-olive)] px-4 py-3 text-center font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)]"
                >
                  Go to course
                </Link>
              ) : session ? (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-md bg-[var(--color-olive)] px-4 py-3 font-body text-sm font-medium text-white opacity-60"
                >
                  Buy — {formatPrice(course.priceCents)}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="block rounded-md bg-[var(--color-olive)] px-4 py-3 text-center font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)]"
                >
                  Buy — {formatPrice(course.priceCents)}
                </Link>
              )}
            </div>

            <p className="mt-3 font-body text-xs text-[var(--color-ink-muted)]">
              {enrolled
                ? "You already have access to this course."
                : session
                  ? "Checkout isn't connected yet — an admin can grant access in the meantime."
                  : "Sign in to buy. The free preview above needs no account."}
            </p>
          </div>
        </aside>
      </div>
    </PublicShell>
  );
}
