import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";

async function loadLearnerCourseLinks(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: { course: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return enrollments.map((e) => ({ id: e.course.id, title: e.course.title }));
}

export async function AppShell({
  children,
  logoHref,
}: {
  children: ReactNode;
  /** Overrides the default logo destination. */
  logoHref?: string;
}) {
  const session = await auth();
  const isLearner = session?.user.role === "LEARNER";
  const learnerCourses = isLearner
    ? await loadLearnerCourseLinks(session.user.id)
    : null;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TopNav logoHref={logoHref ?? "/dashboard"} />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 md:flex-row">
        <Sidebar learnerCourses={learnerCourses} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
