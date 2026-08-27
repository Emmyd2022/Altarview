// ALT-STAGE5-2-PART5/11: the Song Presentation Layout domain. This is
// where "how many lyric lines appear at once" moves FROM Song.linesPerSlide
// (canonical Song content -- wrong layer) TO a presentation-layer
// concept. Song content (sections/lyrics/arrangements) remains
// completely unaware of any of this.

// ALT-STAGE5-2-PART5/33: replaces `Song.linesPerSlide` as the canonical
// source of "how many lines at once" -- this is presentation
// configuration, never Song content. `id` identifies which layout this
// is (e.g. a theme's lyric-region config, or a destination-specific
// override) so different destinations (Section 20/21) can hold
// different configs simultaneously.
export interface SongPresentationLayoutConfig {
  id: string
  maxLinesPerPage: number
  label?: string // e.g. "Lower Third", "Full Screen", "Foldback"
}

// ALT-STAGE5-2-PART17: a manual page-break override for one section
// occurrence. `afterLineIndex` values are 0-based indices INTO THAT
// SECTION's lines array (never a global/song-wide index) -- e.g. [1, 3]
// means "break after line index 1, and again after line index 3."
// Scoped to `sectionId` (+ optional `sectionOccurrence` if different
// occurrences of a repeated section should break differently -- Section
// 25's occurrence-independence). Storing this separately from Song
// content is what satisfies Section 17's "must NOT be written into
// canonical lyrics."
export interface ManualPageBreakOverride {
  sectionId: string
  sectionOccurrence?: number // if omitted, applies to every occurrence of this section
  afterLineIndexes: number[]
}

// ALT-STAGE5-2-PART10/11/26: structured, stable-enough derived identity
// for one generated presentation page. Never uses displayed lyric text,
// and never uses a bare array index as canonical identity -- every field
// here is a structured value a future AI mapping, pin, or navigation
// action can reconstruct from a semantic lyric position.
export interface SongPresentationPage {
  songId: string
  arrangementId: string
  sectionId: string
  sectionLabel: string
  sectionOccurrence: number // 1-based: which repetition of this section within the arrangement
  pageIndexWithinSection: number // 0-based: which page within THIS occurrence
  startLineIndex: number // 0-based, into the section's own lines array
  endLineIndex: number // inclusive
  lines: string[]
  layoutConfigId: string
}

// ALT-STAGE5-2-PART26: a stable, human-inspectable key for one page --
// useful for pinning/diagnostics/navigation without needing to compare
// every field of SongPresentationPage by hand.
export function pageKey(page: SongPresentationPage): string {
  return `${page.songId}|${page.arrangementId}|${page.sectionId}|occ${page.sectionOccurrence}|p${page.pageIndexWithinSection}|${page.layoutConfigId}`
}

// ALT-STAGE5-2-PART27/28: the preferred identity for PINNING a lyric
// position -- deliberately does NOT include a page number or layout
// config, per Section 28's explicit warning that page numbers change
// when layout changes. A pin stores WHERE in the song's actual lyrics
// this is (section + line), and resolves that into whatever page it
// currently falls on under the active layout at open time.
export interface SongLyricPosition {
  songId: string
  sectionId: string
  sectionOccurrence: number
  lineIndexInSection: number
}
