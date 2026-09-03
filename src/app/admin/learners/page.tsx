import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { withBasePath } from "@/lib/basePath";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";

export default async function AdminLearnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole(Role.ADMIN);
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const learners = await prisma.user.findMany({
    where: {
      role: Role.LEARNER,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { enrollments: true } } },
  });

  return (
    <AppShell>
      <h1 className="mb-2 font-heading text-3xl font-semibold text-[var(--color-olive)]">
        Learners
      </h1>
      <p className="mb-8 max-w-prose font-body text-sm text-[var(--color-ink-muted)]">
        Search learners, review what they&apos;re enrolled in, and grant
        comp access to a course by hand.
      </p>

      <Card>
        <form className="mb-4 flex gap-2" action={withBasePath("/admin/learners")}>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by name or email…"
            className="w-full max-w-sm rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
          />
          <button
            type="submit"
            className="rounded-md border border-[var(--color-olive)] px-4 py-2 font-body text-sm text-[var(--color-olive)] transition-colors hover:bg-[var(--color-olive)] hover:text-white"
          >
            Search
          </button>
        </form>

        {learners.length === 0 ? (
          <p className="font-body text-sm text-[var(--color-ink-muted)]">
            {query ? `No learners match "${query}".` : "No learners yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Enrollments</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {learners.map((learner) => (
                  <tr
                    key={learner.id}
                    className="border-b border-black/5 last:border-0"
                  >
                    <td className="py-3 pr-4">{learner.name}</td>
                    <td className="py-3 pr-4">{learner.email}</td>
                    <td className="py-3 pr-4">{learner._count.enrollments}</td>
                    <td className="py-3">
                      <Link
                        href={`/admin/learners/${learner.id}`}
                        className="font-body text-xs text-[var(--color-olive)] underline underline-offset-2"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
