# Point.com/.dev Visual Regression Tests

This project sets up automated visual regression testing for PDC/PDD websites using Playwright with Node.js.

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
