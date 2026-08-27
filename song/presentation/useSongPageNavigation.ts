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
  // ALT-STAGE5-2-PART24/25: jumps to the first page of a section
  // occurrence. Defaults to occurrence 1 (the "primary"/first
  // occurrence) when not specified -- the documented, predictable rule
  // for a section-jump control that doesn't yet know which repetition
  // the operator means.
  jumpToSection(sectionId: string, occurrence?: number): void
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

  const jumpToSection = useCallback(
    (sectionId: string, occurrence = 1) => {
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
    hasNext: clampedIndex < pages.length - 1,
    hasPrevious: clampedIndex > 0,
  }
}
