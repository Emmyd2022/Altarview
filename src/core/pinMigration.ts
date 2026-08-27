// ALT-STAGE4-2-PART15/16/17: legacy pin migration. Old persisted pins
// (from before this stage) have a flat shape -- `verseRef: string`,
// `songTitle: string`, etc. directly on the item, no `target` field.
// This module detects that shape and converts it into the new
// `target: PinTarget` shape, using the Stage 4 canonical reference
// parser for Scripture. One malformed legacy pin is skipped (with a
// console warning for debugging) rather than crashing the whole load.

import type { PinnedItem, PinTarget } from '../pinModel'
import { parseReference } from '../scripture/parser/referenceParser'

// The old flat shape, kept here only for migration purposes -- not used
// anywhere else in the app anymore.
interface LegacyPinnedItem {
  id: string
  type: 'verse' | 'song' | 'slide' | 'timer' | 'up-next'
  label: string
  detail?: string
  verseRef?: string
  verseTranslation?: string
  verseText?: string
  songTitle?: string
  songArtist?: string
  songLines?: string[]
  slideText?: string
  timerMinutes?: number
  upNextStyleId?: string
}

function isLegacyShape(raw: unknown): raw is LegacyPinnedItem {
  if (!raw || typeof raw !== 'object') return false
  const obj = raw as Record<string, unknown>
  // New-shape pins have a `target` object; legacy pins never do.
  return typeof obj.id === 'string' && typeof obj.type === 'string' && !('target' in obj)
}

function isNewShape(raw: unknown): raw is PinnedItem {
  if (!raw || typeof raw !== 'object') return false
  const obj = raw as Record<string, unknown>
  return typeof obj.id === 'string' && typeof obj.target === 'object' && obj.target !== null
}

// ALT-STAGE4-2-PART6: uses the same canonical parser as everywhere else
// in the Scripture domain -- no second reference-parsing implementation.
function migrateLegacyVerseRef(verseRef: string, translation: string): PassageReferenceLike | null {
  const parsed = parseReference(verseRef)
  if (!parsed) return null
  return {
    translationId: translation,
    bookId: parsed.bookId,
    startChapter: parsed.chapter,
    startVerse: parsed.startVerse,
    endChapter: parsed.chapter,
    endVerse: parsed.endVerse === -1 ? parsed.startVerse : parsed.endVerse,
  }
}

// Local alias to avoid a circular-ish import surface just for a type.
type PassageReferenceLike = { translationId: string; bookId: string; startChapter: number; startVerse: number; endChapter: number; endVerse: number }

export interface MigrationReport {
  migrated: number
  alreadyCurrent: number
  failed: { id: string; reason: string }[]
}

// ALT-STAGE4-2-PART16: never throws -- a malformed legacy pin is
// reported and dropped, everything else in the collection still loads.
export function migratePinnedItem(raw: unknown): { item: PinnedItem | null; status: 'migrated' | 'current' | 'failed'; reason?: string } {
  if (isNewShape(raw)) {
    return { item: raw, status: 'current' }
  }
  if (!isLegacyShape(raw)) {
    return { item: null, status: 'failed', reason: 'Unrecognized pin shape (neither legacy nor current).' }
  }

  const legacy = raw
  let target: PinTarget | null = null

  if (legacy.type === 'verse') {
    if (!legacy.verseRef || !legacy.verseTranslation) {
      return { item: null, status: 'failed', reason: `Legacy verse pin "${legacy.id}" is missing verseRef/verseTranslation.` }
    }
    const reference = migrateLegacyVerseRef(legacy.verseRef, legacy.verseTranslation)
    if (!reference) {
      return { item: null, status: 'failed', reason: `Legacy verse pin "${legacy.id}" has an unparseable reference: "${legacy.verseRef}".` }
    }
    target = { type: 'scripture', reference }
  } else if (legacy.type === 'song') {
    if (!legacy.songTitle || !legacy.songLines) {
      return { item: null, status: 'failed', reason: `Legacy song pin "${legacy.id}" is missing songTitle/songLines.` }
    }
    target = { type: 'song', songTitle: legacy.songTitle, songArtist: legacy.songArtist, songLines: legacy.songLines }
  } else if (legacy.type === 'slide') {
    if (!legacy.slideText) {
      return { item: null, status: 'failed', reason: `Legacy slide pin "${legacy.id}" is missing slideText.` }
    }
    target = { type: 'slide', slideText: legacy.slideText }
  } else if (legacy.type === 'timer') {
    if (legacy.timerMinutes === undefined) {
      return { item: null, status: 'failed', reason: `Legacy timer pin "${legacy.id}" is missing timerMinutes.` }
    }
    target = { type: 'timer', minutes: legacy.timerMinutes }
  } else if (legacy.type === 'up-next') {
    target = { type: 'up-next', styleId: legacy.upNextStyleId }
  } else {
    return { item: null, status: 'failed', reason: `Legacy pin "${legacy.id}" has an unrecognized type.` }
  }

  return {
    item: { id: legacy.id, label: legacy.label, detail: legacy.detail, createdAt: Date.now(), target },
    status: 'migrated',
  }
}

// ALT-STAGE4-2-PART29: real migration integration point -- called once
// on app load with the raw list read back from persistence. Idempotent:
// running it again on an already-migrated list just returns the same
// items unchanged (status 'current' for each).
export function migratePinnedItems(rawItems: unknown[]): { items: PinnedItem[]; report: MigrationReport } {
  const items: PinnedItem[] = []
  const report: MigrationReport = { migrated: 0, alreadyCurrent: 0, failed: [] }

  for (const raw of rawItems) {
    const result = migratePinnedItem(raw)
    if (result.item) {
      items.push(result.item)
      if (result.status === 'migrated') report.migrated += 1
      else report.alreadyCurrent += 1
    } else {
      const id = raw && typeof raw === 'object' && 'id' in raw ? String((raw as Record<string, unknown>).id) : 'unknown'
      report.failed.push({ id, reason: result.reason ?? 'Unknown migration failure.' })
      // eslint-disable-next-line no-console
      console.warn(`[Altarview] Skipped a pinned item that could not be migrated (id: ${id}): ${result.reason}`)
    }
  }

  return { items, report }
}
