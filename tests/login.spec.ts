import { test, expect } from "@playwright/test";
import { login, logout, SEEDED_ADMIN } from "./helpers";

test.beforeAll(() => {
  if (!SEEDED_ADMIN.email || !SEEDED_ADMIN.password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to the seeded admin's credentials.",
    );
  }
});

test.describe("login", () => {
  test("unauthenticated users are redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("seeded admin can log in and reach the dashboard", async ({ page }) => {
    await login(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await expect(page).toHaveURL(/\/dashboard$/);
    const signedInAs = page.locator("p", { hasText: "Signed in as" });
    await expect(signedInAs).toContainText("ADMIN");
    await logout(page);
  });

  test("wrong password is rejected", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', SEEDED_ADMIN.email);
    await page.fill('input[type="password"]', "not-the-password");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
