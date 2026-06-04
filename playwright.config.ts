import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  expect: {
    timeout: 8000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    headless: true
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
});
