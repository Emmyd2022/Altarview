// ALT-VERIFICATION-V1-PART31/32: real browser IndexedDB persistence,
// verified via actual page.reload() -- NOT an in-memory StorageProvider
// test double. This is the ONE category of verification that
// fundamentally cannot be simulated by Vitest and requires a real
// browser -- the exact reason this test exists. Written, not executed
// in this sandbox (Chromium download blocked); running this file
// locally is the only way to get genuine persistence verification.

import { test, expect } from '@playwright/test'

test.describe('Real IndexedDB persistence (Section 31)', () => {
  test('a created Song survives a full page reload', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /songs/i }).first().click()
    await page.getByText('Quick Text Entry').click()
    await page.locator('textarea').fill('[Verse 1]\nPersistence test line one')
    await page.getByPlaceholder('Song title').fill('V1 Persistence Test Song')
    await page.getByText('Save Song').click()
    await expect(page.getByText('V1 Persistence Test Song')).toBeVisible({ timeout: 5_000 })

    // ALT-VERIFICATION-V1-PART32: this is an ACTUAL browser reload, not
    // React state re-render -- the distinguishing factor for real
    // persistence verification.
    await page.reload()
    await page.getByRole('button', { name: /songs/i }).first().click()
    await expect(page.getByText('V1 Persistence Test Song')).toBeVisible({ timeout: 5_000 })
  })

  test('a pinned Scripture item survives a full page reload', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /scripture/i }).first().click()
    const searchInput = page.getByPlaceholder(/search a verse/i)
    await searchInput.fill('John 3:16')
    await searchInput.press('Enter')
    await expect(page.getByText('← Back to Search')).toBeVisible({ timeout: 5_000 })
    await page.getByTitle('Pin this passage').click()

    await page.reload()
    await page.getByRole('button', { name: /scripture/i }).first().click()
    await expect(page.getByText('Open').first()).toBeVisible({ timeout: 5_000 })
  })
})
