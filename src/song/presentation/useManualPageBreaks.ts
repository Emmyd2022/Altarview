// ALT-STAGE5-2-1-PART5-9: manual page break state. Purely UI/session
// state -- never written into Song.sections or canonical lyrics (per
// Section 8's explicit requirement). Feeds directly into
// generateSongPresentationPages() as its `manualBreaks` option, so
// changes are visible immediately without any Save-to-Song step.

import { useState, useCallback } from 'react'
import type { ManualPageBreakOverride } from './types'

export function useManualPageBreaks(initial: ManualPageBreakOverride[] = []) {
  const [breaks, setBreaks] = useState<ManualPageBreakOverride[]>(initial)

  // ALT-STAGE5-2-1-PART6: toggles a break after a given line index within
  // one section -- adding it if absent, removing it if present. This is
  // the "click between two lines" interaction the UI exposes.
  const toggleBreak = useCallback((sectionId: string, afterLineIndex: number, sectionOccurrence?: number) => {
    setBreaks((prev) => {
      const existingIdx = prev.findIndex((b) => b.sectionId === sectionId && b.sectionOccurrence === sectionOccurrence)
      if (existingIdx === -1) {
        return [...prev, { sectionId, sectionOccurrence, afterLineIndexes: [afterLineIndex] }]
      }
      const existing = prev[existingIdx]
      const hasBreak = existing.afterLineIndexes.includes(afterLineIndex)
      const newIndexes = hasBreak ? existing.afterLineIndexes.filter((i) => i !== afterLineIndex) : [...existing.afterLineIndexes, afterLineIndex].sort((a, b) => a - b)
      if (newIndexes.length === 0) {
        return prev.filter((_, i) => i !== existingIdx)
      }
      return prev.map((b, i) => (i === existingIdx ? { ...b, afterLineIndexes: newIndexes } : b))
    })
  }, [])

  const hasBreakAfter = useCallback(
    (sectionId: string, afterLineIndex: number, sectionOccurrence?: number): boolean => {
      const entry = breaks.find((b) => b.sectionId === sectionId && (b.sectionOccurrence === undefined || b.sectionOccurrence === sectionOccurrence))
      return entry?.afterLineIndexes.includes(afterLineIndex) ?? false
    },
    [breaks],
  )

  return { breaks, toggleBreak, hasBreakAfter }
}
