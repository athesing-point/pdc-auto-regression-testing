# Point.dev Visual Regression Tests

This project sets up automated visual regression testing for https://www.point.dev/ using Playwright.

## Setup

1. Install dependencies:

```
npm install
```

2. Install browsers:

```
npx playwright install
```

## Running Tests

### First Run - Generate Baseline

The first time you run the tests, it will:

1. Crawl the Point.dev website to generate a sitemap
2. Create baseline screenshots for comparison

```
npm test
```

This initial run will "fail" because there are no baseline screenshots yet.

### Subsequent Runs

After the baseline is created, run the tests again to compare against the baselines:

```
npm test
```

### Updating Baselines

If you want to update the baseline screenshots (e.g., after an intentional design change):

```
npm run update
```

### Viewing Reports

To see the visual comparison report after tests:

```
npm run report
```

### Reset Everything

To clear all test artifacts and start fresh:

```
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
