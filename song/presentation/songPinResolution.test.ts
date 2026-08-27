import { describe, it, expect } from 'vitest'
import { resolveSongLyricPositionPin } from './songPinResolution'
import type { Song, SongArrangement } from '../../songModel'

function makeSong(): { song: Song; arrangement: SongArrangement } {
  const arrangement: SongArrangement = { id: 'arr-1', name: 'Default', sectionIds: ['verse1', 'chorus'] }
  const song: Song = {
    id: 'song-1',
    title: 'Pin Test Song',
    artist: '',
    source: 'Imported',
    isHymn: false,
    linesPerSlide: 2,
    sections: [
      { id: 'verse1', label: 'Verse 1', lines: ['v1', 'v2', 'v3', 'v4', 'v5'] },
      { id: 'chorus', label: 'Chorus', lines: ['c1', 'c2'] },
    ],
    arrangements: [arrangement],
    defaultArrangementId: arrangement.id,
    metadata: { createdAt: 1, updatedAt: 1 },
  }
  return { song, arrangement }
}

describe('resolveSongLyricPositionPin (Section 51.31-35)', () => {
  it('31. a whole-song reference (no lyricPosition) still resolves the song correctly', () => {
    const { song, arrangement } = makeSong()
    const result = resolveSongLyricPositionPin(song, arrangement, { id: 'layout', maxLinesPerPage: 2 }, { sectionId: 'verse1', sectionOccurrence: 1 })
    expect(result.ok).toBe(true)
    expect(result.song?.id).toBe(song.id)
  })

  it('32. a section-level pin (songId + sectionId) resolves to that section\u2019s first page', () => {
    const { song, arrangement } = makeSong()
    const result = resolveSongLyricPositionPin(song, arrangement, { id: 'layout', maxLinesPerPage: 2 }, { sectionId: 'chorus', sectionOccurrence: 1 })
    expect(result.ok).toBe(true)
    expect(result.page?.sectionId).toBe('chorus')
    expect(result.page?.pageIndexWithinSection).toBe(0)
  })

  it('33. a lyric-position pin resolves via semantic position, not a stored page number', () => {
    const { song, arrangement } = makeSong()
    // Line index 3 (v4) is on page 2 (0-indexed: pageIndexWithinSection 1) at capacity 2.
    const result = resolveSongLyricPositionPin(song, arrangement, { id: 'layout', maxLinesPerPage: 2 }, { sectionId: 'verse1', sectionOccurrence: 1, lineIndexInSection: 3 })
    expect(result.ok).toBe(true)
    expect(result.page?.pageIndexWithinSection).toBe(1)
    expect(result.page?.lines).toContain('v4')
  })

  it('34. renaming the Song does not break pin resolution (identity is songId-based, not title-based)', () => {
    const { song, arrangement } = makeSong()
    const renamed = { ...song, title: 'Completely Renamed' }
    const result = resolveSongLyricPositionPin(renamed, arrangement, { id: 'layout', maxLinesPerPage: 2 }, { sectionId: 'verse1', sectionOccurrence: 1, lineIndexInSection: 0 })
    expect(result.ok).toBe(true)
    expect(result.song?.title).toBe('Completely Renamed')
  })

  it('35. changing the layout does NOT make the pin resolve to the wrong lyrics -- the same semantic position resolves to a different page, but the SAME correct line', () => {
    const { song, arrangement } = makeSong()
    const under2LineLayout = resolveSongLyricPositionPin(song, arrangement, { id: 'small', maxLinesPerPage: 2 }, { sectionId: 'verse1', sectionOccurrence: 1, lineIndexInSection: 4 })
    const under4LineLayout = resolveSongLyricPositionPin(song, arrangement, { id: 'large', maxLinesPerPage: 4 }, { sectionId: 'verse1', sectionOccurrence: 1, lineIndexInSection: 4 })
    // Different page structure (proving the layout genuinely differs)...
    expect(under2LineLayout.page?.pageIndexWithinSection).not.toBe(under4LineLayout.page?.pageIndexWithinSection)
    // ...but BOTH still correctly contain the pinned line (v5, index 4).
    expect(under2LineLayout.page?.lines).toContain('v5')
    expect(under4LineLayout.page?.lines).toContain('v5')
  })

  it('a deleted/missing song fails safely with a clear error, not a crash', () => {
    const result = resolveSongLyricPositionPin(null, null, { id: 'layout', maxLinesPerPage: 2 }, { sectionId: 'x', sectionOccurrence: 1 })
    expect(result.ok).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('a section that was deleted since the pin was created fails safely', () => {
    const { song, arrangement } = makeSong()
    const result = resolveSongLyricPositionPin(song, arrangement, { id: 'layout', maxLinesPerPage: 2 }, { sectionId: 'nonexistent-section', sectionOccurrence: 1 })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/no longer exists/)
  })
})
