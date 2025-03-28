import { BASE_URL, BROWSERS } from "./playwright.config.js";
import { createSiteMap, readSiteMap } from "./sitemap.js";
import playwright from "@playwright/test";

export default async function globalSetup(config) {
  // Only create site map if it doesn't already exist
  try {
    readSiteMap();
    return;
  } catch (err) {}

  // Launch browser and initiate crawler
  const browser = playwright.devices[BROWSERS[0]].defaultBrowserType;
  const launchedBrowser = await playwright[browser].launch();
  const page = await launchedBrowser.newPage();
  await createSiteMap(BASE_URL, page);
  await launchedBrowser.close();
}
