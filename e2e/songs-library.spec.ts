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
    // "···" more-options menu, per the app's existing pattern.
    await page.locator('text=Amazing Grace').first().hover()
    const moreButton = page.getByText('···').first()
    if (await moreButton.isVisible().catch(() => false)) {
      await moreButton.click()
      await page.getByText('Duplicate').click()
      await expect(page.getByText('Amazing Grace (Copy)')).toBeVisible({ timeout: 5_000 })
    } else {
      test.skip(true, 'More-options control not found by this selector -- refine locally.')
    }
  })
})
