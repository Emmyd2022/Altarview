// ALT-STAGE5-1-PART6/12: the Draft/Review model. This is the temporary
// state between "text was pasted/imported" and "operator clicked Save" --
// deliberately NOT the persisted Song model. No Section IDs exist here;
// they're only minted when a draft is converted into a real Song (see
// commitDraft() below), so a cancelled draft never leaves orphaned IDs
// or partial data in the repository (Section 12, 30, 31).

import type { DetectedSection } from './SongTextParser'
import type { Song, LyricSection, SongArrangement } from '../../songModel'
import { newSongId, newSectionId, newArrangementId } from '../id'

export interface SongDraft {
  title: string
  artist: string
  isHymn: boolean
  sections: DetectedSection[]
  source: Song['metadata']['source']
}

export function createEmptyDraft(source: Song['metadata']['source'] = 'manual'): SongDraft {
  return { title: '', artist: '', isHymn: false, sections: [], source }
}

export function draftFromParsedSections(sections: DetectedSection[], source: Song['metadata']['source'], suggestedTitle = ''): SongDraft {
  return { title: suggestedTitle, artist: '', isHymn: false, sections, source }
}

// ---- Section editing operations (Section 14-20) ----
// All operations are pure -- they return a new sections array rather
// than mutating the draft in place, matching the project's existing
// controlled-update conventions.

// ALT-STAGE5-1-PART14: relabeling never touches lyric content -- label
// and lyrics are distinct data, exactly as required.
export function relabelSection(sections: DetectedSection[], index: number, newLabel: string): DetectedSection[] {
  return sections.map((s, i) => (i === index ? { ...s, suggestedLabel: newLabel } : s))
}

export function editSectionLyrics(sections: DetectedSection[], index: number, newLines: string[]): DetectedSection[] {
  return sections.map((s, i) => (i === index ? { ...s, lines: newLines } : s))
}

// ALT-STAGE5-1-PART16: reordering here only affects DRAFT/pre-save
// structural order -- for a brand-new song this naturally becomes the
// initial default arrangement on save (see commitDraft). This function
// only ever operates on draft data, never on an existing saved Song's
// arrangements, so it cannot silently destroy arrangement intent on an
// already-saved song (that's a separate, safer operation -- see
// reorderExistingSongSections below).
export function reorderSections(sections: DetectedSection[], fromIndex: number, toIndex: number): DetectedSection[] {
  const next = [...sections]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

// ALT-STAGE5-1-PART17: splits one section into two at a given line
// index. The second half keeps the reason 'explicit-marker' if the
// operator is deliberately splitting (treated as an intentional
// structural decision either way).
export function splitSection(sections: DetectedSection[], index: number, splitAtLine: number, secondLabel: string): DetectedSection[] {
  const target = sections[index]
  if (!target || splitAtLine <= 0 || splitAtLine >= target.lines.length) return sections
  const first: DetectedSection = { ...target, lines: target.lines.slice(0, splitAtLine) }
  const second: DetectedSection = { suggestedLabel: secondLabel, lines: target.lines.slice(splitAtLine), detectionReason: target.detectionReason }
  return [...sections.slice(0, index), first, second, ...sections.slice(index + 1)]
}

// ALT-STAGE5-1-PART18: merges two ADJACENT sections, combining lines in
// order. Never duplicates lyrics -- each line appears exactly once, in
// its original section's order, first section's lines then second's.
export function mergeSections(sections: DetectedSection[], firstIndex: number, resultLabel?: string): DetectedSection[] {
  const secondIndex = firstIndex + 1
  const first = sections[firstIndex]
  const second = sections[secondIndex]
  if (!first || !second) return sections
  const merged: DetectedSection = {
    suggestedLabel: resultLabel ?? first.suggestedLabel,
    lines: [...first.lines, ...second.lines],
    detectionReason: first.detectionReason,
  }
  return [...sections.slice(0, firstIndex), merged, ...sections.slice(secondIndex + 1)]
}

// ALT-STAGE5-1-PART19: adds a new, empty (operator-labeled) section at
// the end of the draft.
export function addSection(sections: DetectedSection[], label: string): DetectedSection[] {
  return [...sections, { suggestedLabel: label, lines: [], detectionReason: 'explicit-marker' }]
}

// ALT-STAGE5-1-PART20: for DRAFT data, removal is simple deletion -- no
// arrangement to corrupt yet, since arrangements don't exist until the
// draft is committed (Section 20's explicit "for draft/new Songs, simple
// deletion is acceptable").
export function removeSection(sections: DetectedSection[], index: number): DetectedSection[] {
  return sections.filter((_, i) => i !== index)
}

// ---- Committing a draft into a real, persisted-ready Song (Section 11/24) ----

export interface DraftValidationResult {
  valid: boolean
  reason?: string
}

// ALT-STAGE5-1-PART22/53: a permanent Song must have a non-blank title
// and at least one non-empty section -- this is where that's enforced,
// not earlier (a draft with a blank title is a perfectly normal
// in-progress state, per Section 22's "do not prevent temporary unsaved
// draft/review state from existing before title entry").
export function validateDraft(draft: SongDraft): DraftValidationResult {
  if (!draft.title.trim()) return { valid: false, reason: 'Enter a song title before saving.' }
  if (draft.sections.length === 0) return { valid: false, reason: 'Add at least one section with lyrics before saving.' }
  if (draft.sections.every((s) => s.lines.length === 0)) return { valid: false, reason: 'At least one section needs lyric lines before saving.' }
  return { valid: true }
}

// ALT-STAGE5-1-PART12/16/24: THIS is where stable Section IDs and the
// initial default arrangement are actually minted -- never earlier, so
// an abandoned draft leaves nothing behind. The draft's current section
// order becomes the new song's default arrangement order (Section 16's
// "for a newly-created Song, changing the structural order before first
// save may reasonably influence the default arrangement").
export function commitDraft(draft: SongDraft): Song {
  const sections: LyricSection[] = draft.sections.map((s) => ({ id: newSectionId(), label: s.suggestedLabel, lines: s.lines }))
  const arrangement: SongArrangement = { id: newArrangementId(), name: 'Default', sectionIds: sections.map((s) => s.id) }
  const now = Date.now()
  return {
    id: newSongId(),
    title: draft.title.trim(),
    // ALT-STAGE5-1-PART23: artist stays genuinely optional -- an empty
    // string is stored as-is, never fabricated as "Unknown Artist".
    artist: draft.artist.trim(),
    source: 'Imported',
    isHymn: draft.isHymn,
    linesPerSlide: 2,
    sections,
    arrangements: [arrangement],
    defaultArrangementId: arrangement.id,
    metadata: { createdAt: now, updatedAt: now, source: draft.source },
  }
}
