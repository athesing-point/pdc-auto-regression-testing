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

### Test Workflow

The testing process has two main phases:

1. **Baseline Capture**: Generate reference screenshots without retries
2. **Visual Testing**: Compare against baselines with automatic retries on failure

#### Generating Baselines

When capturing baseline screenshots (no retries):

```bash
# For staging (point.dev)
bun run baseline:staging

# For production (point.com)
bun run baseline:prod

# For default URL
bun run baseline
```

#### Running Visual Tests

When running tests against existing baselines (includes 2 retries on failure):

```bash
# For staging (point.dev)
bun run test:staging

# For production (point.com)
bun run test:prod

# For default URL
bun run test
```

### Environment Options

Tests can be run against different environments:

- Staging (point.dev): Uses `https://www.point.dev`
- Production (point.com): Uses `https://point.com`
- Default: Uses staging URL if not specified

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

### Retry Behavior

- **Baseline Generation**: No retries (`GENERATE_BASELINE=true`)
- **Visual Testing**: 2 retries on failure
  - First attempt fails → Retry #1
  - Retry #1 fails → Retry #2
  - Retry #2 fails → Test fails
- Traces are captured on first retry for debugging

### Updating Baselines

If you want to update the baseline screenshots (e.g., after an intentional design change):

```bash
# For staging
bun run update:staging

# For production
bun run update:prod

# For default URL
bun run update
```

### Viewing Reports

To see the visual comparison report after tests:

```bash
bun run report
```

### Resetting Test Data

To clean up all test artifacts and start fresh:

```bash
bun run reset
```

This will remove:

- Playwright reports
- Test results
- Screenshot snapshots
