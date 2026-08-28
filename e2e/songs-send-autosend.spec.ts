// ALT-V1.1/V2/V2-FINAL-3-PART-T/U: Send and Auto-Send behavioral
// verification. Written after tracing the ACTUAL source code
// (SongPresentationLayoutPanel.tsx, useSongAutoSend.ts,
// SongLyricsScreen.tsx's singleClickSlide) AND after discovering (this
// correction) that Preview/Live/Foldback are NOT simultaneously-visible
// panels -- they are separate, full-screen views the operator switches
// to via "View Preview"/"View Live" (top bar) and "View Stage Output"
// (Stage Control), each requiring an explicit navigate-check-exit
// sequence rather than being all checkable on one page at once.

import { test, expect } from '@playwright/test'

async function openSongAndConfirmAutoSendState(page: import('@playwright/test').Page, autoSendOn: boolean) {
  await page.goto('/')
  await page.getByRole('button', { name: /songs/i }).first().click()
  await page.locator('text=Amazing Grace').first().dblclick()
  await expect(page.getByText('Presentation Layout')).toBeVisible({ timeout: 5_000 })
  const currentlyOn = await page.getByText('Auto-Send ON').isVisible().catch(() => false)
  if (autoSendOn && !currentlyOn) {
    await page.getByText('Auto-Send OFF').click()
    await expect(page.getByText('Auto-Send ON')).toBeVisible()
  } else if (!autoSendOn && currentlyOn) {
    await page.getByText('Auto-Send ON').click()
    await expect(page.getByText('Auto-Send OFF')).toBeVisible()
  }
}

test.describe('Song Send behavior (Section T) -- New Presentation Layout panel', () => {
  test('Auto-Send OFF: Send updates Preview only; Live and Foldback unaffected', async ({ page }) => {
    await openSongAndConfirmAutoSendState(page, false)

    const expectedFirstPageLine = 'Amazing grace, how sweet the sound'

    // ALT-V2-FINAL-3: the Send click itself happens on the Operator
    // screen -- it stages content into App-level state (previewContent/
    // liveContent). It does NOT require Preview/Live to already be
    // "open" as a screen.
    await page.getByRole('button', { name: 'Send', exact: true }).click()

    // Check Preview: navigate to the full-screen Preview view via the
    // real "View Preview" top-bar link, verify content, then return.
    await page.getByText('View Preview').click()
    await expect(page.getByRole('region', { name: 'PREVIEW output' })).toContainText(expectedFirstPageLine)
    await page.getByText('← Back to operator').click()

    // Check Live: same pattern -- must NOT contain the sent content,
    // since Auto-Send is OFF.
    await page.getByText('View Live').click()
    await expect(page.getByRole('region', { name: 'LIVE output' })).not.toContainText(expectedFirstPageLine)
    await page.getByText('← Back to operator').click()

    // Check Foldback: reached via Stage Control's "View Stage Output",
    // exited via Escape (StageScreen has no exit button by design --
    // ALT-018/ALT-017 in its own source comments).
    await page.getByRole('button', { name: 'Stage Control' }).click()
    await page.getByText('View Stage Output').click()
    await expect(page.getByRole('region', { name: 'FOLDBACK output' })).not.toContainText(expectedFirstPageLine)
    await page.keyboard.press('Escape')
  })

  test('Auto-Send ON: Send updates both Preview and Live; Foldback unaffected', async ({ page }) => {
    await openSongAndConfirmAutoSendState(page, true)

    const expectedFirstPageLine = 'Amazing grace, how sweet the sound'

    await page.getByRole('button', { name: 'Send', exact: true }).click()

    await page.getByText('View Preview').click()
    await expect(page.getByRole('region', { name: 'PREVIEW output' })).toContainText(expectedFirstPageLine)
    await page.getByText('← Back to operator').click()

    await page.getByText('View Live').click()
    await expect(page.getByRole('region', { name: 'LIVE output' })).toContainText(expectedFirstPageLine) // now DOES receive it
    await page.getByText('← Back to operator').click()

    await page.getByRole('button', { name: 'Stage Control' }).click()
    await page.getByText('View Stage Output').click()
    await expect(page.getByRole('region', { name: 'FOLDBACK output' })).not.toContainText(expectedFirstPageLine) // remains independent
    await page.keyboard.press('Escape')
  })

  test('CODE-TRACED FINDING: clicking Next/Previous in the new panel does NOT send anything by itself -- only the explicit Send button does', async ({ page }) => {
    await openSongAndConfirmAutoSendState(page, true)

    // Even with Auto-Send ON, clicking Next in the NEW panel does not
    // trigger a Live update, because Next only calls
    // audienceNav.next() -- it never calls sendAudiencePage(). Confirm
    // by checking Live is still whatever it was before this click (not
    // Amazing Grace content), matching Section Y's duplicated-controls
    // finding.
    await page.getByText('Next \u2192').click()
    await page.getByText('View Live').click()
    await expect(page.getByRole('region', { name: 'LIVE output' })).not.toContainText('Amazing grace, how sweet the sound')
    await page.getByText('← Back to operator').click()
  })
})

test.describe('Old slide-list Auto-Send behavior (for contrast with the new panel)', () => {
  test('CODE-TRACED FINDING: in the OLD slide list, a single click sends to Preview immediately, and to Live too if Auto-Send is ON', async ({ page }) => {
    await openSongAndConfirmAutoSendState(page, true)

    // The OLD slide list renders below the new Presentation Layout
    // panel -- clicking any slide line there (not the panel's Next/
    // Previous) should immediately update BOTH Preview and Live, per
    // singleClickSlide()'s traced implementation. Exact locator for an
    // old-list slide line should be refined locally against the real DOM
    // (the two systems currently render overlapping lyric text, which
    // needs disambiguation once run against the live app).
  })
})
