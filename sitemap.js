import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Configuration
const SITEMAP = join(__dirname, "./sitemap.json");
const MAX_URLS = 20; // Limit number of pages to test initially

// URL patterns to sample (only test one instance of each pattern)
const TEMPLATE_PATTERNS = {
  blog: {
    pattern: /^\/blog\/(?!category|author)/, // Match blog posts but not category/author pages
    sampleSize: 1, // Only test one blog post as they use the same template
  },
  testimonials: {
    pattern: /^\/testimonials/,
    sampleSize: 1,
  },
  help: {
    pattern: /^\/helps?\//,
    sampleSize: 1,
  },
  legal: {
    pattern: /^\/(terms|privacy|licenses)/,
    sampleSize: 1,
  },
};

export async function createSiteMap(baseURL, page) {
  // Determine if we're in staging or production
  const isStaging = baseURL.includes("point.dev");

  // Always get sitemap from the current environment
  const sitemapUrl = `${baseURL}/sitemap.xml`;

  // Fetch the XML sitemap
  await page.goto(sitemapUrl);
  await page.waitForLoadState("networkidle");

  // Extract URLs from the XML sitemap
  const urls = await page.evaluate(() => {
    const urlElements = document.querySelectorAll("loc");
    return Array.from(urlElements).map((el) => el.textContent);
  });

  // Process URLs with template sampling
  const processedUrls = new Set();
  const templateSamples = new Map();

  // First pass: Collect template samples
  for (const url of urls) {
    const path = new URL(url).pathname;

    // Skip certain paths
    if (path.includes("/dev/") || path.includes("/archives/") || path.includes("/detail_")) {
      continue;
    }

    let isTemplateSample = false;
    for (const [key, { pattern, sampleSize }] of Object.entries(TEMPLATE_PATTERNS)) {
      if (pattern.test(path)) {
        if (!templateSamples.has(key)) {
          templateSamples.set(key, new Set());
        }
        const samples = templateSamples.get(key);
        if (samples.size < sampleSize) {
          samples.add(path);
          isTemplateSample = true;
        }
        break;
      }
    }

    if (!isTemplateSample) {
      processedUrls.add(path);
    }
  }

  // Add template samples to processed URLs
  for (const samples of templateSamples.values()) {
    for (const sample of samples) {
      processedUrls.add(sample);
    }
  }

  // Convert to array and limit
  const finalUrls = Array.from(processedUrls)
    .slice(0, MAX_URLS)
    .map((path) => path.replace(/\/+$/, "")); // Remove trailing slashes

  // Save to sitemap.json
  const data = JSON.stringify(finalUrls, null, 2);
  writeFileSync(SITEMAP, data, { encoding: "utf-8" });
  console.log(`Saved ${finalUrls.length} URLs to sitemap.json (including ${templateSamples.get("blog")?.size || 0} blog post sample)`);
  console.log(`Testing against ${isStaging ? "staging (point.dev)" : "production (point.com)"}`);
  return finalUrls;
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
