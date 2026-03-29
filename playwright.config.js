const { defineConfig, devices } = require('@playwright/test');

const isUI = process.argv.includes('--ui');
const baseURL = process.env.TEST_URL || 'http://localhost:8080';

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  ...(!isUI && {
    webServer: {
      command: 'npm run dev',
      url: baseURL,
      reuseExistingServer: !process.env.CI,
    },
  }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
