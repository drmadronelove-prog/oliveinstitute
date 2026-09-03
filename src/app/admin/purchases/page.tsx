import Link from "next/link";
import { PurchaseStatus, Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";

function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function statusLabel(status: PurchaseStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function AdminPurchasesPage() {
  await requireRole(Role.ADMIN);

  const purchases = await prisma.purchase.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
    },
  });

  const totalsByMonth = new Map<string, number>();
  for (const purchase of purchases) {
    if (purchase.status !== PurchaseStatus.PAID || !purchase.paidAt) continue;
    const key = purchase.paidAt.toISOString().slice(0, 7); // "YYYY-MM"
    totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + purchase.amountCents);
  }
  const monthRows = Array.from(totalsByMonth.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([key, cents]) => ({
      label: new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        timeZone: "UTC",
      }),
      cents,
    }));

  return (
    <AppShell>
      <h1 className="mb-2 font-heading text-3xl font-semibold text-[var(--color-olive)]">
        Purchases
      </h1>
      <p className="mb-8 max-w-prose font-body text-sm text-[var(--color-ink-muted)]">
        Every Stripe checkout on the site, whatever it settled as.
      </p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Transactions
          </h2>
          {purchases.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-ink-muted)]">
              No purchases yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Learner</th>
                    <th className="py-2 pr-4">Course</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="border-b border-black/5 last:border-0"
                    >
                      <td className="py-3 pr-4 text-[var(--color-ink-muted)]">
                        {(purchase.paidAt ?? purchase.createdAt).toLocaleDateString(
                          "en-US",
                          { dateStyle: "medium" },
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/learners/${purchase.user.id}`}
                          className="text-[var(--color-olive)] underline underline-offset-2"
                        >
                          {purchase.user.name}
                        </Link>
                        <span className="block text-xs text-[var(--color-ink-muted)]">
                          {purchase.user.email}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/courses/${purchase.course.id}`}
                          className="text-[var(--color-olive)] underline underline-offset-2"
                        >
                          {purchase.course.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        {formatCents(purchase.amountCents, purchase.currency)}
                      </td>
                      <td className="py-3">
                        <Badge>{statusLabel(purchase.status)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Revenue by month
          </h2>
          {monthRows.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-ink-muted)]">
              No paid purchases yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {monthRows.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-4 font-body text-sm"
                >
                  <span className="text-[var(--color-ink)]">{row.label}</span>
                  <span className="font-medium text-[var(--color-ink)]">
                    {formatCents(row.cents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
