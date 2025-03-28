# Point.dev Visual Regression Tests

This project sets up automated visual regression testing for https://www.point.dev/ using Playwright with Node.js.

## Setup

1. Make sure you have Node.js installed (v16 or later recommended):

```bash
# Check Node.js version
node --version

# If not installed, download from https://nodejs.org/
```

2. Install dependencies:

```bash
npm install
```

3. Install browsers:

```bash
npx playwright install
```

## Running Tests

### First Run - Generate Baseline

The first time you run the tests, it will:

1. Crawl the Point.dev website to generate a sitemap
2. Create baseline screenshots for comparison

```bash
npm test
```

This initial run will "fail" because there are no baseline screenshots yet.

### Subsequent Runs

After the baseline is created, run the tests again to compare against the baselines:

```bash
npm test
```

### Updating Baselines

If you want to update the baseline screenshots (e.g., after an intentional design change):

```bash
npm run update
```

### Viewing Reports

To see the visual comparison report after tests:

```bash
npm run report
```

### Reset Everything

To clear all test artifacts and start fresh:

```bash
npm run reset
```

## Customization

- `playwright.config.js` - Configure browsers, viewport size
- `sitemap.js` - Adjust crawling behavior and URL extraction
- `visual.tweaks.css` - Add CSS to suppress flaky elements
- `visual.test.js` - Modify screenshot capture behavior

## Troubleshooting

If you encounter flaky tests:

1. Check if dynamic elements need to be hidden in `visual.tweaks.css`
2. Increase timeout values in `visual.test.js`
3. Consider limiting the number of pages tested by editing `MAX_URLS` in `sitemap.js`

## Special Handling for GSAP Animations

This testing setup includes special support for Point.dev's custom GSAP animation library, ensuring that:

1. All elements with `data-anim` attributes are properly triggered
2. ScrollTrigger animations are fully executed before screenshots are taken
3. Review sliders and interactive elements are properly displayed

The tests will automatically:

- Scroll through pages to trigger animations
- Force animations to their final state
- Wait appropriate times for animations to complete
- Ensure all custom GSAP animations have completed properly
