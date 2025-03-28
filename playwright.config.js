import { defineConfig, devices } from "@playwright/test";

// Export these to make them accessible in other modules
export const BROWSERS = ["Desktop Firefox", "Desktop Chrome", "Desktop Safari"];
export const BASE_URL = "https://www.point.dev";
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
