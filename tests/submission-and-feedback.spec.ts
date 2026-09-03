import path from "path";
import { test, expect } from "@playwright/test";
import { login, logout, provisionCourseWithEnrollment, SEEDED } from "./helpers";

const SAMPLE_PDF = path.join(__dirname, "fixtures", "sample.pdf");

test("student submits an assignment, professor grades it, student sees the grade and feedback", async ({
  page,
}) => {
  const { courseId } = await provisionCourseWithEnrollment(page);

  // Professor creates an assignment.
  await login(page, SEEDED.professor.email, SEEDED.professor.password);
  await page.goto(`/professor/courses/${courseId}`);
  const assignmentForm = page.locator("form").filter({ has: page.locator('input[name="dueAt"]') });
  await assignmentForm.locator('input[name="title"]').fill("Test Assignment");
  await assignmentForm.locator('input[name="dueAt"]').fill("2099-01-01T09:00");
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST"),
    assignmentForm.locator('button:has-text("Create assignment")').click(),
  ]);

  await page.click("text=Test Assignment");
  await page.waitForURL("**/assignments/*");
  const assignmentUrl = page.url();
  await logout(page);

  // Student submits a PDF before the (future) due date.
  await login(page, SEEDED.student.email, SEEDED.student.password);
  await page.goto(assignmentUrl.replace("/professor/", "/student/"));
  await page.setInputFiles('input[name="file"]', SAMPLE_PDF);
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST"),
    page.click('button:has-text("Submit")'),
  ]);
  await expect(page.getByText("Submitted on time.")).toBeVisible();
  await expect(page.getByText("View submitted file")).toBeVisible();
  await logout(page);

  // Professor grades and leaves feedback.
  await login(page, SEEDED.professor.email, SEEDED.professor.password);
  await page.goto(assignmentUrl);
  await expect(page.getByText("Sam Student")).toBeVisible();
  await page.selectOption('select[name="grade"]', "PASS");
  await page.fill('textarea[name="feedback"]', "Nice work overall.");
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST"),
    page.click('button:has-text("Save review")'),
  ]);
  await expect(page.getByText("Review saved.")).toBeVisible();
  await logout(page);

  // Student sees the grade and feedback immediately.
  await login(page, SEEDED.student.email, SEEDED.student.password);
  await page.goto(assignmentUrl.replace("/professor/", "/student/"));
  await expect(page.getByText("Grade: Pass")).toBeVisible();
  await expect(page.getByText("Nice work overall.")).toBeVisible();
  await expect(page.getByText("REVIEWED")).toBeVisible();
});
