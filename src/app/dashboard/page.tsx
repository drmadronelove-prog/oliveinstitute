import Link from "next/link";
import { CourseStatus, PurchaseStatus, Role } from "@prisma/client";
import { signOut } from "@/lib/auth";
import { withBasePath } from "@/lib/basePath";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatMinutes, formatPrice, trackLabel } from "@/lib/format";
import {
  getLearnerCourseSummaries,
  resolveContinueLessonSlug,
} from "@/lib/progress";
import { AppShell } from "@/components/shell/AppShell";
import { DashboardBand } from "@/components/dashboard/DashboardBand";
import { NextUpPanel } from "@/components/dashboard/NextUpPanel";
import { StatGrid, type Stat } from "@/components/dashboard/StatGrid";
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

/**
 * The four figures on the admin band. Revenue counts PAID purchases only —
 * a refunded one is reversed in the webhook, so it is no longer revenue
 * (see CLAUDE.md, "Payments").
 */
async function loadAdminStats(): Promise<Stat[]> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [publishedCourses, learners, enrollmentsThisMonth, revenue] =
    await Promise.all([
      prisma.course.count({ where: { status: CourseStatus.PUBLISHED } }),
      prisma.user.count({ where: { role: Role.LEARNER } }),
      prisma.enrollment.count({ where: { grantedAt: { gte: startOfMonth } } }),
      prisma.purchase.aggregate({
        _sum: { amountCents: true },
        where: {
          status: PurchaseStatus.PAID,
          paidAt: { gte: startOfMonth },
        },
      }),
    ]);

  return [
    { label: "Published courses", value: String(publishedCourses) },
    { label: "Learners", value: String(learners) },
    { label: "Enrollments this month", value: String(enrollmentsThisMonth) },
    {
      label: "Revenue this month",
      value: formatPrice(revenue._sum.amountCents ?? 0).replace("Free", "$0.00"),
    },
  ];
}

function AccountBar({
  name,
  role,
}: {
  name: string | null | undefined;
  role: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <p className="m-0 font-body text-[15px] text-[var(--muted)]">
        Signed in as{" "}
        <span className="font-semibold text-[var(--ink)]">{name}</span>
        <span className="ml-2 font-body text-[11px] font-semibold tracking-[0.12em] text-[var(--role-chip)]">
          {role}
        </span>
      </p>
      <div className="flex items-center gap-[18px]">
        <Link
          href="/settings"
          className="font-body text-[15px] font-medium text-[var(--ink)] underline decoration-[var(--ink)]/35 underline-offset-4 hover:decoration-[var(--ink)]"
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
            className="font-body text-[15px] font-medium text-[var(--ink)] underline decoration-[var(--ink)]/35 underline-offset-4 hover:decoration-[var(--ink)]"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

/** The learner's most recently touched course, or null if they own none. */
async function loadNextUp(userId: string) {
  const summaries = await getLearnerCourseSummaries(userId);
  const current = summaries[0];
  if (!current) return null;

  const continueSlug = await resolveContinueLessonSlug(
    userId,
    current.courseId,
  );

  return {
    courseTitle: current.courseTitle,
    href: continueSlug
      ? `/learn/${current.courseSlug}/${continueSlug}`
      : null,
    ctaLabel: current.completedAt
      ? "Review course"
      : current.completedLessons > 0
        ? "Keep going"
        : "Start course",
    chips: [
      formatMinutes(current.estimatedMinutes),
      `${current.percent}% complete`,
    ],
    completedLessons: current.completedLessons,
    totalLessons: current.totalLessons,
    percent: current.percent,
  };
}

export default async function DashboardPage() {
  const session = await requireSession();
  const rolePanelData = await loadRolePanelData(
    session.user.id,
    session.user.role,
  );

  if (session.user.role === "LEARNER") {
    const nextUp = await loadNextUp(session.user.id);
    const firstName = session.user.name?.split(" ")[0] ?? "there";

    return (
      <AppShell>
        <AccountBar name={session.user.name} role={session.user.role} />
        <DashboardBand
          tone="plum"
          title={
            <>
              Welcome back, <em className="italic text-[var(--gold-on-plum)]">{firstName}.</em>
            </>
          }
          subtext="One lesson at a time is plenty. Your place is saved wherever you stop."
        />
        {nextUp ? <NextUpPanel {...nextUp} /> : null}
        <RolePanel {...rolePanelData} />
        <div className="pop mt-7 flex flex-wrap items-baseline gap-3 rounded-2xl bg-[var(--dusk)] px-6 py-5 font-body text-[15px] text-[var(--ink)]">
          <b className="font-heading text-[19px] font-medium">No streaks.</b>
          Take a week off, a month off. Your place is saved and nothing expires.
        </div>
      </AppShell>
    );
  }

  const stats =
    session.user.role === "ADMIN" ? await loadAdminStats() : null;

  return (
    <AppShell>
      <AccountBar name={session.user.name} role={session.user.role} />
      <DashboardBand
        tone="gold"
        title={
          <>
            Olive <em className="italic text-[var(--plum-on-gold)]">Institute</em>
          </>
        }
        subtext="Self-paced courses, available whenever you are."
      />
      {stats ? <StatGrid stats={stats} /> : null}
      <RolePanel {...rolePanelData} />
    </AppShell>
  );
}
