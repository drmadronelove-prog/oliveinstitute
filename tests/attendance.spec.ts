import { test, expect } from "@playwright/test";
import { login, logout, provisionCourseWithEnrollment, SEEDED } from "./helpers";

test("professor marks attendance and the student sees their own record", async ({
  page,
}) => {
  const { courseId } = await provisionCourseWithEnrollment(page);

  await login(page, SEEDED.professor.email, SEEDED.professor.password);
  await page.goto(`/professor/courses/${courseId}/attendance`);

  const row = page.locator("tr", { has: page.locator("text=Sam Student") });
  const absentRadio = row.locator('input[type="radio"]').nth(1); // ABSENT column
  await absentRadio.check();
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST"),
    page.click('button:has-text("Save attendance")'),
  ]);
  await expect(page.getByText("Attendance saved.")).toBeVisible();
  await logout(page);

  await login(page, SEEDED.student.email, SEEDED.student.password);
  await page.goto(`/student/courses/${courseId}`);
  await expect(page.getByText("ABSENT")).toBeVisible();
});
