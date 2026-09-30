import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for Next.js frontend
 * ADR-016 & F-015
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3030',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx next dev -p 3030',
    url: 'http://localhost:3030',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
});
