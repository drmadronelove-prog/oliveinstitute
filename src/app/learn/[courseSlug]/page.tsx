import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { hasAccess } from "@/lib/entitlements";
import { resolveContinueLessonSlug } from "@/lib/progress";
import { Card } from "@/components/ui/Card";

/**
 * The course root under /learn just resolves to "continue where you left
 * off" and redirects there — the sidebar (in the layout) is the actual
 * shell. hasAccess is the gate here, unlike the lesson page one level down:
 * a logged-out visitor gets sent to sign in rather than shown a free
 * preview, because this route doesn't know which lesson to show them yet.
 */
export default async function LearnCourseRootPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const session = await requireSession();
  const { courseSlug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    select: { id: true, slug: true },
  });

  if (!course) {
    notFound();
  }

  const accessible = await hasAccess(session.user.id, course.id);
  if (!accessible) {
    redirect(`/courses/${course.slug}`);
  }

  const continueSlug = await resolveContinueLessonSlug(
    session.user.id,
    course.id,
  );

  if (!continueSlug) {
    return (
      <Card>
        <p className="font-body text-sm text-[var(--color-ink-muted)]">
          This course doesn&apos;t have any lessons yet.
        </p>
      </Card>
    );
  }

  redirect(`/learn/${course.slug}/${continueSlug}`);
}
