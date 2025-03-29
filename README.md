# Point.dev Visual Regression Tests

This project sets up automated visual regression testing for Point.dev websites using Playwright with Node.js.

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

### Environment Options

You can run tests against different environments:

- Staging (point.dev): `npm run test:staging`
- Production (point.com): `npm run test:prod`
- Default (staging): `npm test`

### Hardware Considerations

The test suite is configured to run with 24 parallel workers by default, which is optimized for high-performance machines (like M2 Max). If you're running on a lower-powered computer, you may want to reduce the number of parallel workers to avoid overwhelming your system.

To adjust the number of workers, modify the `workers` setting in `playwright.config.js`:

```js
// For lower-powered machines, reduce this number (e.g., 4-8)
workers: IS_CI ? 1 : 24,
```

Recommended worker counts:

- High-end machines (M2 Max, high-memory systems): 16-24 workers
- Mid-range machines: 8-12 workers
- Lower-end machines: 4-8 workers
- CI environment: 1 worker (automatically set)

### First Run - Generate Baseline

The first time you run the tests, it will:

1. Crawl the website to generate a sitemap
2. Create baseline screenshots for comparison

```bash
# For staging
npm run test:staging

# For production
npm run test:prod
```

This initial run will "fail" because there are no baseline screenshots yet.

### Subsequent Runs

After the baseline is created, run the tests again to compare against the baselines:

```bash
# For staging
npm run test:staging

# For production
npm run test:prod
```

### Updating Baselines

If you want to update the baseline screenshots (e.g., after an intentional design change):

```bash
# For staging
npm run update:staging

# For production
npm run update:prod
```

### Viewing Reports

To see the visual comparison report after tests:

```bash
npm run report
```
