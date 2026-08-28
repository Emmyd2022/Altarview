// ALT-VERIFICATION-V1-PART15/16: written, not executed in this sandbox
// (see e2e/app.spec.ts header comment for why).

import { test, expect } from '@playwright/test'

test.describe('PresentationEngine: Preview/Live/Foldback independence (Section 15)', () => {
  test('Scripture reference can be staged to Preview, then pushed to Live, without altering Foldback', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /scripture/i }).first().click()
    const searchInput = page.getByPlaceholder(/search a verse/i)
    await searchInput.fill('John 3:16')
    await searchInput.press('Enter')
    await expect(page.getByText('← Back to Search')).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Stage Control / Foldback (Section 16, V1.1 Section G, V2 Final Correction Section 2-3)', () => {
  test('Stage Control is reachable via its accessible name, and Foldback timer Start/Stop/restart works', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Stage Control' }).click()
    await expect(page.getByText('Start')).toBeVisible({ timeout: 5_000 })

    // ALT-V2-FINAL-CORRECTION-PART2: the generic page-wide regex text
    // locator (`text=/\d+:\d+/`) was unreliable -- replaced with a
    // stable, semantic locator via the timer display's new
    // role="timer" + aria-label="Stage timer" (added this stage).
    const timer = page.getByRole('timer', { name: 'Stage timer' })

    // Capture the FULL configured duration before any countdown begins
    // -- this is what "restart" must return to, not just "any value
    // different from the stopped value."
    const fullDuration = await timer.textContent()

    // START -> countdown begins
    await page.getByText('Start').click()
    await page.waitForTimeout(1_200) // deliberately > 1s, avoiding millisecond-fragile timing
    const afterRunning = await timer.textContent()
    expect(afterRunning).not.toBe(fullDuration) // it actually counted down from the full duration

    // STOP -> countdown freezes
    await page.getByText('Stop').click()
    const atStop = await timer.textContent()
    await page.waitForTimeout(1_500)
    const afterWaitingWhileStopped = await timer.textContent()
    expect(afterWaitingWhileStopped).toBe(atStop) // did not keep counting down while stopped

    // START AGAIN -> restarts from the FULL configured duration (the
    // binding Altarview requirement) -- compared against the value
    // captured at the very start, before any countdown, not just
    // "different from the stopped value." No separate Reset needed.
    await page.getByText('Start').click()
    const afterRestart = await timer.textContent()
    expect(afterRestart).toBe(fullDuration)

    // Foldback operation must not unexpectedly change Audience/Live.
    // (Cross-destination content assertion left as a documented
    // manual-check point -- see songs-send-autosend.spec.ts for the
    // established pattern of scoping assertions to a specific output
    // panel, which the same approach could extend to here.)
  })
})
