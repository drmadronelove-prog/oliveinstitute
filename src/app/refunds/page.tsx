import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { PublicShell } from "@/components/shell/PublicShell";

const TITLE = "Refund Policy";
const LAST_UPDATED = "September 3, 2026";
const SUPPORT_EMAIL = "info@oliveclinical.com";

export const metadata: Metadata = {
  title: TITLE,
  description: `The refund policy for ${SITE_NAME}.`,
  alternates: { canonical: absoluteUrl("/refunds") },
};

export default function RefundsPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-10">
        <h1 className="mb-2 font-heading text-4xl font-semibold text-[var(--color-olive)]">
          {TITLE}
        </h1>
        <p className="mb-8 font-body text-sm text-[var(--color-ink-muted)]">
          Last updated {LAST_UPDATED}
        </p>

        <div className="mb-8 rounded-xl border-l-4 border-[var(--color-gold)] bg-[var(--color-card)] p-5 shadow-sm ring-1 ring-black/5">
          <p className="font-body text-sm text-[var(--color-ink)]">
            This document was drafted with AI assistance and reviewed for
            plain-language accuracy, but it is not a substitute for advice
            from a lawyer. Have counsel review it before relying on it.
          </p>
        </div>

        <div className="flex flex-col gap-8 font-body text-base leading-relaxed text-[var(--color-ink)]">
          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              14-day money-back guarantee
            </h2>
            <p>
              If a course isn&apos;t right for you, email{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-[var(--color-olive)] underline underline-offset-2"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              within 14 days of your purchase and ask for a refund. We
              don&apos;t ask why, and we don&apos;t require you to have
              watched a certain amount or none at all — this is a genuine
              guarantee, not a formality. Include the email address on your
              account and, if you have it, the course name.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              How a refund is processed
            </h2>
            <p>
              We issue refunds through Stripe back to your original payment
              method. It typically takes 5–10 business days to appear,
              depending on your bank or card issuer. You&apos;ll get an
              email from Stripe confirming the refund once we&apos;ve issued
              it.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              Refunding a course removes your access
            </h2>
            <p>
              Because a course purchase grants ongoing access to that
              course, a refund removes that access immediately and
              automatically — this happens the moment the refund is issued,
              not on request. If you&apos;ve made real progress and want to
              keep it, download or note anything you need before asking for
              a refund. A certificate already issued for a course
              you&apos;re refunding is no longer valid once access is
              revoked.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              After 14 days
            </h2>
            <p>
              Outside the 14-day window, refunds are considered case by case
              — for example, a course that was materially different from
              its listing, or a technical problem on our end that kept you
              from accessing content you paid for. Email us and
              we&apos;ll take a look.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              Related
            </h2>
            <p>
              This policy is part of our{" "}
              <Link
                href="/terms"
                className="text-[var(--color-olive)] underline underline-offset-2"
              >
                Terms of Service
              </Link>
              . See our{" "}
              <Link
                href="/privacy"
                className="text-[var(--color-olive)] underline underline-offset-2"
              >
                Privacy Policy
              </Link>{" "}
              for how we handle payment and account information.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              Contact
            </h2>
            <p>
              Questions about a purchase or a refund? Reach us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-[var(--color-olive)] underline underline-offset-2"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </PublicShell>
  );
}
