// ALT-VERIFICATION-V1-PART25: THE critical test this verification stage
// exists for. Not executed in this sandboxed environment (Chromium
// download blocked) -- written to be run locally by the user, exactly
// through the real UI path: launch app -> Songs -> open a Song. Never
// mounts SongPresentationLayoutPanel in isolation.

import { test, expect } from '@playwright/test'

test.describe('Stage 5.2.1: Song Presentation Layout panel visibility (Section 25)', () => {
  test('the Presentation Layout panel is visible after opening a song through the real Songs tab', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /songs/i }).first().click()
    await expect(page.getByText('All Songs')).toBeVisible({ timeout: 5_000 })

    // ALT-VERIFICATION-V1: opening a song requires a DOUBLE-click, not a
    // single click (confirmed by direct source inspection of
    // SongLyricsScreen.tsx's onDoubleClick handler). A single click only
    // highlights the row. This exact distinction is one candidate
    // explanation for the reported discrepancy -- see
    // docs/V1_CLAIM_VS_REALITY.md.
    const firstSongRow = page.locator('text=Amazing Grace').first()
    await firstSongRow.dblclick()

    await expect(page.getByText('Presentation Layout')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('Audience lines:')).toBeVisible()
    await expect(page.getByText('Foldback lines:')).toBeVisible()
    await expect(page.getByText('Pin Song')).toBeVisible()
  })

  test('Audience and Foldback capacity inputs are independently editable in the real UI', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /songs/i }).first().click()
    await page.locator('text=Amazing Grace').first().dblclick()
    await expect(page.getByText('Presentation Layout')).toBeVisible({ timeout: 5_000 })

    const audienceInput = page.getByText('Audience lines:').locator('input')
    const foldbackInput = page.getByText('Foldback lines:').locator('input')
    await audienceInput.fill('1')
    await expect(foldbackInput).toHaveValue('4')
  })

  test('manual page break control is reachable and toggles', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /songs/i }).first().click()
    await page.locator('text=Amazing Grace').first().dblclick()
    await expect(page.getByText('Presentation Layout')).toBeVisible({ timeout: 5_000 })

    const breakButton = page.getByText('+ Page Break').first()
    await expect(breakButton).toBeVisible()
    await breakButton.click()
    await expect(page.getByText('Page Break (click to remove)').first()).toBeVisible()
  })

  test('Pin Section and Pin Current Slide buttons are reachable', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /songs/i }).first().click()
    await page.locator('text=Amazing Grace').first().dblclick()
    await expect(page.getByText('Presentation Layout')).toBeVisible({ timeout: 5_000 })

    await expect(page.getByText('Pin Section')).toBeVisible()
    await expect(page.getByText('Pin Current Slide')).toBeVisible()
  })
})
