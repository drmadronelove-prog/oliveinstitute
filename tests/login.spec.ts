import { test, expect } from "@playwright/test";
import { appPath, appUrlPattern, login, logout, SEEDED_ADMIN } from "./helpers";

test.beforeAll(() => {
  if (!SEEDED_ADMIN.email || !SEEDED_ADMIN.password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to the seeded admin's credentials.",
    );
  }
});

test.describe("login", () => {
  test("unauthenticated users are redirected to /login", async ({ page }) => {
    await page.goto(appPath("/dashboard"));
    await expect(page).toHaveURL(new RegExp(`${appPath("/login")}$`));
  });

  test("seeded admin can log in and reach the dashboard", async ({ page }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await expect(page).toHaveURL(appUrlPattern("/dashboard"));
    const signedInAs = page.locator("p", { hasText: "Signed in as" });
    await expect(signedInAs).toContainText("ADMIN");
    await logout(page);
  });

  test("wrong password is rejected", async ({ page }) => {
    await page.goto(appPath("/login"));
    await page.fill('input[type="email"]', SEEDED_ADMIN.email);
    await page.fill('input[type="password"]', "not-the-password");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${appPath("/login")}$`));
  });
});

test.describe("base path", () => {
  test("paths outside the base path are not served", async ({ page }) => {
    const response = await page.goto("/dashboard");
    expect(response?.status()).toBe(404);
  });

  test("the session cookie is scoped to the base path", async ({ page }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    const cookies = await page.context().cookies();
    const session = cookies.find((c) => c.name.endsWith("authjs.session-token"));
    expect(session, "session cookie should be set").toBeTruthy();
    expect(session?.path).toBe("/institute");
    await logout(page);
  });

  test("in-app links keep the base path", async ({ page }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);

    await page.click("text=Change password");
    await expect(page).toHaveURL(new RegExp(`${appPath("/settings/password")}$`));

    await page.goto(appPath("/dashboard"));
    await page.click("text=Manage users");
    await expect(page).toHaveURL(new RegExp(`${appPath("/admin/users")}$`));

    await logout(page);
  });

  test("the root page is the public storefront, signed in or out", async ({
    page,
  }) => {
    // "/" used to redirect to /login or /dashboard. It is the storefront home
    // now, so it renders either way — only the nav's account link changes.
    await page.goto(appPath("/"));
    await expect(page).toHaveURL(appUrlPattern("/"));
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await page.goto(appPath("/"));
    await expect(page).toHaveURL(appUrlPattern("/"));
    const myCourses = page.getByRole("link", { name: "My courses" });
    await expect(myCourses).toBeVisible();
    await myCourses.click();
    await expect(page).toHaveURL(appUrlPattern("/dashboard"));
    await logout(page);
  });

  test("the dashboard hero image loads under the base path", async ({
    page,
  }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    const hero = page.locator("img").first();
    await expect(hero).toBeVisible();
    // A broken image still renders an <img>, so assert it actually decoded.
    await expect
      .poll(() => hero.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    await logout(page);
  });

  test("the style guide renders every shared component", async ({ page }) => {
    await page.goto(appPath("/style-guide"));
    await expect(
      page.getByRole("heading", { name: "Style Guide" }),
    ).toBeVisible();
    for (const section of [
      "Brand palette",
      "Derived shades",
      "Typography",
      "Wordmark",
      "Top nav",
      "Sidebar",
      "Badges",
      "Hero card",
      "Course tiles",
      "Cards",
      "Resource list",
    ]) {
      await expect(
        page.getByRole("heading", { name: section, exact: true }),
      ).toBeVisible();
    }
  });
});
