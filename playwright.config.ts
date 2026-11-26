import { defineConfig, devices } from '@playwright/test'

/**
 * UI end-to-end tests against the running Docker stack (docker compose up -d + pnpm seed).
 * They use the synthetic demo accounts and create uniquely named test articles.
 *
 *   pnpm test:e2e                 # desktop + mobile
 *   pnpm test:e2e --project=mobile
 */
const baseURL = process.env.PSU_KP_BASE_URL || 'http://localhost:3100'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.ts',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1, // tests share one seeded database
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL,
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } } },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      // Workflow/editor specs are covered on desktop; mobile focuses on reading & layout.
      testMatch: ['**/public.e2e.ts', '**/mobile.e2e.ts', '**/auth.e2e.ts'],
    },
  ],
})
