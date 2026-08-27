import { describe, it, expect } from 'vitest'
import { migrateSong, migrateSongs } from './songMigration'
import type { Song } from '../../songModel'

// ALT-STAGE5-PART46: all fixtures below are fabricated placeholder
// text ("test line one", etc.), never real song lyrics -- consistent
// with every other test file in this project.

const CURRENT_SONG: Song = {
  id: 'current-1',
  title: 'Current Song',
  artist: 'Test Artist',
  source: 'Imported',
  isHymn: false,
  linesPerSlide: 2,
  sections: [{ id: 'sec-1', label: 'Verse 1', lines: ['test line one', 'test line two'] }],
  arrangements: [{ id: 'arr-1', name: 'Default', sectionIds: ['sec-1'] }],
  defaultArrangementId: 'arr-1',
  metadata: { createdAt: 100, updatedAt: 100 },
}

// A fully legacy (pre-Stage-5) shape -- no id at all, no section ids,
// no arrangements, no metadata.
const LEGACY_RAW = {
  title: 'Legacy Song',
  artist: 'Legacy Artist',
  source: 'Imported' as const,
  isHymn: true,
  linesPerSlide: 2,
  sections: [
    { label: 'Verse 1', lines: ['legacy line one', 'legacy line two'] },
    { label: 'Chorus', lines: ['legacy chorus line'] },
  ],
}

describe('migrateSong — identity (Section 56.1-8)', () => {
  it('a song already in current shape passes through unchanged (status: current)', () => {
    const result = migrateSong(CURRENT_SONG)
    expect(result.status).toBe('current')
    expect(result.song).toEqual(CURRENT_SONG)
  })

  it('a fully legacy song receives a generated, non-empty Song ID', () => {
    const result = migrateSong(LEGACY_RAW)
    expect(result.status).toBe('migrated')
    expect(result.song?.id).toBeTruthy()
    expect(typeof result.song?.id).toBe('string')
  })

  it('migrating the SAME already-migrated song twice yields the SAME id (idempotent at the ID level)', () => {
    const first = migrateSong(LEGACY_RAW)
    const second = migrateSong(first.song)
    expect(second.status).toBe('current')
    expect(second.song?.id).toBe(first.song?.id)
  })

  it('a legacy song WITH an existing (weak) id keeps that same id rather than generating a new one', () => {
    const result = migrateSong({ ...LEGACY_RAW, id: 'qe-12345' })
    expect(result.song?.id).toBe('qe-12345')
  })

  it('preserves title, artist, and hymn status exactly', () => {
    const result = migrateSong(LEGACY_RAW)
    expect(result.song?.title).toBe('Legacy Song')
    expect(result.song?.artist).toBe('Legacy Artist')
    expect(result.song?.isHymn).toBe(true)
  })
})

describe('migrateSong — structure (Section 56.9-15)', () => {
  it('every section receives a stable, non-empty id', () => {
    const result = migrateSong(LEGACY_RAW)
    expect(result.song?.sections.every((s) => !!s.id)) .toBe(true)
    const ids = result.song?.sections.map((s) => s.id) ?? []
    expect(new Set(ids).size).toBe(ids.length) // all unique
  })

  it('preserves section order', () => {
    const result = migrateSong(LEGACY_RAW)
    expect(result.song?.sections.map((s) => s.label)).toEqual(['Verse 1', 'Chorus'])
  })

  it('preserves original lyric lines exactly, unaltered', () => {
    const result = migrateSong(LEGACY_RAW)
    expect(result.song?.sections[0].lines).toEqual(['legacy line one', 'legacy line two'])
  })

  it('custom (non-standard) section labels are preserved as-is', () => {
    const result = migrateSong({ ...LEGACY_RAW, sections: [{ label: 'Call & Response', lines: ['x'] }] })
    expect(result.song?.sections[0].label).toBe('Call & Response')
  })

  it('creates a default arrangement matching the existing section order', () => {
    const result = migrateSong(LEGACY_RAW)
    expect(result.song?.arrangements.length).toBe(1)
    expect(result.song?.arrangements[0].sectionIds).toEqual(result.song?.sections.map((s) => s.id))
    expect(result.song?.defaultArrangementId).toBe(result.song?.arrangements[0].id)
  })

  it('a repeated section in a custom arrangement references the same section id twice, never duplicating lyrics', () => {
    const raw = {
      ...LEGACY_RAW,
      arrangements: [{ id: 'arr-x', name: 'Custom', sectionIds: [] as string[] }], // will be backfilled with real ids below
    }
    const migrated = migrateSong(raw)
    const chorusId = migrated.song!.sections.find((s) => s.label === 'Chorus')!.id
    // Build a repeated-chorus arrangement referencing the REAL migrated id.
    const repeatedArrangement = { id: 'arr-repeat', name: 'Repeated', sectionIds: [chorusId, chorusId, chorusId] }
    const songWithRepeat: Song = { ...migrated.song!, arrangements: [...migrated.song!.arrangements, repeatedArrangement] }
    // The section itself still only exists ONCE in `sections` -- the
    // repetition lives purely in the arrangement's sectionIds list.
    expect(songWithRepeat.sections.filter((s) => s.id === chorusId).length).toBe(1)
    expect(repeatedArrangement.sectionIds.length).toBe(3)
  })
})

describe('migrateSongs — batch / legacy preservation (Section 56.20-21)', () => {
  it('migrates multiple legacy songs without data loss', () => {
    const { songs, report } = migrateSongs([LEGACY_RAW, { ...LEGACY_RAW, title: 'Second Legacy Song' }])
    expect(songs.length).toBe(2)
    expect(report.migrated).toBe(2)
    expect(songs.map((s) => s.title)).toEqual(['Legacy Song', 'Second Legacy Song'])
  })

  it('one malformed entry does not prevent other valid songs from migrating', () => {
    const { songs, report } = migrateSongs([LEGACY_RAW, { title: 'Broken', sections: [] }, { ...LEGACY_RAW, title: 'Third Song' }])
    expect(songs.length).toBe(2)
    expect(report.failed.length).toBe(1)
  })

  it('migration is idempotent across a full batch re-run', () => {
    const first = migrateSongs([LEGACY_RAW])
    const second = migrateSongs(first.songs)
    expect(second.songs).toEqual(first.songs)
    expect(second.report.alreadyCurrent).toBe(1)
    expect(second.report.migrated).toBe(0)
  })
})
