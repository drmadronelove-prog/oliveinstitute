import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";

export default async function AdminEmailsPage() {
  await requireRole(Role.ADMIN);

  const emails = await prisma.directEmail.findMany({
    orderBy: { sentAt: "desc" },
    include: {
      sender: { select: { name: true } },
      recipient: { select: { name: true, email: true } },
    },
    take: 100,
  });

  return (
    <AppShell activeHref="/dashboard">
      <h1 className="mb-8 font-heading text-3xl font-semibold text-[var(--color-forest)]">
        Sent emails
      </h1>

      <Card>
        {emails.length === 0 ? (
          <p className="font-serif text-sm text-[var(--color-ink-muted)]">
            No emails sent yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left font-serif text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
                <th className="py-2 pr-4">Sent</th>
                <th className="py-2 pr-4">From</th>
                <th className="py-2 pr-4">To</th>
                <th className="py-2">Subject</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email) => (
                <tr key={email.id} className="border-b border-black/5 last:border-0">
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {email.sentAt.toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="py-2 pr-4">{email.sender.name}</td>
                  <td className="py-2 pr-4">
                    {email.recipient.name} &lt;{email.recipient.email}&gt;
                  </td>
                  <td className="py-2">{email.subject}</td>
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
