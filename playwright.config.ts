import { defineConfig } from "@playwright/test";
import fs from "node:fs";

const chromium = "/opt/pw-browsers/chromium";
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:4173",
    acceptDownloads: true,
    trace: "off",
    launchOptions: fs.existsSync(chromium) ? { executablePath: chromium, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] },
  },
  // Serves the static export with the same headers as production. Run `npm run build` first.
  webServer: process.env.BASE_URL ? undefined : { command: "node scripts/serve.mjs", url: "http://localhost:4173", reuseExistingServer: true, timeout: 30_000 },
});
