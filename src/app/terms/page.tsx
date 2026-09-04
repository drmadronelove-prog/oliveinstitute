import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { PublicShell } from "@/components/shell/PublicShell";

const TITLE = "Terms of Service";
const LAST_UPDATED = "September 3, 2026";
const SUPPORT_EMAIL = "info@oliveclinical.com";

export const metadata: Metadata = {
  title: TITLE,
  description: `The terms of service for ${SITE_NAME}.`,
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
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
            from a lawyer. Given that {SITE_NAME} takes real payments and
            some courses are taught by a licensed clinician, have counsel
            review this before relying on it for a dispute.
          </p>
        </div>

        <div className="flex flex-col gap-8 font-body text-base leading-relaxed text-[var(--color-ink)]">
          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              1. What {SITE_NAME} is
            </h2>
            <p>
              {SITE_NAME} is a storefront for self-paced online courses. You
              create an account, buy access to a course, and work through it
              on your own schedule. There are no live sessions, cohorts, or
              instructor office hours — everything is pre-recorded video,
              written material, and optional knowledge checks.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              2. Your account
            </h2>
            <p>
              You must provide accurate information when you register and
              keep your password confidential. You&apos;re responsible for
              activity that happens under your account. Tell us right away
              at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-[var(--color-olive)] underline underline-offset-2"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              if you think someone else has access to it.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              3. Purchases and access
            </h2>
            <p>
              Course prices are shown in U.S. dollars on each course page.
              Payment is processed by Stripe; we never see or store your
              card details. When a purchase completes, you get access to
              that course for as long as {SITE_NAME} continues to offer it —
              access is not time-limited, but it is not guaranteed forever
              if a course is discontinued. Access is personal to your
              account and may not be shared, resold, or transferred.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              4. Refunds
            </h2>
            <p>
              Refund eligibility is covered in our{" "}
              <Link
                href="/refunds"
                className="text-[var(--color-olive)] underline underline-offset-2"
              >
                Refund Policy
              </Link>
              , which is part of these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              5. Course content isn&apos;t professional advice
            </h2>
            <p>
              Course material — including anything taught by a licensed
              clinician — is educational content, not therapy, medical
              advice, or a substitute for professional care. Completing a
              course does not create a clinician-client, therapist-client,
              or provider-patient relationship between you and the
              instructor or {SITE_NAME}. If a course is described as
              continuing-education content for clinicians, its listing
              states plainly whether it is approved for CE credit by any
              specific body — do not assume it is unless that page says so.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              6. Acceptable use
            </h2>
            <p>
              Course video, text, downloadable resources, and certificates
              are for your personal, non-commercial use. Don&apos;t
              download, redistribute, re-record, or share course content
              outside your own learning, and don&apos;t attempt to bypass
              access controls or share your login. We may suspend or
              terminate an account that violates this section.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              7. Intellectual property
            </h2>
            <p>
              All course content, the {SITE_NAME} name, and the site itself
              are owned by {SITE_NAME} or its instructors and licensors.
              Nothing in these Terms transfers ownership of that content to
              you — buying a course grants you a license to view it, not a
              copy to keep or reuse.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              8. Disclaimers and limitation of liability
            </h2>
            <p>
              The site and its courses are provided &quot;as is,&quot;
              without warranties of any kind, to the extent the law allows.
              {SITE_NAME} is not liable for indirect, incidental, or
              consequential damages arising from your use of the site or
              reliance on course content. Nothing here limits liability
              where the law doesn&apos;t allow it to be limited.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              9. Changes to these terms
            </h2>
            <p>
              We may update these Terms as the site changes. If we make a
              material change, we&apos;ll update the date at the top of this
              page. Continuing to use {SITE_NAME} after a change takes
              effect means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              10. Governing law
            </h2>
            <p>
              These Terms are governed by the laws of the State of
              California, without regard to its conflict-of-laws
              provisions.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              11. Contact
            </h2>
            <p>
              Questions about these Terms? Reach us at{" "}
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
