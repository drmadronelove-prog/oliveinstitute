import type { Page } from "@playwright/test";
import { BASE_PATH } from "../src/lib/basePath";

/**
 * The only seeded account. Both values come from the same environment
 * variables `prisma/seed.ts` reads, so the suite tests whatever admin was
 * actually seeded rather than a hardcoded demo login.
 */
export const SEEDED_ADMIN = {
  email: process.env.SEED_ADMIN_EMAIL ?? "",
  password: process.env.SEED_ADMIN_PASSWORD ?? "",
};

/**
 * Prefixes an app path with the base path. Playwright resolves a leading
 * "/" against the origin, not against a baseURL's path, so every goto and
 * URL assertion has to carry the prefix explicitly.
 */
export function appPath(path: string): string {
  return `${BASE_PATH}${path}`;
}

export async function login(page: Page, email: string, password: string) {
  await page.goto(appPath("/login"));
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**${appPath("/dashboard")}`);
}

export async function logout(page: Page) {
  await page.goto(appPath("/dashboard"));
  await page.click("text=Sign out");
  await page.waitForURL(`**${appPath("/login")}`);
}
