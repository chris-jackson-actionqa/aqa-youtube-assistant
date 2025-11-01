import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Tests the complete YouTube Assistant system (frontend + backend)
 * Uses workspace-based isolation for parallel test execution
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  /* Maximum time one test can run for */
  timeout: 30 * 1000,

  /* Run tests in files in parallel - enabled for workspace-based isolation */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Use multiple workers for parallel execution */
  workers: process.env.CI ? 4 : 4, // Parallel execution enabled after workspace isolation verification

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  /* Global setup and teardown */
  // Disabled - database setup handled by ./scripts/setup-test-database.sh
  // globalSetup: require.resolve('./global-setup'),
  // globalTeardown: require.resolve('./global-teardown'),

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Capture screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Record video only when retaining a trace of a failed test */
    video: 'retain-on-failure',

    /* Maximum time each action such as `click()` can take */
    actionTimeout: 10 * 1000,

    /* Maximum time page.goto() can take */
    navigationTimeout: 30 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Uncomment to test on additional browsers
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     viewport: { width: 1280, height: 720 },
    //   },
    // },
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     viewport: { width: 1280, height: 720 },
    //   },
    // },
  ],

  /* 
   * Servers are managed externally via scripts in e2e/scripts/
   * - start-backend.sh: Starts backend with test database on port 8000
   * - start-frontend.sh: Starts frontend on port 3000
   * - kill-backend.sh: Stops backend server
   * - kill-frontend.sh: Stops frontend server
   * 
   * Run scripts before tests:
   *   ./scripts/start-backend.sh && ./scripts/start-frontend.sh && npm test
   */
});
