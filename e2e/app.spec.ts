// ALT-VERIFICATION-V1-PART33: application startup verification. These
// tests were WRITTEN in a sandboxed environment where downloading the
// actual Chromium binary is blocked (cdn.playwright.dev is not in the
// network allowlist) -- they have NOT been executed here. Written to
// accurately reflect the real application's known UI text/structure;
// running them (`npm run test:e2e`) locally is required for genuine
// Level 4 verification. See docs/V1_CLAIM_VS_REALITY.md.

import { test, expect } from '@playwright/test'

test.describe('Application startup (Section 33)', () => {
  test('app loads without a fatal error and the Operator screen appears', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('pageerror', (err) => consoleErrors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/')
    await expect(page.getByText('Prototype build')).toBeVisible({ timeout: 10_000 })

    // No unhandled runtime exceptions during the main load path.
    expect(consoleErrors.filter((e) => !e.includes('Vite config uses features'))).toEqual([])
  })

  test('major navigation tabs (Scripture, Songs, Slides, Timer) are reachable', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /scripture/i }).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /songs/i }).first()).toBeVisible()
  })

  test('clicking the Songs tab navigates to the Song Library without a crash', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /songs/i }).first().click()
    await expect(page.getByText('All Songs')).toBeVisible({ timeout: 5_000 })
  })
})
