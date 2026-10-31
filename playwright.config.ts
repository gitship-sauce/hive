import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "./scripts/env";

loadEnv();
const port = 3100;
// Set E2E_BASE_URL to test an app that is already running (e.g. the Docker container) instead of a dev server.
const external = process.env.E2E_BASE_URL;
const FIREBASE_VARS = [
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID",
  "FIREBASE_VAPID_KEY",
  "FIREBASE_SERVICE_ACCOUNT_FILE",
];

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // Tests share one test database, so run them one at a time.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: external ?? `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: external
    ? undefined
    : {
        command: "npm run dev",
        url: `http://localhost:${port}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
          PORT: String(port),
          // The tests expect push to be off, even if your .env has Firebase keys.
          // (.env never overrides a variable that is already set, even to "".)
          ...Object.fromEntries(FIREBASE_VARS.map((name) => [name, ""])),
        },
      },
});
