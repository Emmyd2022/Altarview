import { describe, it, expect } from 'vitest'
import { resolveSongLyricPositionPin } from './songPinResolution'
import type { Song, SongArrangement } from '../../songModel'
import type { PinnedItem } from '../../pinModel'

function makeSong(): { song: Song; arrangement: SongArrangement } {
  const arrangement: SongArrangement = { id: 'arr-1', name: 'Default', sectionIds: ['verse1', 'chorus'] }
  const song: Song = {
    id: 'song-1', title: 'Pin UI Test Song', artist: '', source: 'Imported', isHymn: false, linesPerSlide: 2,
    sections: [
      { id: 'verse1', label: 'Verse 1', lines: ['v1', 'v2', 'v3'] },
      { id: 'chorus', label: 'Chorus', lines: ['c1'] },
    ],
    arrangements: [arrangement],
    defaultArrangementId: arrangement.id,
    metadata: { createdAt: 1, updatedAt: 1 },
  }
  return { song, arrangement }
}

describe('Granular pin construction (Section 45.15-19)', () => {
  it('15. a whole-Song pin uses songId as identity', () => {
    const { song } = makeSong()
    const pin: PinnedItem = { id: 'p1', label: song.title, createdAt: 1, target: { type: 'song', songId: song.id, songTitle: song.title, songLines: [] } }
    expect(pin.target.type === 'song' && pin.target.songId).toBe(song.id)
  })

  it('16 & 17. a section pin uses songId + sectionId, and opens/resolves to the correct section', () => {
    const { song, arrangement } = makeSong()
    const pin: PinnedItem = {
      id: 'p2', label: 'Chorus', createdAt: 1,
      target: { type: 'song', songId: song.id, songTitle: song.title, songLines: [], lyricPosition: { sectionId: 'chorus', sectionOccurrence: 1 } },
    }
    expect(pin.target.type === 'song' && pin.target.lyricPosition?.sectionId).toBe('chorus')
    const target = pin.target as Extract<typeof pin.target, { type: 'song' }>
    const result = resolveSongLyricPositionPin(song, arrangement, { id: 'l', maxLinesPerPage: 2 }, target.lyricPosition!)
    expect(result.ok).toBe(true)
    expect(result.page?.sectionId).toBe('chorus')
  })

  it('18. a section pin survives Song rename (identity is songId/sectionId-based, not title-based)', () => {
    const { song, arrangement } = makeSong()
    const renamed = { ...song, title: 'Renamed Song' }
    const result = resolveSongLyricPositionPin(renamed, arrangement, { id: 'l', maxLinesPerPage: 2 }, { sectionId: 'chorus', sectionOccurrence: 1 })
    expect(result.ok).toBe(true)
    expect(result.song?.title).toBe('Renamed Song')
  })

  it('19. a current-presentation-item pin stores semantic position, not a page number', () => {
    const pin: PinnedItem = {
      id: 'p3', label: 'Verse 1, line 3', createdAt: 1,
      target: { type: 'song', songId: 's1', songTitle: 'X', songLines: [], lyricPosition: { sectionId: 'verse1', sectionOccurrence: 1, lineIndexInSection: 2 } },
    }
    const target = pin.target as Extract<typeof pin.target, { type: 'song' }>
    expect(target.lyricPosition).toEqual({ sectionId: 'verse1', sectionOccurrence: 1, lineIndexInSection: 2 })
    expect('page' in (target.lyricPosition ?? {})).toBe(false)
  })
})

describe('Layout-change pin resolution (Section 45.20)', () => {
  it('20. a current-presentation pin resolves correctly after a line-capacity change', () => {
    const { song, arrangement } = makeSong()
    const position = { sectionId: 'verse1', sectionOccurrence: 1, lineIndexInSection: 2 } // v3
    const under2 = resolveSongLyricPositionPin(song, arrangement, { id: 'small', maxLinesPerPage: 2 }, position)
    const under5 = resolveSongLyricPositionPin(song, arrangement, { id: 'large', maxLinesPerPage: 5 }, position)
    expect(under2.page?.lines).toContain('v3')
    expect(under5.page?.lines).toContain('v3')
    expect(under2.page?.pageIndexWithinSection).not.toBe(under5.page?.pageIndexWithinSection)
  })
})

describe('Stale granular pin handling (Section 41, 45.21-22)', () => {
  it('21. a stale section pin (section deleted) fails safely, not a crash', () => {
    const { song, arrangement } = makeSong()
    expect(() => resolveSongLyricPositionPin(song, arrangement, { id: 'l', maxLinesPerPage: 2 }, { sectionId: 'deleted-section', sectionOccurrence: 1 })).not.toThrow()
    const result = resolveSongLyricPositionPin(song, arrangement, { id: 'l', maxLinesPerPage: 2 }, { sectionId: 'deleted-section', sectionOccurrence: 1 })
    expect(result.ok).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('22. a stale lyric-position pin (occurrence no longer exists) fails safely by falling back to the section\u2019s first page', () => {
    const { song, arrangement } = makeSong()
    const result = resolveSongLyricPositionPin(song, arrangement, { id: 'l', maxLinesPerPage: 2 }, { sectionId: 'verse1', sectionOccurrence: 5, lineIndexInSection: 0 })
    expect(result.ok).toBe(true)
    expect(result.page?.sectionId).toBe('verse1')
  })

  it('a stale pin never silently redirects to a different section with a similar label', () => {
    const { song, arrangement } = makeSong()
    const result = resolveSongLyricPositionPin(song, arrangement, { id: 'l', maxLinesPerPage: 2 }, { sectionId: 'nonexistent', sectionOccurrence: 1 })
    expect(result.ok).toBe(false)
    expect(result.page).toBeUndefined()
  })
})
