import { test, expect, type Page } from "@playwright/test";
import { PrismaClient, Role } from "@prisma/client";
import {
  appPath,
  appUrlPattern,
  clearCapturedEmails,
  linkFromEmail,
  login,
  logout,
  waitForEmail,
} from "./helpers";

/**
 * The self-service account flows: register, confirm, reset, sign in.
 *
 * Tokens are stored hashed, so these tests follow the links the app actually
 * emails — captured to disk by the dev server — rather than reading anything
 * out of the database that a real person would never see.
 */
const prisma = new PrismaClient();
const TAG = `acct-${Date.now()}`;

/** A distinct address per test, so nothing collides or leaks between them. */
function emailFor(label: string): string {
  return `${label}.${TAG}@example.test`;
}

const STRONG_PASSWORD = "Kestrel-Bay-4417";
const REPLACEMENT_PASSWORD = "Marram-Dune-9930";

/** Rate limits are per hour; tests would otherwise exhaust each other's budget. */
async function clearRateLimits() {
  await prisma.rateLimitHit.deleteMany({});
}

async function registerThrough(
  page: Page,
  params: { name: string; email: string; password: string },
) {
  await page.goto(appPath("/register"));
  await page.fill("#name", params.name);
  await page.fill("#email", params.email);
  await page.fill("#password", params.password);
  await page.check('input[name="acceptTerms"]');
  await page.check('input[name="acceptPrivacy"]');
  await page.click('button[type="submit"]');
}

test.beforeEach(async () => {
  await clearRateLimits();
  await clearCapturedEmails();
});

test.afterAll(async () => {
  await prisma.enrollment.deleteMany({
    where: { user: { email: { contains: TAG } } },
  });
  await prisma.user.deleteMany({ where: { email: { contains: TAG } } });
  await clearRateLimits();
  await prisma.$disconnect();
});

test.describe("register", () => {
  test("creates an unverified learner and emails a confirmation link", async ({
    page,
  }) => {
    const email = emailFor("new");
    await registerThrough(page, {
      name: "Wren Halloway",
      email,
      password: STRONG_PASSWORD,
    });

    await expect(
      page.getByRole("heading", { name: "Almost there" }),
    ).toBeVisible();

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.role).toBe(Role.LEARNER);
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.termsAcceptedAt).not.toBeNull();
    // bcrypt, never the raw password.
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(user.passwordHash).not.toContain(STRONG_PASSWORD);

    const message = await waitForEmail(email, { subjectContains: "Confirm" });
    expect(linkFromEmail(message.body)).toContain("/institute/verify-email/");
  });

  test("rejects a weak password", async ({ page }) => {
    await registerThrough(page, {
      name: "Weak Password",
      email: emailFor("weak"),
      password: "password123",
    });

    await expect(page.locator('p[role="alert"]')).toBeVisible();
    await expect(page).toHaveURL(appUrlPattern("/register"));
    expect(
      await prisma.user.count({ where: { email: emailFor("weak") } }),
    ).toBe(0);
  });

  test("will not submit without both consent boxes", async ({ page }) => {
    const email = emailFor("noconsent");
    await page.goto(appPath("/register"));
    await page.fill("#name", "No Consent");
    await page.fill("#email", email);
    await page.fill("#password", STRONG_PASSWORD);
    await page.check('input[name="acceptTerms"]');
    // Privacy box deliberately left unticked.
    await page.click('button[type="submit"]');

    await expect(
      page.getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();
    expect(await prisma.user.count({ where: { email } })).toBe(0);
  });

  test("does not reveal whether an address is already registered", async ({
    page,
  }) => {
    const email = emailFor("dupe");
    await registerThrough(page, {
      name: "First Signup",
      email,
      password: STRONG_PASSWORD,
    });
    await expect(
      page.getByRole("heading", { name: "Almost there" }),
    ).toBeVisible();
    const firstMessage = await page
      .locator("p")
      .filter({ hasText: "Check your email" })
      .first()
      .textContent();

    await clearRateLimits();

    await registerThrough(page, {
      name: "Second Signup",
      email,
      password: STRONG_PASSWORD,
    });
    await expect(
      page.getByRole("heading", { name: "Almost there" }),
    ).toBeVisible();
    const secondMessage = await page
      .locator("p")
      .filter({ hasText: "Check your email" })
      .first()
      .textContent();

    expect(secondMessage).toBe(firstMessage);
    // And the first account's name is untouched.
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.name).toBe("First Signup");
  });
});

test.describe("verify email", () => {
  test("confirms the address, and the link does not work twice", async ({
    page,
  }) => {
    const email = emailFor("verify");
    await registerThrough(page, {
      name: "Verity Ash",
      email,
      password: STRONG_PASSWORD,
    });
    await expect(
      page.getByRole("heading", { name: "Almost there" }),
    ).toBeVisible();

    const link = linkFromEmail(
      (await waitForEmail(email, { subjectContains: "Confirm" })).body,
    );

    await page.goto(link);
    await expect(
      page.getByRole("heading", { name: "Email confirmed" }),
    ).toBeVisible();

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerifiedAt).not.toBeNull();

    // Replaying the link must not re-verify.
    await page.goto(link);
    await expect(
      page.getByRole("heading", { name: "Already confirmed" }),
    ).toBeVisible();
  });

  test("rejects a token that was never issued", async ({ page }) => {
    await page.goto(appPath("/verify-email/not-a-real-token"));
    await expect(
      page.getByRole("heading", { name: "That link didn't work" }),
    ).toBeVisible();
  });
});

test.describe("an unverified account", () => {
  test("may sign in and browse, but may not buy", async ({ page }) => {
    const email = emailFor("unverified");
    await registerThrough(page, {
      name: "Una Verified",
      email,
      password: STRONG_PASSWORD,
    });
    await expect(
      page.getByRole("heading", { name: "Almost there" }),
    ).toBeVisible();

    // Signing in works: browsing is not gated on confirmation.
    await login(page, email, STRONG_PASSWORD);
    await expect(page).toHaveURL(appUrlPattern("/dashboard"));

    const course = await prisma.course.findFirstOrThrow({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
    });
    await page.goto(appPath(`/courses/${course.slug}`));

    // The free preview is still readable.
    await expect(
      page.getByRole("heading", { name: "Watch the free preview" }),
    ).toBeVisible();

    // But buying is refused, and says why.
    await expect(page.getByText("Confirm your email address before buying")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Buy — / })).toBeDisabled();

    // Settings offers a way out.
    await page.goto(appPath("/settings"));
    await page.click("text=Send a new confirmation email");
    await expect(page.getByText("Confirmation email sent.")).toBeVisible();

    const link = linkFromEmail(
      (await waitForEmail(email, { subjectContains: "Confirm" })).body,
    );
    await page.goto(link);
    await expect(
      page.getByRole("heading", { name: "Email confirmed" }),
    ).toBeVisible();

    // Verified now: the blocking note is gone.
    await page.goto(appPath(`/courses/${course.slug}`));
    await expect(
      page.getByText("Confirm your email address before buying"),
    ).toHaveCount(0);

    await logout(page);
  });
});

test.describe("password reset", () => {
  test("sets a new password, retires the link, and the old password stops working", async ({
    page,
  }) => {
    const email = emailFor("reset");
    await registerThrough(page, {
      name: "Rhea Sett",
      email,
      password: STRONG_PASSWORD,
    });
    await expect(
      page.getByRole("heading", { name: "Almost there" }),
    ).toBeVisible();
    await clearCapturedEmails();

    await page.goto(appPath("/forgot-password"));
    await page.fill("#email", email);
    await page.click('button[type="submit"]');
    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();

    const link = linkFromEmail(
      (await waitForEmail(email, { subjectContains: "Reset" })).body,
    );

    await page.goto(link);
    await page.fill("#password", REPLACEMENT_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(
      page.getByRole("heading", { name: "Password updated" }),
    ).toBeVisible();

    // Single use: the same link is dead.
    await page.goto(link);
    await expect(
      page.getByRole("heading", { name: "That link has expired" }),
    ).toBeVisible();

    // The old password no longer signs in.
    await page.goto(appPath("/login"));
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', STRONG_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.getByText("Invalid email or password.")).toBeVisible();

    // The new one does.
    await login(page, email, REPLACEMENT_PASSWORD);
    await expect(page).toHaveURL(appUrlPattern("/dashboard"));
    await logout(page);
  });

  test("says the same thing for an address with no account", async ({
    page,
  }) => {
    await page.goto(appPath("/forgot-password"));
    await page.fill("#email", emailFor("nobody"));
    await page.click('button[type="submit"]');
    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();
  });

  test("refuses an expired token", async ({ page }) => {
    const email = emailFor("expired");
    await registerThrough(page, {
      name: "Ex Pired",
      email,
      password: STRONG_PASSWORD,
    });
    await expect(
      page.getByRole("heading", { name: "Almost there" }),
    ).toBeVisible();
    await clearCapturedEmails();

    await page.goto(appPath("/forgot-password"));
    await page.fill("#email", email);
    await page.click('button[type="submit"]');
    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();

    const link = linkFromEmail(
      (await waitForEmail(email, { subjectContains: "Reset" })).body,
    );

    // Wind the expiry back rather than waiting an hour.
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await page.goto(link);
    await expect(
      page.getByRole("heading", { name: "That link has expired" }),
    ).toBeVisible();
  });
});

test.describe("rate limiting", () => {
  test("stops repeated reset requests for one address", async ({ page }) => {
    const email = emailFor("flood");
    await registerThrough(page, {
      name: "Flo Odd",
      email,
      password: STRONG_PASSWORD,
    });
    await expect(
      page.getByRole("heading", { name: "Almost there" }),
    ).toBeVisible();
    await clearRateLimits();

    // The per-email budget is 3 an hour; the fourth is refused.
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await page.goto(appPath("/forgot-password"));
      await page.fill("#email", email);
      await page.click('button[type="submit"]');
      await expect(
        page.getByRole("heading", { name: "Check your email" }),
      ).toBeVisible();
    }

    await page.goto(appPath("/forgot-password"));
    await page.fill("#email", email);
    await page.click('button[type="submit"]');
    await expect(page.locator('p[role="alert"]')).toContainText(
      "Too many attempts",
    );
  });
});
