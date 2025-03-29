import { defineConfig, devices } from "@playwright/test";

// Export these to make them accessible in other modules
export const BROWSERS = ["Desktop Chrome"];
export const BASE_URL = process.env.BASE_URL || "https://www.point.dev"; // Default to staging if not specified
export const WIDTH = 1280;
export const HEIGHT = 800;

// Check if running in CI environment
const IS_CI = !!process.env.CI;
// Check if we're generating baseline screenshots
const IS_BASELINE = process.env.GENERATE_BASELINE === "true";

// Mobile user agent string
export const MOBILE_USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

// Helper to determine if a device is mobile
const isMobileViewport = (width) => width <= 375;

export default defineConfig({
  testDir: "./",
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_BASELINE ? 0 : 2, // No retries for baseline, 2 retries for testing
  workers: IS_CI ? 1 : 24,
  reporter: [
    [
      "html",
      {
        open: "on-failure",
        attachmentsDirectory: "playwright-report/attachments",
      },
    ],
    ["list"],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "on", // Capture screenshots for all tests
    video: "retain-on-failure",
    // Set longer timeouts for visual comparison tests
    navigationTimeout: 60000,
    actionTimeout: 60000,
  },
  // Global timeout settings
  timeout: 180000, // 3 minutes per test
  expect: {
    timeout: 60000, // 1 minute for assertions (including screenshots)
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.1,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        screenshot: {
          mode: "on",
          fullPage: true,
        },
      },
    },
  ],
  // No webServer needed since we're testing an external site
  globalSetup: require.resolve("./setup.js"),
});
