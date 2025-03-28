import { readSiteMap } from "./sitemap.js";
import { test, expect } from "@playwright/test";
import { join } from "node:path";

// Configuration for screenshots
const OPTIONS = {
  stylePath: join(__dirname, "./visual.tweaks.css"),
  fullPage: true, // Use Playwright's built-in full page capture
  timeout: 30000, // Significantly increased timeout for complex pages with animations
};

// Animation handling configuration
const ANIMATION_CONFIG = {
  scrollDelay: 300, // Increased delay between scroll steps (ms)
  scrollStep: 150, // Smaller steps for more granular scrolling
  finalDelay: 5000, // Longer wait time after scrolling for animations to finish
  maxWaitForDomContentLoaded: 10000, // Maximum time to wait for DOM content
  maxWaitForLoadEvent: 15000, // Maximum time to wait for load event
  maxWaitForNetworkIdle: 20000, // Maximum time to wait for network idle
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
    await page.waitForLoadState("networkidle", { timeout: ANIMATION_CONFIG.maxWaitForNetworkIdle });
    await page.waitForTimeout(2000);

    // Handle sliders and inline scripts
    await handleCustomElements(page);

    // Trigger scroll animations by scrolling through the entire page
    await triggerScrollAnimations(page);

    // Handle custom Point.dev attribute-based animations specifically
    await handlePointAttributeAnimations(page);

    // Wait for all animations to complete
    await page.waitForTimeout(ANIMATION_CONFIG.finalDelay);

    // Take the screenshot of the full page
    await expect(page).toHaveScreenshot(OPTIONS);
  });
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
 * Handler for custom elements like review sliders and inline scripts
 */
async function handleCustomElements(page) {
  await page.evaluate(() => {
    // Force sliders to initialize if they haven't already
    const sliders = document.querySelectorAll('[class*="slider"], [class*="carousel"], .swiper, .slick-slider, .splide');

    // For each slider, try common slider initialization methods
    sliders.forEach((slider) => {
      // Make slider visible
      slider.style.opacity = "1";
      slider.style.visibility = "visible";

      // If it's a hidden tab/panel, make it active/visible
      if (slider.getAttribute("aria-hidden") === "true") {
        slider.setAttribute("aria-hidden", "false");
      }

      // Move slider to active slide if possible
      const activeSlide = slider.querySelector('.active, .current, [aria-current="true"], [aria-selected="true"]');
      if (activeSlide) {
        activeSlide.scrollIntoView({ behavior: "auto", block: "center" });
      }
    });

    // Run inline scripts that might have been blocked
    document.querySelectorAll("script:not([src])").forEach((inlineScript) => {
      try {
        // This won't work for all inline scripts due to security, but helps in some cases
        if (inlineScript.textContent.includes("slider") || inlineScript.textContent.includes("carousel") || inlineScript.textContent.includes("swiper") || inlineScript.textContent.includes("slick")) {
          const newScript = document.createElement("script");
          newScript.textContent = inlineScript.textContent;
          document.head.appendChild(newScript);
        }
      } catch (e) {
        console.error("Error executing inline script:", e);
      }
    });

    // Force GSAP reveal animations to complete
    if (window.gsap) {
      const revealElements = document.querySelectorAll('[class*="reveal"], [class*="fade"], [data-animation]');
      revealElements.forEach((el) => {
        try {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            rotation: 0,
            duration: 0,
            delay: 0,
            ease: "none",
          });
        } catch (e) {
          // Fallback if gsap.to fails
          el.style.opacity = "1";
          el.style.transform = "none";
          el.style.visibility = "visible";
        }
      });
    }
  });

  // Wait for any changes to take effect
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
