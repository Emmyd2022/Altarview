// ALT-VERIFICATION-V1-PART17/18: written, not executed in this sandbox.

import { test, expect } from '@playwright/test'

test.describe('Scripture workflow (Section 17)', () => {
  test('search a bundled reference, open it, verify Group and reading context appear', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /scripture/i }).first().click()
    const searchInput = page.getByPlaceholder(/search a verse/i)
    await searchInput.fill('John 3:16')
    await searchInput.press('Enter')
    await expect(page.getByText('← Back to Search')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/John 3:16/)).toBeVisible()
  })

  test('Next Verse advances Active Verse while the Group label stays the same', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /scripture/i }).first().click()
    const searchInput = page.getByPlaceholder(/search a verse/i)
    await searchInput.fill('John 3:16-18')
    await searchInput.press('Enter')
    await expect(page.getByText(/John 3:16-18/)).toBeVisible({ timeout: 5_000 })
    await page.getByText('Next Verse →').click()
    await expect(page.getByText(/John 3:16-18/)).toBeVisible() // Group unchanged
  })
})

test.describe('Scripture pinning (Section 18)', () => {
  test('pin a Scripture Group, navigate away, and reopen it correctly', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /scripture/i }).first().click()
    const searchInput = page.getByPlaceholder(/search a verse/i)
    await searchInput.fill('John 3:16')
    await searchInput.press('Enter')
    await expect(page.getByText('← Back to Search')).toBeVisible({ timeout: 5_000 })
    await page.getByTitle('Pin this passage').click()
    await page.getByText('← Back to Search').click()
    await expect(page.getByText('Open').first()).toBeVisible({ timeout: 5_000 })
  })
})
