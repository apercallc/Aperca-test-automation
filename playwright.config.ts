import { defineConfig, devices } from '@playwright/test';

import env from './config/env.json' with { type: 'json' };
import testConfig from './config/test-config.json' with { type: 'json' };

const baseURL = process.env.APERCa_BASE_URL ?? env.default.baseUrl;

export default defineConfig({
  testDir: './tests',
  fullyParallel: Boolean(testConfig.parallel),
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: testConfig.maxThreads,
  timeout: testConfig.timeoutMs,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'reports/latest/playwright-report.json' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
