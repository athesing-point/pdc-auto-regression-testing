import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Starting point for crawling - adjust based on Point.dev's structure
const ENTRY_POINT = "/";
const SITEMAP = join(__dirname, "./sitemap.json");
const MAX_URLS = 20; // Limit number of pages to test initially

export async function createSiteMap(baseURL, page) {
  await page.goto(baseURL + ENTRY_POINT);
  await page.waitForLoadState("networkidle");

  const urls = await page.evaluate(extractLocalLinks, baseURL);
  // Limit the number of URLs to avoid too many tests initially
  const limitedUrls = urls.slice(0, MAX_URLS);
  const data = JSON.stringify(limitedUrls, null, 4);
  writeFileSync(SITEMAP, data, { encoding: "utf-8" });
  console.log(`Saved ${limitedUrls.length} URLs to sitemap.json`);
}

export function readSiteMap() {
  try {
    const data = readFileSync(SITEMAP, { encoding: "utf-8" });
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error("Missing site map. Run tests to generate it first.");
    }
    throw err;
  }
}

// This function runs in the browser context
function extractLocalLinks(baseURL) {
  const urls = new Set();

  // Add homepage
  urls.add("/");

  // Extract links from the page
  const offset = baseURL.length;
  for (const { href } of document.links) {
    // Only include links to the same domain
    if (href.startsWith(baseURL)) {
      const path = href.slice(offset);
      // Skip empty paths and fragments
      if (path && !path.startsWith("#")) {
        // Remove trailing slash and query parameters for consistency
        const cleanPath = path.split("?")[0].split("#")[0];
        // Remove trailing slash unless it's the homepage
        const finalPath = cleanPath === "/" ? cleanPath : cleanPath.replace(/\/$/, "");
        urls.add(finalPath);
      }
    }
  }

  return Array.from(urls);
}
