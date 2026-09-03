import type { Metadata } from "next";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { PublicShell } from "@/components/shell/PublicShell";

const TITLE = "Terms of Service";

export const metadata: Metadata = {
  title: TITLE,
  description: `The terms of service for ${SITE_NAME}.`,
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-10">
        <h1 className="mb-6 font-heading text-4xl font-semibold text-[var(--color-olive)]">
          {TITLE}
        </h1>

        <div className="rounded-xl border-l-4 border-[var(--color-terracotta)] bg-[var(--color-card)] p-6 shadow-sm ring-1 ring-black/5">
          <p className="font-body text-sm text-[var(--color-ink)]">
            <strong>Placeholder.</strong> The registration form asks people to
            accept this document, so it needs real text before the site takes
            sign-ups in earnest. Have a lawyer draft it; nothing here is legal
            advice or a usable substitute.
          </p>
        </div>

        <p className="mt-6 max-w-prose font-body text-sm text-[var(--color-ink-muted)]">
          Replace this page with the terms of service covering, at minimum, what data
          {SITE_NAME} collects, how course access and refunds work, and how to
          get in touch.
        </p>
      </div>
    </PublicShell>
  );
}
