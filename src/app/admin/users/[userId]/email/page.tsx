import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { ComposeEmailForm } from "@/components/email/ComposeEmailForm";

export default async function AdminEmailUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireRole(Role.ADMIN);
  const { userId } = await params;

  const recipient = await prisma.user.findUnique({ where: { id: userId } });
  if (!recipient) {
    notFound();
  }

  return (
    <AppShell activeHref="/dashboard">
      <p className="mb-2 font-serif text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        <Link href="/admin/users" className="underline underline-offset-2">
          Manage users
        </Link>{" "}
        / Email {recipient.name}
      </p>
      <h1 className="mb-8 font-heading text-3xl font-semibold text-[var(--color-forest)]">
        Email {recipient.name}
      </h1>

      <Card className="max-w-lg">
        <ComposeEmailForm
          recipientId={recipient.id}
          recipientName={recipient.name}
          recipientEmail={recipient.email}
        />
      </Card>
    </AppShell>
  );
}
