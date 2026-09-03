import { test, expect, type Page } from "@playwright/test";
import {
  CourseStatus,
  EnrollmentSource,
  PrismaClient,
  PurchaseStatus,
  Role,
  Track,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { stripe } from "../src/lib/stripe";
import { appPath, appUrlPattern, login, logout } from "./helpers";

/**
 * Browser-level coverage for the checkout surface: the Buy button's states,
 * the cancel page, and the success page's read-only states (including the
 * fully-paid one, reached the same way Stripe would reach it — a signed
 * webhook POST to the running server, not a database shortcut).
 *
 * The one thing this suite cannot cover is the real "click Buy, land on a
 * Stripe-hosted page, pay" round trip: that needs a live Stripe account and
 * network access to stripe.com, both unavailable in this environment (see
 * the long comment in src/lib/__tests__/checkout-webhook.integration.test.ts
 * for the same constraint and the officially-documented workaround this
 * project uses instead). What that leaves untested here is Stripe's own
 * hosted page — everything this app's own code does around it is covered.
 */
const prisma = new PrismaClient();
const TAG = `checkout-e2e-${Date.now()}`;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  throw new Error(
    "STRIPE_WEBHOOK_SECRET must be set to run this suite — any string works, since these tests never call Stripe's API, but the webhook route reads it from the environment to verify the signature these tests generate.",
  );
}

const VERIFIED = {
  name: "Verified Buyer",
  email: `verified.${TAG}@example.test`,
  password: "checkout-e2e-test-pw",
};
const UNVERIFIED = {
  name: "Unverified Buyer",
  email: `unverified.${TAG}@example.test`,
  password: "checkout-e2e-test-pw",
};

let courseId = "";
let courseSlug = "";
let priceCents = 0;
let enrolledCourseSlug = "";

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash(VERIFIED.password, 10);

  const [verified, , instructor] = await Promise.all([
    prisma.user.create({
      data: {
        name: VERIFIED.name,
        email: VERIFIED.email,
        passwordHash,
        role: Role.LEARNER,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: UNVERIFIED.name,
        email: UNVERIFIED.email,
        passwordHash,
        role: Role.LEARNER,
      },
    }),
    prisma.user.create({
      data: {
        name: `Instructor ${TAG}`,
        email: `instructor.${TAG}@example.test`,
        passwordHash: "x",
        role: Role.INSTRUCTOR,
      },
    }),
  ]);

  const [course, alreadyOwned] = await Promise.all([
    prisma.course.create({
      data: {
        slug: `buyable-${TAG}`,
        title: `Buyable Course ${TAG}`,
        track: Track.PUBLIC,
        priceCents: 4200,
        estimatedMinutes: 45,
        sortOrder: 0,
        status: CourseStatus.PUBLISHED,
        instructorId: instructor.id,
      },
    }),
    prisma.course.create({
      data: {
        slug: `already-owned-${TAG}`,
        title: `Already Owned Course ${TAG}`,
        track: Track.PUBLIC,
        priceCents: 1000,
        estimatedMinutes: 10,
        sortOrder: 0,
        status: CourseStatus.PUBLISHED,
        instructorId: instructor.id,
      },
    }),
  ]);

  await prisma.enrollment.create({
    data: {
      userId: verified.id,
      courseId: alreadyOwned.id,
      source: EnrollmentSource.COMP,
    },
  });

  courseId = course.id;
  courseSlug = course.slug;
  priceCents = course.priceCents;
  enrolledCourseSlug = alreadyOwned.slug;
});

test.afterAll(async () => {
  await prisma.enrollment.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await prisma.purchase.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await prisma.course.deleteMany({ where: { slug: { contains: TAG } } });
  await prisma.user.deleteMany({ where: { email: { contains: TAG } } });
  await prisma.$disconnect();
});

async function checkoutFetch(page: Page, targetCourseId: string) {
  return page.evaluate(
    async ({ courseId, path }) => {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      return { status: response.status, body: await response.json() };
    },
    { courseId: targetCourseId, path: appPath("/api/checkout") },
  );
}

test.describe("POST /api/checkout", () => {
  test("refuses a logged-out request", async ({ page }) => {
    await page.goto(appPath("/"));
    const result = await checkoutFetch(page, courseId);
    expect(result.status).toBe(401);
  });

  test("refuses an unverified account", async ({ page }) => {
    await login(page, UNVERIFIED.email, UNVERIFIED.password);
    const result = await checkoutFetch(page, courseId);
    expect(result.status).toBe(403);
    expect(result.body.error).toContain("Confirm your email");
    await logout(page);
  });

  test("refuses a course the learner already owns", async ({ page }) => {
    await login(page, VERIFIED.email, VERIFIED.password);
    const owned = await prisma.course.findUniqueOrThrow({
      where: { slug: enrolledCourseSlug },
      select: { id: true },
    });
    const result = await checkoutFetch(page, owned.id);
    expect(result.status).toBe(409);
    await logout(page);
  });

  test("refuses an unknown course id", async ({ page }) => {
    await login(page, VERIFIED.email, VERIFIED.password);
    const result = await checkoutFetch(page, "not-a-real-course-id");
    expect(result.status).toBe(404);
    await logout(page);
  });

  test("creates no Purchase row for any of the refused requests", async () => {
    const count = await prisma.purchase.count({
      where: { user: { email: { contains: TAG } } },
    });
    expect(count).toBe(0);
  });
});

test.describe("the Buy button", () => {
  test("is active for a verified, eligible learner", async ({ page }) => {
    await login(page, VERIFIED.email, VERIFIED.password);
    await page.goto(appPath(`/courses/${courseSlug}`));

    const buy = page.getByRole("button", { name: /^Buy — /, exact: false });
    await expect(buy).toBeEnabled();
    await expect(
      page.getByText("You'll be redirected to Stripe to pay"),
    ).toBeVisible();
    await logout(page);
  });

  test("is disabled for an unverified learner, with a reason", async ({
    page,
  }) => {
    await login(page, UNVERIFIED.email, UNVERIFIED.password);
    await page.goto(appPath(`/courses/${courseSlug}`));

    const buy = page.getByRole("button", { name: /^Buy — /, exact: false });
    await expect(buy).toBeDisabled();
    await expect(
      page.getByText("Confirm your email address before buying"),
    ).toBeVisible();
    await logout(page);
  });

  test("surfaces a clear error rather than crashing when checkout can't start", async ({
    page,
  }) => {
    // This environment has no route to Stripe's API, so clicking Buy is
    // guaranteed to hit the route's own error path — which is exactly the
    // path under test: the button must show a message, not hang or crash.
    await login(page, VERIFIED.email, VERIFIED.password);
    await page.goto(appPath(`/courses/${courseSlug}`));

    await page.getByRole("button", { name: /^Buy — /, exact: false }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
    await logout(page);
  });
});

test.describe("/checkout/cancel", () => {
  test("names the course and links back to it", async ({ page }) => {
    await page.goto(appPath(`/checkout/cancel?course=${courseSlug}`));
    await expect(page.getByText("Checkout canceled")).toBeVisible();
    await expect(page.getByText("No payment was made")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to the course page" }),
    ).toHaveAttribute("href", appPath(`/courses/${courseSlug}`));
  });

  test("degrades gracefully with no course param", async ({ page }) => {
    await page.goto(appPath("/checkout/cancel"));
    await expect(page.getByText("Checkout canceled")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Browse courses" }),
    ).toBeVisible();
  });
});

test.describe("/checkout/success", () => {
  test("requires a session", async ({ page }) => {
    await page.goto(appPath("/checkout/success?session_id=cs_test_anything"));
    await expect(page).toHaveURL(appUrlPattern("/login"));
  });

  test("without a session_id, says so rather than guessing", async ({
    page,
  }) => {
    await login(page, VERIFIED.email, VERIFIED.password);
    await page.goto(appPath("/checkout/success"));
    await expect(page.getByText("Missing order")).toBeVisible();
    await logout(page);
  });

  test("for a session_id with no matching Purchase, says so — not an error page", async ({
    page,
  }) => {
    await login(page, VERIFIED.email, VERIFIED.password);
    await page.goto(appPath("/checkout/success?session_id=cs_test_nonexistent"));
    await expect(page.getByText("We couldn't find that order")).toBeVisible();
    await logout(page);
  });

  test("reflects PENDING as still finishing up, before any webhook arrives", async ({
    page,
  }) => {
    const sessionId = `cs_test_pending_${TAG}`;
    await prisma.purchase.create({
      data: {
        userId: (
          await prisma.user.findUniqueOrThrow({ where: { email: VERIFIED.email } })
        ).id,
        courseId,
        stripeCheckoutSessionId: sessionId,
        amountCents: priceCents,
        currency: "usd",
        status: PurchaseStatus.PENDING,
      },
    });

    await login(page, VERIFIED.email, VERIFIED.password);
    await page.goto(appPath(`/checkout/success?session_id=${sessionId}`));
    await expect(page.getByText("Finishing up")).toBeVisible();
    await logout(page);
  });

  test("a real signed webhook grants access, and the success page then shows the receipt and unlocks the course", async ({
    page,
    request,
  }) => {
    // The full loop this app actually relies on: create a PENDING purchase
    // the way /api/checkout would, deliver a real signed
    // checkout.session.completed over HTTP the way Stripe would, then
    // confirm both the success page and the course itself reflect it —
    // never the other way around.
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: VERIFIED.email },
    });
    const sessionId = `cs_test_paid_${TAG}`;
    const paymentIntentId = `pi_${TAG}`;

    await prisma.purchase.create({
      data: {
        userId: user.id,
        courseId,
        stripeCheckoutSessionId: sessionId,
        amountCents: priceCents,
        currency: "usd",
        status: PurchaseStatus.PENDING,
      },
    });

    const payload = JSON.stringify({
      id: `evt_${TAG}`,
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
          amount_total: priceCents,
          client_reference_id: user.id,
          customer: null,
          payment_intent: paymentIntentId,
          metadata: { userId: user.id, courseId },
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: WEBHOOK_SECRET!,
    });

    const webhookResponse = await request.post(
      appPath("/api/webhooks/stripe"),
      {
        headers: {
          "content-type": "application/json",
          "stripe-signature": signature,
        },
        data: payload,
      },
    );
    expect(webhookResponse.status()).toBe(200);

    await login(page, VERIFIED.email, VERIFIED.password);
    await page.goto(appPath(`/checkout/success?session_id=${sessionId}`));
    await expect(page.getByText("Payment received")).toBeVisible();

    await page.getByRole("link", { name: "Go to course" }).click();
    await page.waitForURL(`**${appPath(`/student/courses/${courseId}`)}`);
    // The real proof access was actually granted: the curriculum renders,
    // not a "you aren't enrolled" notice.
    await expect(page.getByText("Curriculum")).toBeVisible();
    await expect(page.getByText("aren't enrolled")).toHaveCount(0);

    await logout(page);
  });
});
