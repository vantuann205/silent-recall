import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3217',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'pnpm exec next dev --webpack --hostname 127.0.0.1 --port 3217',
    url: 'http://127.0.0.1:3217',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: { NEXT_PUBLIC_ENABLE_DEMO: 'true', NEXT_PUBLIC_CONTRACT_ADDRESS: '' },
  },
});
