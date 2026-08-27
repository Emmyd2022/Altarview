// ALT-STAGE5-2-PART21/23-25: Song page navigation. Deliberately generic
// and destination-AGNOSTIC -- it tracks position within ONE generated
// page sequence. Destination independence (Section 21's "do not store
// one global currentSongPage") comes from USING this hook once per
// destination (Preview/Live/Foldback), each potentially fed a
// DIFFERENT pages array (since Audience and Foldback may use different
// layouts, per Section 20), never from this hook managing multiple
// destinations itself -- exactly the same pattern already established
// for Scripture's Group/Active-Verse independence in Stage 4.

import { useState, useCallback } from 'react'
import type { SongPresentationPage } from './types'

export interface SongPageNavigation {
  pageIndex: number
  currentPage: SongPresentationPage | null
  next(): void
  previous(): void
  // ALT-STAGE5-2-1-PART22-26: jumps to the NEXT occurrence of this
  // section relative to the current position, wrapping to the first if
  // none is later in the sequence -- see implementation comment below
  // for the resolved ambiguity from the Stage 5.2 report.
  jumpToSection(sectionId: string): void
  // Explicit-occurrence jump, for callers (e.g. pin resolution) that
  // need a SPECIFIC occurrence rather than "next relative to current."
  jumpToSectionOccurrence(sectionId: string, occurrence: number): void
  hasNext: boolean
  hasPrevious: boolean
}

export function useSongPageNavigation(pages: SongPresentationPage[]): SongPageNavigation {
  const [pageIndex, setPageIndex] = useState(0)

  // ALT-STAGE5-2-PART12: pages regenerating (e.g. capacity changed)
  // naturally invalidates an out-of-range index -- clamp defensively so
  // navigation never points past the end of a freshly-regenerated list.
  const clampedIndex = pages.length === 0 ? 0 : Math.min(pageIndex, pages.length - 1)

  const next = useCallback(() => {
    setPageIndex((i) => Math.min(i + 1, Math.max(0, pages.length - 1)))
  }, [pages.length])

  const previous = useCallback(() => {
    setPageIndex((i) => Math.max(i - 1, 0))
  }, [])

  // ALT-STAGE5-2-1-PART22-26: resolves the Stage 5.2 report's flagged
  // ambiguity. A semantic section-jump now moves to the NEXT occurrence
  // of that section RELATIVE TO THE CURRENT position in the arrangement
  // sequence -- not always occurrence 1. If no later occurrence exists,
  // wraps to the first. This is what makes "press Chorus" predictable
  // during live worship: the operator always means "the next time this
  // section comes up from here," never "restart at the first one."
  const jumpToSection = useCallback(
    (sectionId: string) => {
      setPageIndex((currentIndex) => {
        // The first page index of every occurrence of this section, in
        // arrangement order.
        const occurrenceStarts: number[] = []
        let lastSeenOccurrence = -1
        pages.forEach((p, i) => {
          if (p.sectionId === sectionId && p.sectionOccurrence !== lastSeenOccurrence) {
            occurrenceStarts.push(i)
            lastSeenOccurrence = p.sectionOccurrence
          }
        })
        if (occurrenceStarts.length === 0) return currentIndex
        const next = occurrenceStarts.find((idx) => idx > currentIndex)
        return next !== undefined ? next : occurrenceStarts[0] // wrap to first occurrence
      })
    },
    [pages],
  )

  // ALT-STAGE5-2-1: explicit-occurrence jump, preserved for callers that
  // genuinely need a specific occurrence (e.g. resolving a pin) rather
  // than "next relative to current."
  const jumpToSectionOccurrence = useCallback(
    (sectionId: string, occurrence: number) => {
      const idx = pages.findIndex((p) => p.sectionId === sectionId && p.sectionOccurrence === occurrence)
      if (idx >= 0) setPageIndex(idx)
    },
    [pages],
  )

  return {
    pageIndex: clampedIndex,
    currentPage: pages[clampedIndex] ?? null,
    next,
    previous,
    jumpToSection,
    jumpToSectionOccurrence,
    hasNext: clampedIndex < pages.length - 1,
    hasPrevious: clampedIndex > 0,
  }
}
