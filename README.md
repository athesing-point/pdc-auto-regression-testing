# Point.dev Visual Regression Tests

This project sets up automated visual regression testing for https://www.point.dev/ using Playwright with Bun.

## Setup

1. Install Bun:

```bash
# macOS, Linux, or WSL
curl -fsSL https://bun.sh/install | bash

# Windows (via PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

2. Install dependencies:

```bash
bun install
```

3. Install browsers:

```bash
bun exec playwright install
```

## Running Tests

### First Run - Generate Baseline

The first time you run the tests, it will:

1. Crawl the Point.dev website to generate a sitemap
2. Create baseline screenshots for comparison

```bash
bun test
```

This initial run will "fail" because there are no baseline screenshots yet.

### Subsequent Runs

After the baseline is created, run the tests again to compare against the baselines:

```bash
bun test
```

### Updating Baselines

If you want to update the baseline screenshots (e.g., after an intentional design change):

```bash
bun run update
```

### Viewing Reports

To see the visual comparison report after tests:

```bash
bun run report
```

### Reset Everything

To clear all test artifacts and start fresh:

```bash
bun run reset
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
