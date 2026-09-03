import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { EnrollmentSource, PurchaseStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { sendPurchaseReceiptEmail } from "@/lib/purchaseEmails";

/**
 * CRITICAL: this webhook is the only place a purchase turns into access.
 * Nothing else — not the success page, not the client redirect Stripe sends
 * the browser to — creates or upserts an Enrollment with source PURCHASE.
 * A browser reaching /checkout/success proves Stripe redirected it there,
 * not that the payment is real or that this event has been verified; only a
 * signed webhook delivery does. Keep it that way: granting access from the
 * success page would let anyone with the URL shape grant themselves a
 * course for free.
 */

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const purchase = await prisma.purchase.findUnique({
    where: { stripeCheckoutSessionId: session.id },
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { title: true, slug: true } },
    },
  });

  // No local Purchase row for this session id. Every session this app
  // creates is paired with one before Stripe can ever redirect back, so
  // there is nothing to reconcile — not an error, just nothing to do.
  if (!purchase) return;

  // Idempotent: Stripe redelivers events (both on our own non-2xx replies
  // and just as routine "at least once" delivery), so the same event can
  // arrive more than once even after a fully successful first delivery.
  // Skipping an already-PAID purchase is what stops the transaction below
  // from running twice and the receipt email from going out twice.
  if (purchase.status === PurchaseStatus.PAID) return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  await prisma.$transaction(async (tx) => {
    await tx.purchase.update({
      where: { id: purchase.id },
      data: {
        status: PurchaseStatus.PAID,
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
      },
    });

    // Upsert, not create: the unique constraint on (userId, courseId) is
    // what turns a second delivery of this same event into a no-op instead
    // of a duplicate Enrollment or a thrown unique-constraint error.
    await tx.enrollment.upsert({
      where: {
        userId_courseId: { userId: purchase.userId, courseId: purchase.courseId },
      },
      update: { source: EnrollmentSource.PURCHASE, purchaseId: purchase.id },
      create: {
        userId: purchase.userId,
        courseId: purchase.courseId,
        source: EnrollmentSource.PURCHASE,
        purchaseId: purchase.id,
      },
    });
  });

  // Best-effort: access is already durably granted by the transaction above
  // regardless of whether this succeeds, and a flaky email provider must
  // not turn into a 5xx that makes Stripe hammer retries — a retry would
  // re-run this handler, find the purchase already PAID, and skip the email
  // anyway, so failing loud here would not even get the email resent.
  try {
    await sendPurchaseReceiptEmail({
      to: purchase.user.email,
      name: purchase.user.name,
      courseTitle: purchase.course.title,
      courseSlug: purchase.course.slug,
      amountCents: purchase.amountCents,
      currency: purchase.currency,
    });
  } catch (error) {
    console.error("[stripe webhook] failed to send purchase receipt", error);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? null);

  if (!paymentIntentId) return;

  const purchase = await prisma.purchase.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });
  if (!purchase) return;

  // Idempotent for the same reason as the completed handler above.
  if (purchase.status === PurchaseStatus.REFUNDED) return;

  await prisma.$transaction([
    prisma.purchase.update({
      where: { id: purchase.id },
      data: { status: PurchaseStatus.REFUNDED, refundedAt: new Date() },
    }),
    // deleteMany, not delete: it is a no-op instead of a "record not found"
    // throw if the enrollment is already gone (a replay, or it was already
    // removed some other way), and scoping to this purchaseId means a
    // refund never removes access that was re-granted some other way (a
    // comp) after the fact.
    prisma.enrollment.deleteMany({
      where: {
        userId: purchase.userId,
        courseId: purchase.courseId,
        purchaseId: purchase.id,
      },
    }),
  ]);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Refuse rather than trust an unverifiable body — without a secret
    // there is no way to tell a real Stripe delivery from anyone who found
    // this URL.
    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // The raw request text, not request.json(): Stripe signs the exact bytes
  // it sent, and re-serializing a parsed object (even with no visible
  // difference) would break verification. Route Handlers in the App Router
  // do no implicit body parsing, so this is genuinely the untouched body —
  // unlike the old Pages API, there is no bodyParser flag to disable.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid signature";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object);
      break;
    default:
      // Every other event type is acknowledged, not rejected — a 4xx/5xx
      // here would make Stripe retry an event this route was never going
      // to act on.
      break;
  }

  return NextResponse.json({ received: true });
}
