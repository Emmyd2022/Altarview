// ALT-VERIFICATION-V1-PART20: written, not executed in this sandbox.

import { test, expect } from '@playwright/test'

test.describe('Song Library (Section 20)', () => {
  test('Songs tab opens, library is visible, search and Hymns filter work', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /songs/i }).first().click()
    await expect(page.getByText('All Songs')).toBeVisible({ timeout: 5_000 })
    await page.getByText('Hymns').click()
    await expect(page.getByText('Amazing Grace')).toBeVisible()

    const filterInput = page.getByPlaceholder(/filter song library/i)
    await filterInput.fill('Amazing')
    await expect(page.getByText('Amazing Grace')).toBeVisible()
  })

  test('opening a song (double-click) shows the opened-song view', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /songs/i }).first().click()
    await page.locator('text=Amazing Grace').first().dblclick()
    await expect(page.getByText('← Back to Songs')).toBeVisible({ timeout: 5_000 })
  })

  test('Duplicate creates an independent copy visible in the library', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /songs/i }).first().click()
    // ALT-V1.1-PART-D/M: overflow button now has a stable, per-song
    // accessible name (aria-label="More options for Amazing Grace",
    // added this stage) instead of relying on hover + a bare "···"
    // text-content selector.
    await page.getByRole('button', { name: 'More options for Amazing Grace' }).click()
    // ALT-V1.1-PART-D: exact role/name match -- "Merge Duplicates (1)"
    // and "Duplicate" both contain the substring "Duplicate", so a
    // non-exact text selector matched both ambiguously. This was
    // confirmed to be a TEST selector defect, not a product defect --
    // the menu itself already renders both as clearly distinct items.
    await page.getByRole('button', { name: 'Duplicate', exact: true }).click()
    await expect(page.getByText('Amazing Grace (Copy)')).toBeVisible({ timeout: 5_000 })
  })
})
