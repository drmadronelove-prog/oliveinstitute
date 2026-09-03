import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";

async function loadStudentCourseLinks(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: { course: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return {
    active: enrollments
      .filter((e) => e.status === "ACTIVE")
      .map((e) => ({ id: e.course.id, title: e.course.title })),
    past: enrollments
      .filter((e) => e.status !== "ACTIVE")
      .map((e) => ({ id: e.course.id, title: e.course.title })),
  };
}

export async function AppShell({
  children,
  activeHref,
  logoHref,
}: {
  children: ReactNode;
  activeHref?: string;
  /** Overrides the default role-based logo destination. */
  logoHref?: string;
}) {
  const session = await auth();
  const isStudent = session?.user.role === "STUDENT";
  const studentCourses = isStudent
    ? await loadStudentCourseLinks(session.user.id)
    : null;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TopNav
        activeHref={activeHref}
        logoHref={logoHref ?? (isStudent ? "https://satistudies.org" : "/dashboard")}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 md:flex-row">
        <Sidebar studentCourses={studentCourses} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
