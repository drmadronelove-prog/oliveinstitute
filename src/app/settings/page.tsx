import Link from "next/link";
import { PurchaseStatus } from "@prisma/client";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProfileForm } from "./ProfileForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { ResendVerificationButton } from "./ResendVerificationButton";

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-1 font-heading text-xl font-semibold text-[var(--color-ink)]">
        {title}
      </h2>
      {description ? (
        <p className="mb-3 max-w-prose font-body text-sm text-[var(--color-ink-muted)]">
          {description}
        </p>
      ) : (
        <div className="mb-3" />
      )}
      <Card className="max-w-2xl">{children}</Card>
    </section>
  );
}

export default async function SettingsPage() {
  const session = await requireSession();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true, emailVerifiedAt: true },
  });

  const purchases = await prisma.purchase.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { course: { select: { slug: true, title: true } } },
  });

  return (
    <AppShell>
      <h1 className="mb-2 font-heading text-3xl font-semibold text-[var(--color-olive)]">
        Settings
      </h1>
      <p className="mb-8 font-body text-sm text-[var(--color-ink-muted)]">
        Signed in as {user.email}
        {user.emailVerifiedAt ? null : " · email not confirmed"}
      </p>

      <div className="flex flex-col gap-10">
        <Panel title="Profile" description="How your name appears on the site.">
          <ProfileForm name={user.name} email={user.email} />

          {user.emailVerifiedAt ? null : (
            <div className="mt-6 border-t border-black/10 pt-4">
              <p className="font-body text-sm text-[var(--color-ink)]">
                Your email address isn&apos;t confirmed yet. You can browse and
                watch free previews, but you&apos;ll need to confirm it before
                buying a course.
              </p>
              <ResendVerificationButton />
            </div>
          )}
        </Panel>

        <Panel
          title="Change password"
          description="You'll stay signed in on this device."
        >
          <ChangePasswordForm />
        </Panel>

        <Panel
          title="Purchase history"
          description="Every checkout on your account."
        >
          {purchases.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-ink-muted)]">
              No purchases yet.{" "}
              <Link
                href="/explore"
                className="text-[var(--color-olive)] underline underline-offset-2"
              >
                Browse the catalogue
              </Link>
              .
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
                    <th className="py-2 pr-4">Course</th>
                    <th className="py-2 pr-4">Date</th>
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
                      <td className="py-3 pr-4">
                        <Link
                          href={`/courses/${purchase.course.slug}`}
                          className="text-[var(--color-olive)] underline underline-offset-2"
                        >
                          {purchase.course.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-[var(--color-ink-muted)]">
                        {(purchase.paidAt ?? purchase.createdAt).toLocaleDateString(
                          "en-US",
                          { dateStyle: "medium" },
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {formatPrice(purchase.amountCents, purchase.currency)}
                      </td>
                      <td className="py-3">
                        <Badge>
                          {purchase.status === PurchaseStatus.PAID
                            ? "Paid"
                            : purchase.status.charAt(0) +
                              purchase.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
