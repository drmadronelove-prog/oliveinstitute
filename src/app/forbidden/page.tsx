import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";

export default function ForbiddenPage() {
  return (
    <AppShell>
      <Card className="max-w-md" accentColor="var(--color-gold)">
        <h1 className="mb-2 font-heading text-xl font-semibold text-[var(--color-ink)]">
          403 — Access restricted
        </h1>
        <p className="mb-4 font-body text-sm text-[var(--color-ink-muted)]">
          You don&apos;t have permission to view this page. If you believe
          this is a mistake, contact an administrator.
        </p>
        <Link
          href="/dashboard"
          className="font-body text-sm text-[var(--color-olive)] underline underline-offset-2"
        >
          Return to your dashboard
        </Link>
      </Card>
    </AppShell>
  );
}
