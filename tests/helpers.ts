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

/**
 * Regex matching an app path at the end of a URL. "/" is special: the browser
 * normalises `/institute/` to `/institute`, so the trailing slash is optional.
 */
export function appUrlPattern(path: string): RegExp {
  return new RegExp(`${BASE_PATH}${path === "/" ? "/?" : path}$`);
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

/**
 * Reads the emails the dev server captured to disk (see
 * `EMAIL_CAPTURE_DIR` in playwright.config.ts). Sending is asynchronous
 * relative to the form response, so this polls briefly rather than assuming
 * the file is already there.
 */
export async function waitForEmail(
  to: string,
  options: { subjectContains?: string; timeoutMs?: number } = {},
): Promise<{ to: string; subject: string; body: string }> {
  const { readdir, readFile } = await import("fs/promises");
  const path = await import("path");
  const { EMAIL_CAPTURE_DIR } = await import("../playwright.config");

  const deadline = Date.now() + (options.timeoutMs ?? 10_000);
  let seen = 0;

  while (Date.now() < deadline) {
    let files: string[] = [];
    try {
      files = await readdir(EMAIL_CAPTURE_DIR);
    } catch {
      files = [];
    }
    seen = files.length;

    // Newest first, so a re-sent link wins over the one it replaced.
    for (const file of files.sort().reverse()) {
      const raw = await readFile(path.join(EMAIL_CAPTURE_DIR, file), "utf8");
      const message = JSON.parse(raw) as {
        to: string;
        subject: string;
        body: string;
      };
      if (message.to !== to) continue;
      if (
        options.subjectContains &&
        !message.subject.includes(options.subjectContains)
      ) {
        continue;
      }
      return message;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(
    `No captured email to ${to}` +
      (options.subjectContains ? ` matching "${options.subjectContains}"` : "") +
      ` (saw ${seen} captured message(s))`,
  );
}

/** Pulls the first app link out of an email body. */
export function linkFromEmail(body: string): string {
  const match = body.match(/https?:\/\/\S+/);
  if (!match) throw new Error(`No link found in email body:\n${body}`);
  return match[0];
}

/** Removes every captured message, so a test starts from a clean inbox. */
export async function clearCapturedEmails(): Promise<void> {
  const { rm } = await import("fs/promises");
  const { EMAIL_CAPTURE_DIR } = await import("../playwright.config");
  await rm(EMAIL_CAPTURE_DIR, { recursive: true, force: true });
}
