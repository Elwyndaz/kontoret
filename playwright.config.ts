import { defineConfig } from "@playwright/test";

// Runs against the built site so CI tests exactly what gets deployed.
export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    reducedMotion: "reduce",
  },
  webServer: {
    command: "npx vite preview --port 4173",
    url: "http://127.0.0.1:4173/kontoret/",
    reuseExistingServer: !process.env.CI,
  },
});
