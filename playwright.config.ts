// ALT-VERIFICATION-V1-PART5/8/11: Playwright E2E configuration.
// Additional to Vitest/RTL/jsdom, not a replacement (Section 5).
// Launches the REAL Altarview Vite dev server -- tests operate through
// actual application routes, never mounting components in isolation
// (Section 9).

import { defineConfig, devices } from '@playwright/test'

const PORT = 5173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: `http://localhost:${PORT}`,
    // ALT-VERIFICATION-V1-PART11: diagnostics only on failure -- not on
    // every passing test, per explicit instruction against excessive
    // artifacts.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    viewport: { width: 1440, height: 900 }, // Section 44: normal desktop operator viewport
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // ALT-VERIFICATION-V1-PART8: real local Vite server, not a
  // StackBlitz-specific URL.
  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
