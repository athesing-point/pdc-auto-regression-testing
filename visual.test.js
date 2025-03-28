import { readSiteMap } from "./sitemap.js";
import { test, expect } from "@playwright/test";
import { WIDTH, HEIGHT } from "./playwright.config.js";
import { join } from "node:path";

// Configuration for screenshots
const OPTIONS = {
  stylePath: join(__dirname, "./visual.tweaks.css"),
  fullPage: false, // We'll handle custom viewport sizing
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
    await checkSnapshot(url, page);
  });
}

async function checkSnapshot(url, page) {
  // Navigate to the page with default viewport
  await page.setViewportSize({
    width: WIDTH,
    height: HEIGHT,
  });

  await page.goto(url);
  await page.waitForLoadState("networkidle");

  // Determine full page height
  const height = await page.evaluate(getFullHeight);

  // Resize viewport to capture full page
  await page.setViewportSize({
    width: WIDTH,
    height: Math.ceil(height),
  });

  // Wait a moment for any layout shifts or lazy-loaded content
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Take the screenshot
  await expect(page).toHaveScreenshot(OPTIONS);
}

// This function runs in the browser context
function getFullHeight() {
  return document.documentElement.getBoundingClientRect().height;
}
