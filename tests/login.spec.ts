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

    await page.click("text=Settings");
    await expect(page).toHaveURL(appUrlPattern("/settings"));

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

  test("app assets are served under the base path, and not above it", async ({
    page,
  }) => {
    // This used to assert the dashboard's hero photo decoded, as the one
    // next/image call site that could silently lose the base path. The
    // redesign replaced that panel with inline SVG, so the asset this
    // guards is the app icon instead — same concern, an asset that is
    // actually still there.
    const served = await page.request.get(appPath("/icon.png"));
    expect(served.status()).toBe(200);
    const aboveBasePath = await page.request.get("/icon.png");
    expect(aboveBasePath.status()).toBe(404);
  });

  test("the style guide renders every shared component", async ({ page }) => {
    await page.goto(appPath("/style-guide"));
    await expect(
      page.getByRole("heading", { name: "Style Guide" }),
    ).toBeVisible();
    for (const section of [
      "Brand palette",
      "Type colours and fine detail",
      "Typography",
      "The mark",
      "Lockup",
      "Raised surfaces",
      "Drifting olives",
      "Top nav and footer",
      "Sidebar",
      "Badges",
      "Dashboard band",
      "Course tiles",
      "Catalogue card",
      "Cards",
      "Resource list",
    ]) {
      await expect(
        page.getByRole("heading", { name: section, exact: true }),
      ).toBeVisible();
    }
  });
});
