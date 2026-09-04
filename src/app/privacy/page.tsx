import type { Metadata } from "next";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { PublicShell } from "@/components/shell/PublicShell";

const TITLE = "Privacy Policy";
const LAST_UPDATED = "September 3, 2026";
const SUPPORT_EMAIL = "info@oliveclinical.com";

export const metadata: Metadata = {
  title: TITLE,
  description: `The privacy policy for ${SITE_NAME}.`,
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
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
            from a lawyer, and it is not a substitute for whatever privacy
            notice applies to any healthcare services offered separately
            from this site. Have counsel review it before relying on it.
          </p>
        </div>

        <div className="flex flex-col gap-8 font-body text-base leading-relaxed text-[var(--color-ink)]">
          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              1. What this covers
            </h2>
            <p>
              This policy describes what {SITE_NAME} collects when you
              browse the site, create an account, buy a course, and work
              through it. {SITE_NAME} sells self-paced educational courses —
              it is not a healthcare provider, and using it does not create
              a clinical record. If you separately receive clinical
              services from an instructor outside of {SITE_NAME}, that
              relationship is governed by that provider&apos;s own notice of
              privacy practices, not this page.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              2. Information we collect
            </h2>
            <ul className="ml-5 flex list-disc flex-col gap-1">
              <li>
                <strong>Account information:</strong> name, email address,
                and a hashed password when you register.
              </li>
              <li>
                <strong>Purchase information:</strong> which courses you
                bought, when, and for how much. Card numbers are never sent
                to or stored by {SITE_NAME} — payment is handled entirely by
                Stripe, our payment processor.
              </li>
              <li>
                <strong>Course activity:</strong> which lessons
                you&apos;ve viewed and completed, quiz answers you submit
                (used only to show you the explanation, never scored or
                stored against you), and certificates issued to you.
              </li>
              <li>
                <strong>Technical information:</strong> IP address and
                timestamps associated with account actions like
                registration and password reset, kept for fraud and abuse
                prevention (see Section 5).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              3. How we use it
            </h2>
            <p>
              We use this information to run the site: create and secure
              your account, grant access to courses you&apos;ve bought,
              track your progress so you can pick up where you left off,
              issue certificates, send transactional email (verification,
              password reset, purchase receipts, course completion), and
              prevent abuse of registration and password-reset forms. We do
              not sell your information, and we do not use it for
              advertising.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              4. Who we share it with
            </h2>
            <p>
              We share the minimum necessary with the vendors that run the
              site on our behalf:
            </p>
            <ul className="ml-5 mt-2 flex list-disc flex-col gap-1">
              <li>
                <strong>Stripe</strong> — processes payments and holds your
                payment details; we never see your full card number.
              </li>
              <li>
                <strong>Cloudflare Stream</strong> — hosts and streams
                course video.
              </li>
              <li>
                Our hosting and email-delivery providers, to run the
                application and send you transactional email.
              </li>
            </ul>
            <p className="mt-2">
              We don&apos;t share your information with anyone else except
              to comply with the law, or with your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              5. Security
            </h2>
            <p>
              Passwords are stored hashed, never in plain text. Password
              reset and email verification use single-use tokens that are
              themselves stored only as a hash, so a database compromise
              alone can&apos;t be used to log in as you or verify an email
              on your behalf. Course video access is gated behind
              short-lived, per-viewer signed tokens rather than public
              links.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              6. Data retention
            </h2>
            <p>
              We keep account and purchase records for as long as your
              account exists, and afterward as needed to satisfy tax,
              accounting, and legal obligations. You can ask us to delete
              your account by emailing the address below; we&apos;ll retain
              only what the law requires us to (for example, payment
              records for tax purposes).
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              7. Your choices
            </h2>
            <p>
              You can review and update your name and email from{" "}
              <span className="whitespace-nowrap">Settings</span> at any
              time. You can ask us to export or delete your data by emailing
              us. Transactional email (verification, receipts, password
              reset, course completion) can&apos;t be turned off, since it&apos;s
              how the site delivers access you&apos;ve purchased — but we
              never send marketing email you haven&apos;t asked for.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              8. Children
            </h2>
            <p>
              {SITE_NAME} is not directed at children, and we do not
              knowingly collect information from anyone under 18.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              9. Changes to this policy
            </h2>
            <p>
              We may update this policy as the site changes. If we make a
              material change, we&apos;ll update the date at the top of this
              page.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-heading text-xl font-semibold text-[var(--color-olive)]">
              10. Contact
            </h2>
            <p>
              Questions about this policy, or a request to access or delete
              your data? Reach us at{" "}
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
