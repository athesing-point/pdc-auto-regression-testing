import { readSiteMap } from "./sitemap.js";
import { test, expect } from "@playwright/test";
import { join } from "node:path";

// Configuration for screenshots
const OPTIONS = {
  stylePath: join(__dirname, "./visual.tweaks.css"),
  fullPage: true, // Use Playwright's built-in full page capture
  timeout: 10000, // Increase timeout for larger pages
};

// Try to load the sitemap
let sitemap = [];
try {
  sitemap = readSiteMap();
} catch (err) {
  test("site map", ({ page }) => {
    throw new Error("Missing site map. Run tests once to generate it first.");
  });
}

// Generate a test for each URL in the sitemap
for (const url of sitemap) {
  test(`Page at ${url}`, async ({ page }) => {
    // Navigate to the page
    await page.goto(url, { waitUntil: "networkidle" });

    // Wait for any lazy-loaded content
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Take the screenshot of the full page
    await expect(page).toHaveScreenshot(OPTIONS);
  });
}
