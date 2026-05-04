import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:3110',
    geolocation: { latitude: 59.9391, longitude: 30.3159 },
    permissions: ['geolocation'],
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'pnpm --filter @fishing/web dev --hostname 127.0.0.1 --port 3110',
    url: 'http://127.0.0.1:3110',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
