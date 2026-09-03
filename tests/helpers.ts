import type { Page } from "@playwright/test";

export const SEEDED = {
  admin: { email: "admin@saticenter.org", password: "password123" },
  professor: { email: "professor@saticenter.org", password: "password123" },
  student: { email: "student@saticenter.org", password: "password123" },
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

/**
 * Provisions a fresh course (as admin) taught by the seeded professor with
 * the seeded student enrolled, using a unique title so repeated test runs
 * against a shared dev database don't collide.
 */
export async function provisionCourseWithEnrollment(page: Page) {
  const title = `E2E Course ${Date.now()}`;

  await login(page, SEEDED.admin.email, SEEDED.admin.password);
  await page.goto("/admin/courses");
  await page.fill('input[name="title"]', title);
  await page.fill('input[name="term"]', "Test Term");
  await page.fill('input[name="credits"]', "1");
  await page.selectOption('select[name="professorId"]', { label: "Prof. Dana Wren" });
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST"),
    page.click('button:has-text("Create course")'),
  ]);

  const row = page.locator("tr", { has: page.locator(`text=${title}`) });
  await row.locator('a:has-text("Manage")').click();
  await page.waitForURL("**/admin/courses/*");
  const courseId = page.url().split("/").pop()!;

  await page.selectOption('select[name="studentId"]', { label: "Sam Student" });
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST"),
    page.click('button:has-text("Enroll student")'),
  ]);

  await logout(page);

  return { courseId, title };
}
