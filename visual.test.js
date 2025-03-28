import { readSiteMap } from "./sitemap.js";
import { test, expect } from "@playwright/test";
import { join } from "node:path";

// Configuration for screenshots
const OPTIONS = {
  stylePath: join(__dirname, "./visual.tweaks.css"),
  fullPage: true, // Use Playwright's built-in full page capture
  timeout: 15000, // Increased timeout for larger pages with animations
};

// Animation handling configuration
const ANIMATION_CONFIG = {
  scrollDelay: 100, // Delay between scroll steps (ms)
  scrollStep: 200, // How many pixels to scroll each step
  finalDelay: 2000, // Wait time after scrolling for animations to finish
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

    // Wait for initial content
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Trigger scroll animations by scrolling through the entire page
    await triggerScrollAnimations(page);

    // Take the screenshot of the full page
    await expect(page).toHaveScreenshot(OPTIONS);
  });
}

/**
 * Scrolls through the entire page to trigger all scroll-based animations
 * Then scrolls back to top and refreshes GSAP's ScrollTrigger if available
 */
async function triggerScrollAnimations(page) {
  // Get page height
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);

  // Scroll through the page in steps to trigger animations
  for (let position = 0; position < pageHeight; position += ANIMATION_CONFIG.scrollStep) {
    await page.evaluate((pos) => window.scrollTo(0, pos), position);
    await page.waitForTimeout(ANIMATION_CONFIG.scrollDelay);
  }

  // Attempt to refresh GSAP ScrollTrigger if it exists
  await page.evaluate(() => {
    // Refresh GSAP ScrollTrigger if available
    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === "function") {
      window.ScrollTrigger.refresh();
    }

    // Alternative: Try to find it in GSAP's namespace
    if (window.gsap && window.gsap.ScrollTrigger && typeof window.gsap.ScrollTrigger.refresh === "function") {
      window.gsap.ScrollTrigger.refresh();
    }

    // Scroll back to top
    window.scrollTo(0, 0);
  });

  // Wait for animations to finish after scrolling
  await page.waitForTimeout(ANIMATION_CONFIG.finalDelay);
}
