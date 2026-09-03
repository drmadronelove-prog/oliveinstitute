import { signOut } from "@/lib/auth";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { CREDIT_STATUS_LABEL } from "@/lib/labels";
import { AppShell } from "@/components/shell/AppShell";
import { HeroCard } from "@/components/dashboard/HeroCard";
import { RolePanel } from "@/components/dashboard/RolePanel";

async function loadRolePanelData(userId: string, role: string) {
  if (role === "PROFESSOR") {
    const courses = await prisma.course.findMany({
      where: { professorId: userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { enrollments: true } } },
    });
    return {
      role: "PROFESSOR" as const,
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        term: course.term,
        credits: course.credits,
        secondaryLabel: `${course._count.enrollments} enrolled`,
      })),
    };
  }

  if (role === "STUDENT") {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { course: true },
    });
    const toSummary = (enrollment: (typeof enrollments)[number]) => ({
      id: enrollment.course.id,
      title: enrollment.course.title,
      term: enrollment.course.term,
      credits: enrollment.course.credits,
      secondaryLabel:
        enrollment.status === "DROPPED"
          ? "Dropped"
          : CREDIT_STATUS_LABEL[enrollment.creditStatus],
    });
    return {
      role: "STUDENT" as const,
      activeCourses: enrollments.filter((e) => e.status === "ACTIVE").map(toSummary),
      pastCourses: enrollments.filter((e) => e.status !== "ACTIVE").map(toSummary),
    };
  }

  return { role: "ADMIN" as const };
}

function AccountBar({
  name,
  role,
}: {
  name: string | null | undefined;
  role: string;
}) {
  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      <p className="font-serif text-sm text-[var(--color-ink-muted)]">
        Signed in as{" "}
        <span className="font-medium text-[var(--color-ink)]">{name}</span>{" "}
        &middot;{" "}
        <span className="text-[0.65625rem] font-semibold tracking-[0.1em] text-[var(--color-gold-dark)]">
          {role}
        </span>
      </p>
      <div className="flex items-center gap-4">
        <a
          href="/settings/password"
          className="font-serif text-sm text-[var(--color-forest)] underline underline-offset-2 hover:text-[var(--color-forest-dark)]"
        >
          Change password
        </a>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="font-serif text-sm text-[var(--color-forest)] underline underline-offset-2 hover:text-[var(--color-forest-dark)]"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await requireSession();

  if (session.user.role === "STUDENT") {
    const rolePanelData = await loadRolePanelData(session.user.id, session.user.role);
    return (
      <AppShell activeHref="/dashboard" logoHref="https://satistudies.org">
        <AccountBar name={session.user.name} role={session.user.role} />
        <RolePanel {...rolePanelData} />
      </AppShell>
    );
  }

  const rolePanelData = await loadRolePanelData(session.user.id, session.user.role);

  return (
    <AppShell activeHref="/dashboard" logoHref="https://satistudies.org">
      <AccountBar name={session.user.name} role={session.user.role} />

      <HeroCard
        title="Sati Certificate Program"
        subtext="Access to current and previously enrolled courses"
        imageSrc="/wilsan-u-aiUIs74ejx8-unsplash.jpg"
        imageAlt="A bronze Buddha statue resting its head on its hand, in front of a sunlit window with greenery"
        imageAspectRatio="3 / 2"
      />

      <div className="mt-10">
        <RolePanel {...rolePanelData} />
      </div>
    </AppShell>
  );
}
