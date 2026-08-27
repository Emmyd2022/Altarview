// ALT-STAGE5-PART24/25: legacy Song migration. Songs persisted before
// this stage may be missing section IDs, arrangements, defaultArrangementId,
// and metadata entirely (the type didn't have them yet), or may have a
// weak `id` (the old `qe-${Date.now()}` / `dup-${Date.now()}` / numeric-
// literal pattern). This backfills everything needed while preserving
// title/artist/lyrics/hymn-status exactly -- and is idempotent: a song
// that already has the full current shape is returned unchanged.

import type { Song, LyricSection } from '../../songModel'
import { newSongId, newSectionId, newArrangementId } from '../id'

function isLegacyShapeSong(raw: unknown): raw is Partial<Song> & { sections?: unknown[] } {
  return !!raw && typeof raw === 'object' && 'title' in raw && 'sections' in raw
}

// ALT-STAGE5-PART25: a song is considered "already current" only if
// EVERY required Stage 5 field is present -- partial legacy data (e.g.
// has sections but no arrangements) is still migrated, filling in only
// what's missing rather than rebuilding the whole object.
function needsMigration(song: Partial<Song>): boolean {
  if (!song.arrangements || song.arrangements.length === 0) return true
  if (!song.defaultArrangementId) return true
  if (!song.metadata) return true
  if (!song.sections?.every((s: { id?: string }) => 'id' in s && !!s.id)) return true
  return false
}

export interface SongMigrationReport {
  migrated: number
  alreadyCurrent: number
  failed: { id: string; reason: string }[]
}

export function migrateSong(raw: unknown): { song: Song | null; status: 'migrated' | 'current' | 'failed'; reason?: string } {
  if (!isLegacyShapeSong(raw)) {
    return { song: null, status: 'failed', reason: 'Unrecognized song shape (missing title/sections).' }
  }
  if (!needsMigration(raw)) {
    return { song: raw as Song, status: 'current' }
  }

  const rawSections = (raw.sections ?? []) as { id?: string; label: string; lines: string[] }[]
  if (rawSections.length === 0) {
    return { song: null, status: 'failed', reason: `Song "${raw.title}" has no sections to migrate.` }
  }

  // ALT-STAGE5-PART7/25: generate a stable ID only if one doesn't
  // already exist -- a song migrated once and persisted must keep the
  // SAME id on every subsequent migration pass (idempotency at the
  // persistence level, per the brief's explicit requirement).
  const id = raw.id && raw.id.trim() ? raw.id : newSongId()
  const sections: LyricSection[] = rawSections.map((s) => ({ id: s.id && s.id.trim() ? s.id : newSectionId(), label: s.label, lines: s.lines }))

  // ALT-STAGE5-PART17: existing section order becomes the initial
  // default arrangement -- preserves exactly what the operator already
  // sees, per Section 17's explicit requirement.
  const arrangements =
    raw.arrangements && raw.arrangements.length > 0
      ? raw.arrangements
      : [{ id: newArrangementId(), name: 'Default', sectionIds: sections.map((s) => s.id) }]
  const defaultArrangementId = raw.defaultArrangementId && arrangements.some((a: { id: string }) => a.id === raw.defaultArrangementId) ? raw.defaultArrangementId : arrangements[0].id

  const now = Date.now()
  const metadata = raw.metadata ?? { createdAt: now, updatedAt: now, source: 'migrated-prototype-data' as const }

  const song: Song = {
    id,
    title: raw.title ?? 'Untitled',
    artist: raw.artist ?? '',
    source: raw.source ?? 'Imported',
    isHymn: raw.isHymn ?? false,
    linesPerSlide: raw.linesPerSlide ?? 2,
    sections,
    arrangements,
    defaultArrangementId,
    metadata,
  }

  return { song, status: 'migrated' }
}

export function migrateSongs(rawSongs: unknown[]): { songs: Song[]; report: SongMigrationReport } {
  const songs: Song[] = []
  const report: SongMigrationReport = { migrated: 0, alreadyCurrent: 0, failed: [] }

  for (const raw of rawSongs) {
    const result = migrateSong(raw)
    if (result.song) {
      songs.push(result.song)
      if (result.status === 'migrated') report.migrated += 1
      else report.alreadyCurrent += 1
    } else {
      const id = raw && typeof raw === 'object' && 'id' in raw ? String((raw as Record<string, unknown>).id) : 'unknown'
      report.failed.push({ id, reason: result.reason ?? 'Unknown migration failure.' })
      // eslint-disable-next-line no-console
      console.warn(`[Altarview] Skipped a song that could not be migrated (id: ${id}): ${result.reason}`)
    }
  }

  return { songs, report }
}
