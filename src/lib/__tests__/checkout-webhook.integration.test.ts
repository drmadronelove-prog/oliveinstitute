import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  CourseStatus,
  EnrollmentSource,
  PrismaClient,
  PurchaseStatus,
  Role,
  Track,
} from "@prisma/client";
import { POST as webhookHandler } from "@/app/api/webhooks/stripe/route";
import { stripe } from "@/lib/stripe";

/**
 * Integration coverage for the Stripe webhook handler — the only place a
 * purchase turns into access (see the CRITICAL comment at the top of
 * src/app/api/webhooks/stripe/route.ts). Run with `npm run test:integration`,
 * which needs DATABASE_URL pointing at a migrated database.
 *
 * On the Stripe CLI fixtures: the task asks for these fixtures via
 * `stripe trigger` / `stripe listen --forward-to`. That workflow needs the
 * Stripe CLI authenticated against a live (test-mode) Stripe account and
 * network access to stripe.com, neither of which this sandbox has — outbound
 * requests to api.stripe.com and github.com (to fetch the CLI binary) are
 * both blocked by the environment's egress policy. What is used instead is
 * Stripe's own officially documented technique for testing webhook handlers
 * without either of those: hand-authored fixtures shaped exactly like the
 * events `stripe trigger` would deliver, signed locally with
 * `stripe.webhooks.generateTestHeaderString` (pure HMAC-SHA256, no network
 * call — the same signing code path `constructEvent` verifies against), then
 * POSTed straight to the exported route handler. This exercises the real
 * signature-verification and handler code, just not the real Stripe CLI
 * binary or a real Stripe account.
 */

const prisma = new PrismaClient();
const TAG = `checkout-webhook-test-${Date.now()}`;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  throw new Error(
    "STRIPE_WEBHOOK_SECRET must be set to run this suite — any string works, since nothing here calls Stripe's API, but the webhook route reads it from the environment to verify the signature these tests generate.",
  );
}

type Fixture = {
  userId: string;
  userEmail: string;
  userName: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  priceCents: number;
};

let f: Fixture;

async function makeFixture(label: string): Promise<Fixture> {
  const user = await prisma.user.create({
    data: {
      name: `Buyer ${label} ${TAG}`,
      email: `buyer.${label}.${TAG}@example.test`,
      passwordHash: "x",
      role: Role.LEARNER,
      emailVerifiedAt: new Date(),
    },
  });

  const instructor = await prisma.user.create({
    data: {
      name: `Instructor ${label} ${TAG}`,
      email: `instructor.${label}.${TAG}@example.test`,
      passwordHash: "x",
      role: Role.INSTRUCTOR,
    },
  });

  const course = await prisma.course.create({
    data: {
      slug: `course-${label}-${TAG}`,
      title: `Course ${label}`,
      track: Track.PUBLIC,
      priceCents: 5000,
      estimatedMinutes: 60,
      sortOrder: 0,
      status: CourseStatus.PUBLISHED,
      instructorId: instructor.id,
    },
  });

  return {
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    courseId: course.id,
    courseSlug: course.slug,
    courseTitle: course.title,
    priceCents: course.priceCents,
  };
}

/** A Purchase row exactly as POST /api/checkout would create it, PENDING. */
async function makePendingPurchase(fixture: Fixture, sessionId: string) {
  return prisma.purchase.create({
    data: {
      userId: fixture.userId,
      courseId: fixture.courseId,
      stripeCheckoutSessionId: sessionId,
      amountCents: fixture.priceCents,
      currency: "usd",
      status: PurchaseStatus.PENDING,
    },
  });
}

/**
 * Builds a `checkout.session.completed` event payload shaped like a real
 * Stripe delivery — the fields the CLI's own fixture for this event
 * includes, trimmed to what a webhook consumer actually receives. Only the
 * handler's actual read path (`data.object.id`, `.payment_intent`) needs to
 * be correct for the test to exercise real code; the rest is here so the
 * fixture reads like an authentic event, not a stub.
 */
function checkoutSessionCompletedPayload(params: {
  eventId: string;
  sessionId: string;
  paymentIntentId: string;
  fixture: Fixture;
}): string {
  const { eventId, sessionId, paymentIntentId, fixture } = params;
  return JSON.stringify({
    id: eventId,
    object: "event",
    api_version: "2025-10-29.clover",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        object: "checkout.session",
        mode: "payment",
        status: "complete",
        payment_status: "paid",
        currency: "usd",
        amount_total: fixture.priceCents,
        client_reference_id: fixture.userId,
        customer: null,
        customer_email: fixture.userEmail,
        payment_intent: paymentIntentId,
        metadata: { userId: fixture.userId, courseId: fixture.courseId },
      },
    },
  });
}

function chargeRefundedPayload(params: {
  eventId: string;
  chargeId: string;
  paymentIntentId: string;
  amountCents: number;
}): string {
  const { eventId, chargeId, paymentIntentId, amountCents } = params;
  return JSON.stringify({
    id: eventId,
    object: "event",
    api_version: "2025-10-29.clover",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: "charge.refunded",
    data: {
      object: {
        id: chargeId,
        object: "charge",
        amount: amountCents,
        amount_refunded: amountCents,
        currency: "usd",
        paid: true,
        refunded: true,
        payment_intent: paymentIntentId,
      },
    },
  });
}

/** Signs a fixture body exactly as a real Stripe delivery would be signed. */
function signedRequest(payload: string): Request {
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET!,
  });
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
    body: payload,
  });
}

function randomId(prefix: string): string {
  return `${prefix}_${TAG}_${Math.random().toString(36).slice(2)}`;
}

beforeEach(async () => {
  f = await makeFixture(Math.random().toString(36).slice(2, 8));
});

afterAll(async () => {
  await prisma.enrollment.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await prisma.purchase.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await prisma.course.deleteMany({ where: { slug: { contains: TAG } } });
  await prisma.user.deleteMany({ where: { email: { contains: TAG } } });
  await prisma.$disconnect();
});

describe("checkout.session.completed", () => {
  it("marks the Purchase PAID and creates exactly one Enrollment", async () => {
    const sessionId = randomId("cs_test");
    const paymentIntentId = randomId("pi");
    const purchase = await makePendingPurchase(f, sessionId);

    const payload = checkoutSessionCompletedPayload({
      eventId: randomId("evt"),
      sessionId,
      paymentIntentId,
      fixture: f,
    });

    const response = await webhookHandler(signedRequest(payload));
    expect(response.status).toBe(200);

    const updated = await prisma.purchase.findUniqueOrThrow({
      where: { id: purchase.id },
    });
    expect(updated.status).toBe(PurchaseStatus.PAID);
    expect(updated.paidAt).not.toBeNull();
    expect(updated.stripePaymentIntentId).toBe(paymentIntentId);

    const enrollment = await prisma.enrollment.findUniqueOrThrow({
      where: { userId_courseId: { userId: f.userId, courseId: f.courseId } },
    });
    expect(enrollment.source).toBe(EnrollmentSource.PURCHASE);
    expect(enrollment.purchaseId).toBe(purchase.id);

    const count = await prisma.enrollment.count({
      where: { userId: f.userId, courseId: f.courseId },
    });
    expect(count).toBe(1);
  });

  it("creates exactly one Enrollment when the same event is replayed", async () => {
    // Stripe redelivers events — on our own non-2xx replies, and just as
    // routine "at least once" delivery even after a success. This is the
    // scenario the task calls out explicitly: replaying the identical event
    // must not create a second Enrollment.
    const sessionId = randomId("cs_test");
    const paymentIntentId = randomId("pi");
    await makePendingPurchase(f, sessionId);

    const payload = checkoutSessionCompletedPayload({
      eventId: randomId("evt"),
      sessionId,
      paymentIntentId,
      fixture: f,
    });

    const first = await webhookHandler(signedRequest(payload));
    expect(first.status).toBe(200);

    const second = await webhookHandler(signedRequest(payload));
    expect(second.status).toBe(200);

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: f.userId, courseId: f.courseId },
    });
    expect(enrollments).toHaveLength(1);

    const purchases = await prisma.purchase.findMany({
      where: { userId: f.userId, courseId: f.courseId },
    });
    expect(purchases).toHaveLength(1);
    expect(purchases[0].status).toBe(PurchaseStatus.PAID);
  });

  it("is also a no-op when Stripe assigns the replay a different event id", async () => {
    // A defensive variant of the replay test above: real Stripe retries can
    // carry a new event id for the same underlying delivery. The handler's
    // idempotency is keyed on the Purchase (via stripeCheckoutSessionId),
    // not the event id, so this must be just as much a no-op.
    const sessionId = randomId("cs_test");
    const paymentIntentId = randomId("pi");
    await makePendingPurchase(f, sessionId);

    const first = checkoutSessionCompletedPayload({
      eventId: randomId("evt"),
      sessionId,
      paymentIntentId,
      fixture: f,
    });
    const secondDelivery = checkoutSessionCompletedPayload({
      eventId: randomId("evt"),
      sessionId,
      paymentIntentId,
      fixture: f,
    });

    await webhookHandler(signedRequest(first));
    await webhookHandler(signedRequest(secondDelivery));

    const count = await prisma.enrollment.count({
      where: { userId: f.userId, courseId: f.courseId },
    });
    expect(count).toBe(1);
  });

  it("rejects a payload with an invalid signature and grants nothing", async () => {
    const sessionId = randomId("cs_test");
    await makePendingPurchase(f, sessionId);

    const payload = checkoutSessionCompletedPayload({
      eventId: randomId("evt"),
      sessionId,
      paymentIntentId: randomId("pi"),
      fixture: f,
    });

    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=1,v1=not-a-real-signature",
      },
      body: payload,
    });

    const response = await webhookHandler(request);
    expect(response.status).toBe(400);

    const purchase = await prisma.purchase.findUniqueOrThrow({
      where: { stripeCheckoutSessionId: sessionId },
    });
    expect(purchase.status).toBe(PurchaseStatus.PENDING);

    const count = await prisma.enrollment.count({
      where: { userId: f.userId, courseId: f.courseId },
    });
    expect(count).toBe(0);
  });

  it("acknowledges a session with no matching local Purchase without erroring", async () => {
    // Can only happen for a session this app never created. Should be
    // acknowledged (2xx, so Stripe doesn't retry forever), not treated as
    // an error, and must not create anything.
    const payload = checkoutSessionCompletedPayload({
      eventId: randomId("evt"),
      sessionId: randomId("cs_test_orphan"),
      paymentIntentId: randomId("pi"),
      fixture: f,
    });

    const response = await webhookHandler(signedRequest(payload));
    expect(response.status).toBe(200);

    const count = await prisma.enrollment.count({
      where: { userId: f.userId, courseId: f.courseId },
    });
    expect(count).toBe(0);
  });
});

describe("charge.refunded", () => {
  it("marks the Purchase REFUNDED and deletes the Enrollment it granted", async () => {
    const sessionId = randomId("cs_test");
    const paymentIntentId = randomId("pi");
    const chargeId = randomId("ch");
    await makePendingPurchase(f, sessionId);

    await webhookHandler(
      signedRequest(
        checkoutSessionCompletedPayload({
          eventId: randomId("evt"),
          sessionId,
          paymentIntentId,
          fixture: f,
        }),
      ),
    );

    // Sanity check the fixture actually granted access before revoking it.
    expect(
      await prisma.enrollment.count({
        where: { userId: f.userId, courseId: f.courseId },
      }),
    ).toBe(1);

    const refundResponse = await webhookHandler(
      signedRequest(
        chargeRefundedPayload({
          eventId: randomId("evt"),
          chargeId,
          paymentIntentId,
          amountCents: f.priceCents,
        }),
      ),
    );
    expect(refundResponse.status).toBe(200);

    const purchase = await prisma.purchase.findUniqueOrThrow({
      where: { stripeCheckoutSessionId: sessionId },
    });
    expect(purchase.status).toBe(PurchaseStatus.REFUNDED);
    expect(purchase.refundedAt).not.toBeNull();

    const count = await prisma.enrollment.count({
      where: { userId: f.userId, courseId: f.courseId },
    });
    expect(count).toBe(0);
  });

  it("leaves the Purchase REFUNDED exactly once when the refund event is replayed", async () => {
    const sessionId = randomId("cs_test");
    const paymentIntentId = randomId("pi");
    const chargeId = randomId("ch");
    await makePendingPurchase(f, sessionId);

    await webhookHandler(
      signedRequest(
        checkoutSessionCompletedPayload({
          eventId: randomId("evt"),
          sessionId,
          paymentIntentId,
          fixture: f,
        }),
      ),
    );

    const refundPayload = chargeRefundedPayload({
      eventId: randomId("evt"),
      chargeId,
      paymentIntentId,
      amountCents: f.priceCents,
    });

    const first = await webhookHandler(signedRequest(refundPayload));
    const second = await webhookHandler(signedRequest(refundPayload));
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const purchase = await prisma.purchase.findUniqueOrThrow({
      where: { stripeCheckoutSessionId: sessionId },
    });
    expect(purchase.status).toBe(PurchaseStatus.REFUNDED);
  });
});
