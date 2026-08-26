// ALT-STAGE4-PART30: recent scripture history. Deliberately lightweight
// -- a bounded in-memory list, not a database, per the brief's own
// "do not create a complicated database system solely for this."

import { useState, useCallback } from 'react'
import type { PassageReference } from '../types'

const MAX_HISTORY = 20

export interface RecentEntry {
  reference: PassageReference
  label: string // human-readable, e.g. "John 3:16-20" -- for display only
  openedAt: number
}

export function useRecentScripture() {
  const [history, setHistory] = useState<RecentEntry[]>([])

  const record = useCallback((reference: PassageReference, label: string) => {
    setHistory((prev) => {
      // Move to front if already present (same book/chapter/verse range
      // in the same translation), rather than creating a duplicate entry.
      const withoutDupe = prev.filter(
        (e) =>
          !(
            e.reference.translationId === reference.translationId &&
            e.reference.bookId === reference.bookId &&
            e.reference.startChapter === reference.startChapter &&
            e.reference.startVerse === reference.startVerse &&
            e.reference.endVerse === reference.endVerse
          ),
      )
      const next = [{ reference, label, openedAt: Date.now() }, ...withoutDupe]
      return next.slice(0, MAX_HISTORY)
    })
  }, [])

  const clear = useCallback(() => setHistory([]), [])

  return { history, record, clear }
}
