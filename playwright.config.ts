import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://localhost:4173",
    headless: true,
    // Capture screenshots and traces only on failure
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },

  // Use the production build served by `vite preview`.
  // In CI, `npm run build` runs before this step so dist/ already exists.
  // Locally, run `npm run build` once before running `npx playwright test`.
  webServer: {
    command: "npm run preview",
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },

  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
