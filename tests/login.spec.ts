import { test, expect } from "@playwright/test";
import { login, logout, SEEDED } from "./helpers";

test.describe("login", () => {
  test("unauthenticated users are redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("seeded admin can log in and reach the dashboard", async ({ page }) => {
    await login(page, SEEDED.admin.email, SEEDED.admin.password);
    const signedInAs = page.locator("p", { hasText: "Signed in as" });
    await expect(signedInAs).toContainText("Ana Admin");
    await expect(signedInAs).toContainText("ADMIN");
  });

  test("wrong password is rejected", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', SEEDED.admin.email);
    await page.fill('input[type="password"]', "not-the-password");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("student cannot reach admin-only tools", async ({ page }) => {
    await login(page, SEEDED.student.email, SEEDED.student.password);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/forbidden$/);
    await logout(page);
  });
});
