// ALT-STAGE5-2-PART29-32: the Song Auto-Send foundation. Deliberately
// simple -- an ON/OFF state plus a wrapper that, when ON, also calls the
// destination's send callback after a navigation action. NOT connected
// to Deepgram/AI in any way (Section 59) -- this is purely the
// presentation-side mechanism a future AI layer would eventually drive.

import { useState, useCallback } from 'react'
import type { SongPresentationPage } from './types'

export interface SongAutoSend {
  enabled: boolean
  toggle(): void
  setEnabled(value: boolean): void
  // ALT-STAGE5-2-PART29/32: wraps a navigation action -- if Auto-Send is
  // ON and a valid page resulted, sends it; if generation failed
  // (page is null), does NOT clear whatever is currently on Live
  // (Section 32's explicit safety requirement) and instead reports the
  // failure so the UI can show it.
  afterNavigate(page: SongPresentationPage | null, sendToLive: (page: SongPresentationPage) => void): { sent: boolean; error?: string }
}

export function useSongAutoSend(initialEnabled = false): SongAutoSend {
  const [enabled, setEnabled] = useState(initialEnabled)

  const toggle = useCallback(() => setEnabled((v) => !v), [])

  const afterNavigate = useCallback(
    (page: SongPresentationPage | null, sendToLive: (page: SongPresentationPage) => void) => {
      if (!enabled) return { sent: false }
      if (!page) {
        // ALT-STAGE5-2-PART32: generation failed/produced nothing --
        // never blank out Live; report the problem instead.
        return { sent: false, error: 'Could not generate a valid page to send.' }
      }
      sendToLive(page)
      return { sent: true }
    },
    [enabled],
  )

  return { enabled, toggle, setEnabled, afterNavigate }
}
