import Link from "next/link";
import { signOut } from "@/lib/auth";
import { withBasePath } from "@/lib/basePath";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatMinutes, trackLabel } from "@/lib/format";
import { AppShell } from "@/components/shell/AppShell";
import { HeroCard } from "@/components/dashboard/HeroCard";
import { RolePanel } from "@/components/dashboard/RolePanel";

async function loadRolePanelData(userId: string, role: string) {
  if (role === "INSTRUCTOR") {
    const courses = await prisma.course.findMany({
      where: { instructorId: userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { enrollments: true } } },
    });
    return {
      role: "INSTRUCTOR" as const,
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        meta: `${trackLabel(course.track)} · ${course.status} · ${formatMinutes(course.estimatedMinutes)}`,
        secondaryLabel: `${course._count.enrollments} enrolled`,
      })),
    };
  }

  if (role === "LEARNER") {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      orderBy: { grantedAt: "desc" },
      include: { course: true },
    });
    return {
      role: "LEARNER" as const,
      courses: enrollments.map((enrollment) => ({
        id: enrollment.course.id,
        title: enrollment.course.title,
        meta: `${trackLabel(enrollment.course.track)} · ${formatMinutes(enrollment.course.estimatedMinutes)}`,
        secondaryLabel: enrollment.completedAt ? "Completed" : undefined,
      })),
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
      <p className="font-body text-sm text-[var(--color-ink-muted)]">
        Signed in as{" "}
        <span className="font-medium text-[var(--color-ink)]">{name}</span>{" "}
        &middot;{" "}
        <span className="text-[0.65625rem] font-semibold tracking-[0.1em] text-[var(--color-gold-dark)]">
          {role}
        </span>
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="font-body text-sm text-[var(--color-olive)] underline underline-offset-2 hover:text-[var(--color-olive-dark)]"
        >
          Settings
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: withBasePath("/login") });
          }}
        >
          <button
            type="submit"
            className="font-body text-sm text-[var(--color-olive)] underline underline-offset-2 hover:text-[var(--color-olive-dark)]"
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

  if (session.user.role === "LEARNER") {
    const rolePanelData = await loadRolePanelData(session.user.id, session.user.role);
    return (
      <AppShell>
        <h1 className="sr-only">Dashboard</h1>
        <AccountBar name={session.user.name} role={session.user.role} />
        <RolePanel {...rolePanelData} />
      </AppShell>
    );
  }

  const rolePanelData = await loadRolePanelData(session.user.id, session.user.role);

  return (
    <AppShell>
      <AccountBar name={session.user.name} role={session.user.role} />

      <HeroCard
        title="Olive Institute"
        subtext="Self-paced courses, available whenever you are"
        imageSrc="/olive-blobs.png"
        imageAlt=""
        imageClassName="object-contain"
        imageAspectRatio="1 / 1"
      />

      <div className="mt-10">
        <RolePanel {...rolePanelData} />
      </div>
    </AppShell>
  );
}
