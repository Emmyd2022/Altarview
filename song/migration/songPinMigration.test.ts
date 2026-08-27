import { describe, it, expect } from 'vitest'
import { migrateSongPin, migrateSongPins } from './songPinMigration'
import type { PinnedItem } from '../../pinModel'
import type { Song } from '../../songModel'

// ALT-STAGE5-PART46: fabricated placeholder fixtures, never real lyrics.
function makeSong(id: string, title: string, artist = 'Test Artist'): Song {
  return {
    id,
    title,
    artist,
    source: 'Imported',
    isHymn: false,
    linesPerSlide: 2,
    sections: [{ id: `${id}-sec`, label: 'Verse 1', lines: ['placeholder line'] }],
    arrangements: [{ id: `${id}-arr`, name: 'Default', sectionIds: [`${id}-sec`] }],
    defaultArrangementId: `${id}-arr`,
    metadata: { createdAt: 1, updatedAt: 1 },
  }
}

const legacyPin = (title: string, artist?: string): PinnedItem => ({
  id: 'pin-1',
  label: title,
  createdAt: 1,
  target: { type: 'song', songTitle: title, songArtist: artist, songLines: ['placeholder line'] },
})

describe('migrateSongPin (Section 56.33-37)', () => {
  it('a new pin (already has songId) is left as-is', () => {
    const pin: PinnedItem = { id: 'p1', label: 'X', createdAt: 1, target: { type: 'song', songId: 'song-a', songTitle: 'X', songLines: ['x'] } }
    const result = migrateSongPin(pin, [makeSong('song-a', 'X')])
    expect(result.outcome).toBe('already-resolved')
  })

  it('a legacy title-based pin resolves to the matching song\u2019s stable id when exactly one match exists', () => {
    const songs = [makeSong('song-a', 'Unique Title')]
    const result = migrateSongPin(legacyPin('Unique Title'), songs)
    expect(result.outcome).toBe('resolved')
    expect(result.pin.target.type === 'song' && result.pin.target.songId).toBe('song-a')
  })

  it('rename does not break a resolved pin -- pin still resolves by id, not by (now-stale) title', () => {
    const songs = [makeSong('song-a', 'New Title After Rename')]
    // Pin was resolved BEFORE the rename -- it already carries songId.
    const pin: PinnedItem = { id: 'p1', label: 'Old Title', createdAt: 1, target: { type: 'song', songId: 'song-a', songTitle: 'Old Title', songLines: ['x'] } }
    // Migration should leave it alone (already resolved) regardless of
    // the title mismatch -- the id is authoritative.
    const result = migrateSongPin(pin, songs)
    expect(result.outcome).toBe('already-resolved')
    expect(result.pin.target.type === 'song' && result.pin.target.songId).toBe('song-a')
  })

  it('an ambiguous legacy pin (multiple songs share the title) is NOT silently resolved to either one', () => {
    const songs = [makeSong('song-a', 'Duplicate Title'), makeSong('song-b', 'Duplicate Title')]
    const result = migrateSongPin(legacyPin('Duplicate Title'), songs)
    expect(result.outcome).toBe('ambiguous')
    expect(result.pin.target.type === 'song' && result.pin.target.songId).toBeUndefined()
  })

  it('a legacy pin whose song no longer exists is left as a safe title-only pin, not dropped', () => {
    const result = migrateSongPin(legacyPin('Nonexistent Song'), [makeSong('song-a', 'Different Song')])
    expect(result.outcome).toBe('not-found')
    expect(result.pin).toBeDefined() // pin itself is preserved, just unresolved
  })

  it('migration never crashes on a deleted-song scenario (Section 46/56.37)', () => {
    expect(() => migrateSongPin(legacyPin('Anything'), [])).not.toThrow()
  })
})

describe('migrateSongPins — batch', () => {
  it('reports resolved, ambiguous, and not-found counts correctly across a mixed batch', () => {
    const songs = [makeSong('a', 'Song A'), makeSong('b', 'Song B'), makeSong('c', 'Song B')] // B is ambiguous
    const pins = [legacyPin('Song A'), legacyPin('Song B'), legacyPin('Song Z')]
    const { pins: migrated, report } = migrateSongPins(pins, songs)
    expect(report.resolved).toBe(1)
    expect(report.ambiguous.length).toBe(1)
    expect(report.notFound.length).toBe(1)
    expect(migrated.length).toBe(3) // nothing dropped
  })
})
