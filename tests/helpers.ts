import type { Page } from "@playwright/test";

/**
 * The only seeded account. Both values come from the same environment
 * variables `prisma/seed.ts` reads, so the suite tests whatever admin was
 * actually seeded rather than a hardcoded demo login.
 */
export const SEEDED_ADMIN = {
  email: process.env.SEED_ADMIN_EMAIL ?? "",
  password: process.env.SEED_ADMIN_PASSWORD ?? "",
};

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

export async function logout(page: Page) {
  await page.goto("/dashboard");
  await page.click("text=Sign out");
  await page.waitForURL("**/login");
}
