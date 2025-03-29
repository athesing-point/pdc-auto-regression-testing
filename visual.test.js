import { readSiteMap } from "./sitemap.js";
import { test, expect } from "@playwright/test";
import { join } from "node:path";

// Define viewport configurations
const VIEWPORT_CONFIGS = {
  desktop_large: { width: 1920 },
  desktop: { width: 992 },
  tablet: { width: 768 },
  mobile: { width: 375 },
};

// Configuration for screenshots
const getScreenshotOptions = (viewport) => ({
  stylePath: join(__dirname, "./visual.tweaks.css"),
  fullPage: true,
  timeout: 60000,
  animations: "disabled",
  scale: "css",
  attachments: true, // Ensure screenshots are attached to the report
  omitBackground: true, // Make background transparent for better diff visibility
  name: `${viewport.width}x${viewport.height}`, // Name screenshots based on viewport
});

// Animation handling configuration
const ANIMATION_CONFIG = {
  scrollDelay: 500, // Increased delay between scroll steps (ms)
  scrollStep: 150, // Smaller steps for more granular scrolling
  finalDelay: 8000, // Longer wait time after scrolling for animations to finish
  maxWaitForDomContentLoaded: 60000, // Maximum time to wait for DOM content
  maxWaitForLoadEvent: 60000, // Maximum time to wait for load event
  maxWaitForNetworkIdle: 60000, // Maximum time to wait for network idle
};

// Add script loading configuration
const REQUIRED_SCRIPTS = {
  gsap: "https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js",
  nav: "https://cdn.jsdelivr.net/gh/athesing-point/pdc-nav@v2.1.1/dist/nav-states.js",
  animations: "https://cdn.jsdelivr.net/gh/athesing-point/gsap-animations@main/dist/animations.js",
  formLabels: "https://cdn.jsdelivr.net/gh/athesing-point/pdc-custom-code@latest/utilities/form-labels.min.js",
  // utmPersistence: "https://cdn.jsdelivr.net/gh/TO-Point/utm-persistence@a9c0c24/index.min.js",
  sliderDots: "https://cdn.jsdelivr.net/npm/@finsweet/attributes-sliderdots@1/sliderdots.js",
};

// Try to load the sitemap
let sitemap = [];
try {
  sitemap = readSiteMap();
} catch (err) {
  test("site map missing", async ({ page }) => {
    throw new Error("Missing site map. Run tests once to generate it first.");
  });
}

// Generate tests for each URL and viewport combination
for (const url of sitemap) {
  for (const [viewportName, viewport] of Object.entries(VIEWPORT_CONFIGS)) {
    test(`${url} [${viewportName}]`, async ({ page }) => {
      test.setTimeout(120000);

      await page.setViewportSize({
        width: viewport.width,
        height: 800,
      });

      // Set longer timeouts for page navigation
      page.setDefaultNavigationTimeout(ANIMATION_CONFIG.maxWaitForNetworkIdle);
      page.setDefaultTimeout(ANIMATION_CONFIG.maxWaitForNetworkIdle);

      // Navigate to the page with extended wait times
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: ANIMATION_CONFIG.maxWaitForNetworkIdle,
      });

      // Wait for initial content
      await page.waitForLoadState("domcontentloaded", { timeout: ANIMATION_CONFIG.maxWaitForDomContentLoaded });
      await page.waitForLoadState("load", { timeout: ANIMATION_CONFIG.maxWaitForLoadEvent });

      // Ensure required scripts are loaded
      await ensureScriptsLoaded(page);

      // Wait for network idle after script injection
      await page.waitForLoadState("networkidle", { timeout: ANIMATION_CONFIG.maxWaitForNetworkIdle });

      // Handle Webflow-specific initialization
      await handleWebflowInit(page);

      // Handle sliders and inline scripts
      await handleCustomElements(page);

      // Trigger scroll animations
      await triggerScrollAnimations(page);

      // Wait for all animations to complete
      await page.waitForTimeout(ANIMATION_CONFIG.finalDelay);

      // Take both a comparison screenshot and a report screenshot
      const screenshotPath = `${viewportName}-${url.replace(/\//g, "_")}.png`;

      // Take a screenshot for the report
      await page.screenshot({
        path: `playwright-report/attachments/${screenshotPath}`,
        fullPage: true,
        animations: "enabled",
        scale: "css",
      });

      // Take the comparison screenshot
      await expect(page).toHaveScreenshot({
        ...getScreenshotOptions(viewport),
        name: screenshotPath,
      });

      // Attach additional metadata to help with debugging
      await test.info().attach("page-state", {
        body: JSON.stringify(
          {
            url,
            viewport: viewportName,
            timestamp: new Date().toISOString(),
            scripts: await page.evaluate(() =>
              Array.from(document.scripts)
                .map((s) => s.src)
                .filter(Boolean)
            ),
          },
          null,
          2
        ),
        contentType: "application/json",
      });
    });
  }
}

/**
 * Handler for Webflow-specific initialization
 */
async function handleWebflowInit(page) {
  await page.evaluate(() => {
    // Force all Webflow videos to show first frame
    document.querySelectorAll(".w-background-video").forEach((video) => {
      const poster = video.getAttribute("data-poster-url");
      if (poster) {
        video.style.backgroundImage = `url(${poster})`;
      }
    });

    // Force all Webflow animations to complete
    document.querySelectorAll("[data-anim]").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.visibility = "visible";
    });

    // Handle Webflow-specific elements
    document.querySelectorAll("[data-w-id]").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.visibility = "visible";
    });

    // Initialize Webflow dropdowns
    document.querySelectorAll(".w-dropdown").forEach((dropdown) => {
      const toggle = dropdown.querySelector(".w-dropdown-toggle");
      const list = dropdown.querySelector(".w-dropdown-list");
      if (toggle && list) {
        list.classList.add("w--open");
      }
    });
  });

  await page.waitForTimeout(2000);
}

/**
 * Handler specifically for Point.dev's custom attribute-based animations
 * Based on https://github.com/athesing-point/gsap-animations
 */
async function handlePointAttributeAnimations(page) {
  await page.evaluate(() => {
    // Trigger all custom attribute animations based on the Point.dev GSAP library
    const animElements = document.querySelectorAll("[data-anim]");

    animElements.forEach((el) => {
      // Get animation type and settings
      const animType = el.getAttribute("data-anim");
      const duration = parseFloat(el.getAttribute("data-duration") || "0.4");
      const delay = parseFloat(el.getAttribute("data-delay") || "0");

      // Force to final state based on animation type
      if (window.gsap) {
        try {
          // Apply transforms based on animation type
          switch (animType) {
            case "fadeIn":
              gsap.to(el, { opacity: 1, duration: 0, delay: 0 });
              break;
            case "slideUp":
              gsap.to(el, { opacity: 1, y: 0, duration: 0, delay: 0 });
              break;
            case "slideDown":
              gsap.to(el, { opacity: 1, y: 0, duration: 0, delay: 0 });
              break;
            case "slideLeft":
              gsap.to(el, { opacity: 1, x: 0, duration: 0, delay: 0 });
              break;
            case "slideRight":
              gsap.to(el, { opacity: 1, x: 0, duration: 0, delay: 0 });
              break;
            case "scaleIn":
              gsap.to(el, { opacity: 1, scale: 1, duration: 0, delay: 0 });
              break;
            case "flipUp":
              gsap.to(el, {
                opacity: 1,
                y: 0,
                rotationX: 0,
                duration: 0,
                delay: 0,
              });
              break;
            default:
              // For any other custom animations
              gsap.to(el, {
                opacity: 1,
                y: 0,
                x: 0,
                scale: 1,
                rotation: 0,
                rotationX: 0,
                rotationY: 0,
                duration: 0,
                delay: 0,
              });
          }
        } catch (e) {
          // CSS fallback if GSAP fails
          el.style.opacity = "1";
          el.style.transform = "none";
          el.style.visibility = "visible";
        }
      } else {
        // If GSAP isn't available, use CSS
        el.style.opacity = "1";
        el.style.transform = "none";
        el.style.visibility = "visible";
        el.style.transition = "none";
      }
    });

    // Try to refresh ScrollTrigger if it exists
    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === "function") {
      window.ScrollTrigger.refresh();
    }

    // Alternative location in GSAP namespace
    if (window.gsap && window.gsap.ScrollTrigger && typeof window.gsap.ScrollTrigger.refresh === "function") {
      window.gsap.ScrollTrigger.refresh();
    }
  });
}

/**
 * Handler for custom elements like sliders
 */
async function handleCustomElements(page) {
  await page.evaluate(() => {
    // Force sliders to initialize
    document.querySelectorAll(".w-slider").forEach((slider) => {
      slider.style.opacity = "1";
      slider.style.visibility = "visible";

      // Make first slide active
      const slides = slider.querySelectorAll(".w-slide");
      slides.forEach((slide, index) => {
        if (index === 0) {
          slide.style.opacity = "1";
          slide.style.visibility = "visible";
        } else {
          slide.style.display = "none";
        }
      });
    });

    // Run any inline scripts
    document.querySelectorAll("script:not([src])").forEach((script) => {
      try {
        if (script.textContent.includes("slider") || script.textContent.includes("w-") || script.textContent.includes("Webflow")) {
          const newScript = document.createElement("script");
          newScript.textContent = script.textContent;
          document.head.appendChild(newScript);
        }
      } catch (e) {
        console.error("Error executing inline script:", e);
      }
    });
  });

  await page.waitForTimeout(2000);
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

    // Handle common slider libraries
    if (window.Swiper) {
      document.querySelectorAll(".swiper").forEach((el) => {
        const swiperInstance = el.swiper;
        if (swiperInstance && typeof swiperInstance.update === "function") {
          swiperInstance.update();
        }
      });
    }

    if (window.jQuery && window.jQuery.fn.slick) {
      window.jQuery(".slick-slider").slick("refresh");
    }

    if (window.Splide) {
      document.querySelectorAll(".splide").forEach((el) => {
        const splideInstance = el.splide;
        if (splideInstance && typeof splideInstance.refresh === "function") {
          splideInstance.refresh();
        }
      });
    }

    // Scroll back to top
    window.scrollTo(0, 0);
  });

  // Wait for animations to finish after scrolling
  await page.waitForTimeout(ANIMATION_CONFIG.finalDelay);
}

/**
 * Ensures all required scripts are loaded and executed
 */
async function ensureScriptsLoaded(page) {
  // Check which scripts are already loaded
  const loadedScripts = await page.evaluate(() => {
    return Array.from(document.getElementsByTagName("script")).map((script) => script.src);
  });

  // Load any missing scripts
  for (const [key, url] of Object.entries(REQUIRED_SCRIPTS)) {
    if (!loadedScripts.includes(url)) {
      await page.evaluate(async (scriptUrl) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = scriptUrl;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }, url);
    }
  }

  // Wait for GSAP to be available and initialized
  await page.waitForFunction(() => window.gsap !== undefined);

  // Wait for Point-specific scripts to initialize
  await page.evaluate(async () => {
    // Wait for nav states to initialize
    if (typeof window.Point !== "undefined" && typeof window.Point.Nav !== "undefined") {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Wait for animations to initialize
    if (typeof window.gsap !== "undefined" && typeof window.gsap.timeline !== "undefined") {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Force all GSAP animations to complete
    if (window.gsap && window.gsap.globalTimeline) {
      window.gsap.globalTimeline.progress(1);
    }
  });

  // Additional wait to ensure everything is stable
  await page.waitForTimeout(2000);
}
