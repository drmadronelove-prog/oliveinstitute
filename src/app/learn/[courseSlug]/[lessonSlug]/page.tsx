import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { LessonType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewLesson, hasAccess } from "@/lib/entitlements";
import { getOrderedLessons } from "@/lib/progress";
import { formatDuration } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ResourceList } from "@/components/course/ResourceList";
import { LessonBody } from "@/components/course/LessonBody";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { MarkCompleteButton } from "@/components/learn/MarkCompleteButton";
import { QuizPlayer } from "@/components/learn/QuizPlayer";

async function loadLesson(courseSlug: string, lessonSlug: string) {
  // Lesson slugs are only unique within a module, not a course — scoping the
  // lookup by course keeps this correct even so, though two modules in the
  // same course reusing a slug would still be ambiguous (findFirst takes
  // whichever sorts first). Not a concern for the seeded catalogue.
  return prisma.lesson.findFirst({
    where: { slug: lessonSlug, module: { course: { slug: courseSlug } } },
    include: {
      resources: { orderBy: { uploadedAt: "desc" } },
      module: {
        select: {
          id: true,
          title: true,
          course: { select: { id: true, slug: true, title: true } },
          quiz: {
            include: { questions: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, lessonSlug } = await params;
  const lesson = await loadLesson(courseSlug, lessonSlug);

  if (!lesson) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user.id ?? null;

  // The one gate on the content itself — true for a logged-out visitor only
  // when this is the course's free preview.
  const viewable = await canViewLesson(userId, lesson.id);
  if (!viewable) {
    redirect(`/courses/${courseSlug}`);
  }

  // Progress (resume position, completion, the Mark complete button) is an
  // enrolled-learner feature, distinct from merely being allowed to view a
  // free preview.
  let enrolled = false;
  let progress: { completedAt: Date | null; lastPositionSeconds: number } | null =
    null;
  if (userId) {
    enrolled = await hasAccess(userId, lesson.module.course.id);
    if (enrolled) {
      progress = await prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId: lesson.id } },
        select: { completedAt: true, lastPositionSeconds: true },
      });
    }
  }

  const orderedLessons = await getOrderedLessons(lesson.module.course.id);
  const currentIndex = orderedLessons.findIndex((l) => l.id === lesson.id);
  const previous = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < orderedLessons.length - 1
      ? orderedLessons[currentIndex + 1]
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 font-body text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
          {lesson.module.title}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold text-[var(--color-ink)]">
            {lesson.title}
          </h1>
          <Badge>{lesson.type}</Badge>
          {lesson.isFreePreview ? <Badge>Free preview</Badge> : null}
        </div>
        <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
          {formatDuration(lesson.durationSeconds)}
        </p>
      </div>

      <Card>
        {lesson.type === LessonType.VIDEO ? (
          lesson.videoUid ? (
            <VideoPlayer
              lessonId={lesson.id}
              videoUid={lesson.videoUid}
              initialPositionSeconds={progress?.lastPositionSeconds ?? 0}
              trackProgress={enrolled}
            />
          ) : (
            <p className="font-body text-sm text-[var(--color-ink-muted)]">
              This video hasn&apos;t been uploaded yet.
            </p>
          )
        ) : lesson.type === LessonType.TEXT ? (
          lesson.body ? (
            <LessonBody body={lesson.body} />
          ) : (
            <p className="font-body text-sm text-[var(--color-ink-muted)]">
              This lesson has no content yet.
            </p>
          )
        ) : lesson.type === LessonType.PDF ? (
          <div>
            <p className="mb-3 font-body text-sm text-[var(--color-ink-muted)]">
              This lesson&apos;s material is the download below.
            </p>
            <ResourceList resources={lesson.resources} />
          </div>
        ) : lesson.module.quiz ? (
          <QuizPlayer
            questions={lesson.module.quiz.questions.map((question) => ({
              id: question.id,
              prompt: question.prompt,
              // Stored as Prisma Json; every writer (addQuizQuestionAction)
              // always puts a string[] there, so this cast is safe.
              options: question.options as string[],
              correctIndex: question.correctIndex,
              explanation: question.explanation,
            }))}
          />
        ) : (
          <p className="font-body text-sm text-[var(--color-ink-muted)]">
            This module has no knowledge check yet.
          </p>
        )}
      </Card>

      {lesson.transcript ? (
        <Card>
          <h2 className="mb-2 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Transcript
          </h2>
          <p className="whitespace-pre-wrap font-body text-sm text-[var(--color-ink-muted)]">
            {lesson.transcript}
          </p>
        </Card>
      ) : null}

      {lesson.type !== LessonType.PDF && lesson.resources.length > 0 ? (
        <Card>
          <h2 className="mb-3 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Resources
          </h2>
          <ResourceList resources={lesson.resources} />
        </Card>
      ) : null}

      {enrolled ? (
        <Card>
          <MarkCompleteButton
            lessonId={lesson.id}
            initialCompleted={progress?.completedAt != null}
          />
        </Card>
      ) : null}

      <nav className="flex items-center justify-between gap-4 border-t border-black/10 pt-6">
        {previous ? (
          <Link
            href={`/learn/${courseSlug}/${previous.slug}`}
            className="font-body text-sm text-[var(--color-olive)] underline underline-offset-2"
          >
            ← {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/learn/${courseSlug}/${next.slug}`}
            className="font-body text-sm text-[var(--color-olive)] underline underline-offset-2"
          >
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
