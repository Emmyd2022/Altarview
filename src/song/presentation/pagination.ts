// ALT-STAGE5-2-PART4/12/46: the core Song Presentation Layout Engine.
// A pure function: Song + arrangementId + layout config (+ optional
// manual breaks) in, SongPresentationPage[] out. Never mutates the Song.
//
// THE SECTION BOUNDARY INVARIANT (Section 4) is enforced by
// CONSTRUCTION, not merely by testing: this function processes each
// arrangement entry's section lines in complete isolation -- it is
// structurally impossible for a page to contain lines from two
// different sections, because pagination never sees more than one
// section's lines array at a time.

import type { Song, SongArrangement } from '../../songModel'
import type { SongPresentationLayoutConfig, SongPresentationPage, ManualPageBreakOverride } from './types'

// ALT-STAGE5-2-PART45: capacity validation. A positive integer,
// clamped to a sane range -- 0/negative/NaN/Infinity can never produce
// broken (empty or unbounded) pages.
const MIN_CAPACITY = 1
const MAX_CAPACITY = 50 // generous upper bound; nothing legitimate needs more lines on one page

export function validateCapacity(maxLinesPerPage: number): number {
  if (!Number.isFinite(maxLinesPerPage) || Number.isNaN(maxLinesPerPage)) return MIN_CAPACITY
  return Math.min(MAX_CAPACITY, Math.max(MIN_CAPACITY, Math.floor(maxLinesPerPage)))
}

function findManualBreak(overrides: ManualPageBreakOverride[] | undefined, sectionId: string, occurrence: number): ManualPageBreakOverride | undefined {
  if (!overrides) return undefined
  return overrides.find((o) => o.sectionId === sectionId && (o.sectionOccurrence === undefined || o.sectionOccurrence === occurrence))
}

// ALT-STAGE5-2-PART16/17: builds page line-ranges for ONE section's
// lines, either from manual break points or automatic capacity
// chunking. Never sees any other section's data -- this function's
// signature itself (just `string[]`) makes cross-section bleed
// structurally impossible.
function paginateLines(lines: string[], capacity: number, manualBreak: ManualPageBreakOverride | undefined): { start: number; end: number }[] {
  if (lines.length === 0) return []

  if (manualBreak && manualBreak.afterLineIndexes.length > 0) {
    // ALT-STAGE5-2-PART17: sorted, deduplicated, clamped to valid
    // in-section range -- a stale break index (e.g. pointing past the
    // end after lyrics were edited shorter) is silently ignored rather
    // than producing a broken/empty page (Section 44's "stale manual
    // break" failure mode).
    const validBreaks = Array.from(new Set(manualBreak.afterLineIndexes))
      .filter((i) => i >= 0 && i < lines.length - 1)
      .sort((a, b) => a - b)
    if (validBreaks.length > 0) {
      const ranges: { start: number; end: number }[] = []
      let start = 0
      for (const breakAfter of validBreaks) {
        ranges.push({ start, end: breakAfter })
        start = breakAfter + 1
      }
      ranges.push({ start, end: lines.length - 1 })
      return ranges
    }
  }

  // Automatic capacity-based chunking -- a partially filled final page
  // is valid and expected (Section 14); never pulls from elsewhere to
  // fill it.
  const ranges: { start: number; end: number }[] = []
  for (let start = 0; start < lines.length; start += capacity) {
    ranges.push({ start, end: Math.min(start + capacity - 1, lines.length - 1) })
  }
  return ranges
}

export interface GeneratePagesOptions {
  manualBreaks?: ManualPageBreakOverride[]
}

// ALT-STAGE5-2-PART12: the main entry point. Resolves arrangement order,
// tracks per-section occurrence counts, paginates each occurrence's
// lines independently, and returns pages in arrangement (presentation)
// order.
export function generateSongPresentationPages(
  song: Song,
  arrangement: SongArrangement,
  layoutConfig: SongPresentationLayoutConfig,
  options: GeneratePagesOptions = {},
): SongPresentationPage[] {
  const capacity = validateCapacity(layoutConfig.maxLinesPerPage)
  const sectionsById = new Map(song.sections.map((s) => [s.id, s]))
  const occurrenceCounts = new Map<string, number>()
  const pages: SongPresentationPage[] = []

  for (const sectionId of arrangement.sectionIds) {
    const section = sectionsById.get(sectionId)
    // ALT-STAGE5-2-PART44: a broken arrangement reference (section
    // deleted/renamed-away since the arrangement was created) is
    // skipped rather than crashing generation -- fails safely, per
    // Section 44's explicit "broken Section ID in arrangement" case.
    if (!section) continue

    const occurrence = (occurrenceCounts.get(sectionId) ?? 0) + 1
    occurrenceCounts.set(sectionId, occurrence)

    // ALT-STAGE5-2-PART15: an empty section (Instrumental, Intro with no
    // lyric lines) is simply omitted from lyric-page generation -- the
    // simplest behavior that avoids ever creating an unexpected blank
    // Live page.
    if (section.lines.length === 0) continue

    const manualBreak = findManualBreak(options.manualBreaks, sectionId, occurrence)
    const ranges = paginateLines(section.lines, capacity, manualBreak)

    ranges.forEach((range, pageIndexWithinSection) => {
      pages.push({
        songId: song.id,
        arrangementId: arrangement.id,
        sectionId,
        sectionLabel: section.label,
        sectionOccurrence: occurrence,
        pageIndexWithinSection,
        startLineIndex: range.start,
        endLineIndex: range.end,
        lines: section.lines.slice(range.start, range.end + 1),
        layoutConfigId: layoutConfig.id,
      })
    })
  }

  return pages
}
