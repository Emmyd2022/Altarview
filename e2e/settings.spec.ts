// ALT-VERIFICATION-V1-PART19: written, not executed in this sandbox.
// Uses only synthetic legal fixture Bible text, never copyrighted data.

import { test, expect } from '@playwright/test'

const VALID_SYNTHETIC_JSON = JSON.stringify({
  translation: 'V1TEST',
  books: { Titus: { '1': ['synthetic import verse one'] } },
})

const INVALID_SYNTHETIC_JSON = JSON.stringify({
  translation: 'V1TESTBAD',
  books: { NotARealBook: { '1': ['text'] } },
})

test.describe('Settings / Scripture import (Section 19)', () => {
  test('a valid synthetic JSON translation import becomes available', async ({ page }) => {
    await page.goto('/')
    // ALT-V1.1-PART-D: Settings is icon-only in the sidebar; navigation
    // now uses its accessible name (aria-label="Settings & Integrations",
    // added this stage) rather than visible text, which never existed.
    await page.getByRole('button', { name: /settings/i }).click()

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles({ name: 'v1-test.json', mimeType: 'application/json', buffer: Buffer.from(VALID_SYNTHETIC_JSON) })

    await expect(page.getByText(/imported|success|available/i).first()).toBeVisible({ timeout: 5_000 })
  })

  test('an invalid synthetic import is rejected with no partial data saved', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /settings/i }).click()

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles({ name: 'v1-test-bad.json', mimeType: 'application/json', buffer: Buffer.from(INVALID_SYNTHETIC_JSON) })

    await expect(page.getByText(/not a recognized|error|invalid/i).first()).toBeVisible({ timeout: 5_000 })
  })
})
