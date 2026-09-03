import { NextResponse } from "next/server";
import { z } from "zod";
import { PurchaseStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canPurchase, type PurchaseBlockedReason } from "@/lib/entitlements";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/site";

const bodySchema = z.object({
  courseId: z.string().trim().min(1, "courseId is required"),
});

/**
 * Maps a `canPurchase` refusal to an HTTP status. This route makes no
 * eligibility decision of its own — `canPurchase` is the one place that
 * rule lives, so every branch here is just picking a status code for an
 * answer it already gave.
 */
const STATUS_BY_REASON: Record<PurchaseBlockedReason, number> = {
  NO_ACCOUNT: 401,
  EMAIL_UNVERIFIED: 403,
  ALREADY_ENROLLED: 409,
  NOT_PURCHASABLE: 404,
};

const MESSAGE_BY_REASON: Record<PurchaseBlockedReason, string> = {
  NO_ACCOUNT: "Sign in to buy a course.",
  EMAIL_UNVERIFIED: "Confirm your email address before buying.",
  ALREADY_ENROLLED: "You already have access to this course.",
  NOT_PURCHASABLE: "This course isn't available for purchase.",
};

export async function POST(request: Request) {
  if (!stripeConfigured) {
    return NextResponse.json(
      { error: "Payments aren't configured yet." },
      { status: 500 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }
  const { courseId } = parsed.data;

  const session = await auth();
  const userId = session?.user.id ?? null;

  // canPurchase is the single access decision here too: it already covers
  // "signed in", "verified", "not already enrolled", and "actually for
  // sale" in one call, so this route never re-derives any of that itself.
  const eligibility = await canPurchase(userId, courseId);
  if (!eligibility.allowed) {
    return NextResponse.json(
      { error: MESSAGE_BY_REASON[eligibility.reason] },
      { status: STATUS_BY_REASON[eligibility.reason] },
    );
  }

  // canPurchase confirmed the course exists and is purchasable; this fetch
  // is only for the fields it doesn't return (price, title, slug).
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    select: { id: true, slug: true, title: true, priceCents: true },
  });

  // eligibility.allowed can only be true when userId was non-null — canPurchase
  // returns NO_ACCOUNT otherwise — so these assertions just restate that
  // invariant for the type checker.
  let checkoutSession;
  try {
    checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: userId!,
      customer_email: session!.user.email ?? undefined,
      metadata: { userId: userId!, courseId: course.id },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: course.priceCents,
            product_data: { name: course.title },
          },
        },
      ],
      // Stripe substitutes this literal placeholder itself — it must not be
      // encoded or interpolated away by URL construction.
      success_url: `${absoluteUrl("/checkout/success")}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${absoluteUrl("/checkout/cancel")}?course=${course.slug}`,
    });
  } catch (error) {
    // A network problem or a rejected request to Stripe should read as a
    // clear "try again", not an opaque 500 with a stack trace — nothing has
    // been written yet at this point, so there is nothing to unwind.
    console.error("[checkout] Stripe session creation failed", error);
    return NextResponse.json(
      { error: "Could not start checkout. Try again." },
      { status: 502 },
    );
  }

  if (!checkoutSession.url) {
    return NextResponse.json(
      { error: "Could not start checkout. Try again." },
      { status: 502 },
    );
  }

  // Keyed on the session id so the webhook can find this row without ever
  // trusting anything the client sends back.
  await prisma.purchase.create({
    data: {
      userId: userId!,
      courseId: course.id,
      stripeCheckoutSessionId: checkoutSession.id,
      amountCents: course.priceCents,
      currency: "usd",
      status: PurchaseStatus.PENDING,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
