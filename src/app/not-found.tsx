import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <AppShell>
      <Card className="max-w-md" accentColor="var(--color-gold)">
        <h1 className="mb-2 font-heading text-xl font-semibold text-[var(--color-ink)]">
          404 — Page not found
        </h1>
        <p className="mb-4 font-serif text-sm text-[var(--color-ink-muted)]">
          That page doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
        <Link
          href="/dashboard"
          className="font-serif text-sm text-[var(--color-forest)] underline underline-offset-2"
        >
          Return to your dashboard
        </Link>
      </Card>
    </AppShell>
  );
}
