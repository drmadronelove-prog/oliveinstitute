import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to point at a specific
        // Chromium binary (e.g. in a sandboxed CI image that pre-installs
        // browsers at a nonstandard path). Unset by default, in which case
        // Playwright resolves the browser it installed via
        // `npx playwright install chromium` as usual.
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
          : {},
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    // The app is mounted under basePath, so "/" is a 404 — poll a real page.
    url: "http://localhost:3000/institute/login",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
