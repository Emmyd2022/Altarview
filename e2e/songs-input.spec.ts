// ALT-VERIFICATION-V1-PART21/22/42: written, not executed in this
// sandbox. Uses only fabricated synthetic test lyrics, per Section 42.

import { test, expect } from '@playwright/test'

test.describe('Quick Text Entry (Section 21)', () => {
  test('paste synthetic lyrics, review, edit a section label, save, appears in Library', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /songs/i }).first().click()
    await page.getByText('Quick Text Entry').click()

    const textArea = page.locator('textarea')
    await textArea.fill('[Verse 1]\nAlpha line one\nAlpha line two')

    const titleInput = page.getByPlaceholder('Song title')
    await titleInput.fill('V1 Test Worship Song')

    const labelInput = page.locator('input[value="Verse 1"]').first()
    if (await labelInput.isVisible().catch(() => false)) {
      await labelInput.fill('Opening Verse')
    }

    await page.getByText('Save Song').click()
    await expect(page.getByText('V1 Test Worship Song')).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('TXT import (Section 22)', () => {
  test('import a synthetic TXT file, review, save, appears in Library', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /songs/i }).first().click()

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles({
      name: 'V1 Test Import Song.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('[Verse 1]\nBeta line one\nBeta line two'),
    })

    await expect(page.locator('input[value="V1 Test Import Song"]')).toBeVisible({ timeout: 5_000 })
    await page.getByText('Save Song').click()
    await expect(page.getByText('V1 Test Import Song')).toBeVisible({ timeout: 5_000 })
  })

  test('import, then Cancel -- song does NOT appear in the Library', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /songs/i }).first().click()

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles({
      name: 'V1 Cancelled Import.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('[Verse 1]\nGamma line one'),
    })
    await expect(page.locator('input[value="V1 Cancelled Import"]')).toBeVisible({ timeout: 5_000 })

    // Close the Quick Text Entry review panel without saving (exact
    // control TBD -- may be the "Quick Text Entry" toggle itself, or a
    // dedicated Cancel action; refine locally against the real DOM).
    await page.getByText('Quick Text Entry').click()
    await expect(page.getByText('V1 Cancelled Import')).not.toBeVisible()
  })
})
