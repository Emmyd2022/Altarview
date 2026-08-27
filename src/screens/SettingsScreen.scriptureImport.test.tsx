// ALT-STAGE4-1: renders the REAL SettingsScreen component to prove the
// validated import pipeline is genuinely wired into the UI, not just
// available as an unused service. Covers Section 18 items J-M.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsScreen from './SettingsScreen'
import { LanguageProvider } from '../i18n'
import { scriptureEngine } from '../scripture/services/ScriptureEngine'

function renderSettings() {
  const onBibleImported = vi.fn()
  render(
    <LanguageProvider>
      <SettingsScreen onBibleImported={onBibleImported} />
    </LanguageProvider>,
  )
  return { onBibleImported }
}

function makeFile(content: string, name: string, type: string) {
  return new File([content], name, { type })
}

const VALID_JSON = JSON.stringify({
  translation: 'SETTINGSTEST',
  books: { Titus: { '5': ['settings integration verse one'] } }, // Titus has 3 real chapters; ch 5 exceeds it, used deliberately in the invalid test below instead
})

const VALID_JSON_OK = JSON.stringify({
  translation: 'SETTINGSTESTOK',
  books: { Titus: { '1': ['settings integration verse ok'] } },
})

const INVALID_JSON = JSON.stringify({
  translation: 'SETTINGSTESTBAD',
  books: { NotARealBook: { '1': ['text'] } },
})

describe('SettingsScreen Scripture import integration', () => {
  // J. Settings import calls the validated import pipeline.
  it('a valid JSON import commits and becomes queryable via ScriptureEngine', async () => {
    const { onBibleImported } = renderSettings()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeTruthy()

    const file = makeFile(VALID_JSON_OK, 'test.json', 'application/json')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => expect(onBibleImported).toHaveBeenCalled())
    // L. Valid imports become available after commit.
    const verse = scriptureEngine.getVerse('settingstestok', 'titus', 1, 1)
    expect(verse?.text).toBe('settings integration verse ok')
  })

  // K. Invalid import does not modify existing installed data.
  it('an invalid JSON import (unrecognized book) is rejected and commits nothing', async () => {
    const { onBibleImported } = renderSettings()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    const file = makeFile(INVALID_JSON, 'bad.json', 'application/json')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByText(/not a recognized Bible book/i)).toBeInTheDocument())
    expect(onBibleImported).not.toHaveBeenCalled()
    // Nothing under this translation id should be queryable.
    expect(scriptureEngine.getTranslation('settingstestbad')?.installed).not.toBe(true)
  })

  // K (continued): a chapter number exceeding the book's real canonical
  // range is also rejected, and does not partially commit.
  it('an invalid JSON import (chapter exceeding canonical range) commits nothing', async () => {
    const { onBibleImported } = renderSettings()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    const file = makeFile(VALID_JSON, 'toohigh.json', 'application/json') // Titus ch 5 -- Titus only has 3
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByText(/only has \d+ chapters/i)).toBeInTheDocument())
    expect(onBibleImported).not.toHaveBeenCalled()
    expect(scriptureEngine.getVerse('settingstest', 'titus', 5, 1)).toBeNull()
  })

  // M. Duplicate import behavior is safe and deterministic.
  it('importing the same valid file twice is safe and yields the same result both times', async () => {
    const { onBibleImported } = renderSettings()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(fileInput, { target: { files: [makeFile(VALID_JSON_OK, 'test.json', 'application/json')] } })
    await waitFor(() => expect(onBibleImported).toHaveBeenCalledTimes(1))

    fireEvent.change(fileInput, { target: { files: [makeFile(VALID_JSON_OK, 'test.json', 'application/json')] } })
    await waitFor(() => expect(onBibleImported).toHaveBeenCalledTimes(2))

    // Re-importing overwrites/re-commits the same chapter deterministically
    // -- still exactly one verse, same text, not duplicated or corrupted.
    const verse = scriptureEngine.getVerse('settingstestok', 'titus', 1, 1)
    expect(verse?.text).toBe('settings integration verse ok')
  })
})
