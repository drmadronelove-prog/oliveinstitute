import type { Metadata } from "next";
import Link from "next/link";
import { PurchaseStatus } from "@prisma/client";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { formatPrice } from "@/lib/format";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const session = await requireSession();

  if (!sessionId) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-lg px-6 py-16">
          <Card>
            <h1 className="mb-2 font-heading text-2xl font-semibold text-[var(--color-olive)]">
              Missing order
            </h1>
            <p className="font-body text-sm text-[var(--color-ink-muted)]">
              This page needs a checkout session to show — you may have
              navigated here directly rather than following a link from
              Stripe.
            </p>
          </Card>
        </div>
      </PublicShell>
    );
  }

  // The local Purchase row is the only thing this page trusts to say
  // whether access has been granted — its `status` is set exclusively by
  // the webhook handler (src/app/api/webhooks/stripe/route.ts), never by
  // this page. That is deliberate: reaching this URL only proves Stripe
  // redirected the browser here, not that the payment is real or that the
  // event has been verified. This page reads state; it never writes it.
  const purchase = await prisma.purchase.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: { course: { select: { id: true, slug: true, title: true } } },
  });

  // Scoped to the signed-in visitor: don't let one person's session_id show
  // another person's order details.
  if (!purchase || purchase.userId !== session.user.id) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-lg px-6 py-16">
          <Card>
            <h1 className="mb-2 font-heading text-2xl font-semibold text-[var(--color-olive)]">
              We couldn&apos;t find that order
            </h1>
            <p className="font-body text-sm text-[var(--color-ink-muted)]">
              Check{" "}
              <Link
                href="/settings"
                className="text-[var(--color-olive)] underline underline-offset-2"
              >
                your purchase history
              </Link>{" "}
              instead, or contact us if you were charged and don&apos;t see it
              there.
            </p>
          </Card>
        </div>
      </PublicShell>
    );
  }

  // Best-effort, display only: a receipt line pulled from Stripe's own
  // record of the session. If this fails or Stripe isn't configured, the
  // page still renders from the local Purchase row alone.
  let paymentStatus: string | null = null;
  if (stripeConfigured) {
    try {
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
      paymentStatus = stripeSession.payment_status;
    } catch {
      paymentStatus = null;
    }
  }

  const paid = purchase.status === PurchaseStatus.PAID;

  return (
    <PublicShell>
      <div className="mx-auto max-w-lg px-6 py-16">
        <Card>
          {paid ? (
            <>
              <h1 className="mb-2 font-heading text-2xl font-semibold text-[var(--color-olive)]">
                Payment received
              </h1>
              <p className="mb-6 font-body text-sm text-[var(--color-ink-muted)]">
                Thanks — you now have access to{" "}
                <span className="font-medium text-[var(--color-ink)]">
                  {purchase.course.title}
                </span>
                .
              </p>

              <dl className="mb-6 flex flex-col gap-1 border-y border-black/10 py-4 font-body text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-muted)]">Course</dt>
                  <dd className="text-[var(--color-ink)]">
                    {purchase.course.title}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-muted)]">Amount</dt>
                  <dd className="text-[var(--color-ink)]">
                    {formatPrice(purchase.amountCents, purchase.currency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-ink-muted)]">Date</dt>
                  <dd className="text-[var(--color-ink)]">
                    {(purchase.paidAt ?? purchase.createdAt).toLocaleDateString(
                      "en-US",
                      { dateStyle: "medium" },
                    )}
                  </dd>
                </div>
              </dl>

              <Link
                href={`/student/courses/${purchase.course.id}`}
                className="block rounded-md bg-[var(--color-olive)] px-4 py-2.5 text-center font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)]"
              >
                Go to course
              </Link>
            </>
          ) : (
            <>
              <h1 className="mb-2 font-heading text-2xl font-semibold text-[var(--color-olive)]">
                Finishing up
              </h1>
              <p className="mb-6 font-body text-sm text-[var(--color-ink-muted)]">
                {paymentStatus === "paid"
                  ? "Stripe shows your payment went through — we're just finishing setting up your access. This is usually instant; refresh in a moment."
                  : "We're confirming your payment with Stripe. This page will update automatically."}
              </p>
              <Link
                href={`/courses/${purchase.course.slug}`}
                className="block rounded-md border border-[var(--color-olive)] px-4 py-2.5 text-center font-body text-sm font-medium text-[var(--color-olive)] transition-colors hover:bg-[var(--color-olive)] hover:text-white"
              >
                Back to the course page
              </Link>
              {/* A plain, no-JS refresh: the webhook is normally near-instant, so one
                  automatic reload resolves the common case without any client script. */}
              <meta httpEquiv="refresh" content="4" />
            </>
          )}
        </Card>
      </div>
    </PublicShell>
  );
}
