import { defineConfig, devices } from "@playwright/test";

// Export these to make them accessible in other modules
export const BROWSERS = ["Desktop Firefox", "Desktop Chrome", "Desktop Safari"];
export const BASE_URL = process.env.BASE_URL || "https://www.point.dev"; // Default to staging if not specified
export const WIDTH = 1280;
export const HEIGHT = 800;

// Check if running in CI environment
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: "./",
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: 2,
  workers: IS_CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    // Set longer timeouts for visual comparison tests
    navigationTimeout: 60000,
    actionTimeout: 60000,
  },
  // Global timeout settings
  timeout: 180000, // 3 minutes per test
  expect: {
    timeout: 60000, // 1 minute for assertions (including screenshots)
  },
  projects: BROWSERS.map((ua) => ({
    name: ua.toLowerCase().replaceAll(" ", "-"),
    use: {
      ...devices[ua],
      viewport: {
        width: WIDTH,
        height: HEIGHT,
      },
    },
  })),
  // No webServer needed since we're testing an external site
  globalSetup: require.resolve("./setup.js"),
});
