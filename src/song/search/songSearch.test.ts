import { describe, it, expect } from 'vitest'
import { searchSongs, normalizeText } from './songSearch'
import type { Song } from '../../songModel'

// ALT-STAGE5-PART46: fabricated placeholder fixtures, never real lyrics.
const SONGS: Song[] = [
  {
    id: 's1',
    title: 'Testament Hymn',
    artist: 'Alpha Composer',
    source: 'Imported',
    isHymn: true,
    linesPerSlide: 2,
    sections: [{ id: 'sec1', label: 'Verse 1', lines: ['grace and mercy fill this place', 'love beyond all measure'] }],
    arrangements: [{ id: 'arr1', name: 'Default', sectionIds: ['sec1'] }],
    defaultArrangementId: 'arr1',
    metadata: { createdAt: 1, updatedAt: 1 },
  },
  {
    id: 's2',
    title: 'Another Song',
    artist: "O'Brien & Beta",
    source: 'Imported',
    isHymn: false,
    linesPerSlide: 2,
    sections: [{ id: 'sec2', label: 'Verse 1', lines: ['completely different lyric content here'] }],
    arrangements: [{ id: 'arr2', name: 'Default', sectionIds: ['sec2'] }],
    defaultArrangementId: 'arr2',
    metadata: { createdAt: 2, updatedAt: 2 },
  },
]

describe('searchSongs (Section 56.22-27)', () => {
  it('searches by title', () => {
    const results = searchSongs(SONGS, 'Testament')
    expect(results.map((r) => r.song.id)).toEqual(['s1'])
    expect(results[0].matchedIn).toContain('title')
  })

  it('searches by artist', () => {
    const results = searchSongs(SONGS, 'Alpha Composer')
    expect(results.map((r) => r.song.id)).toEqual(['s1'])
    expect(results[0].matchedIn).toContain('artist')
  })

  it('searches by lyric phrase', () => {
    const results = searchSongs(SONGS, 'grace and mercy')
    expect(results.map((r) => r.song.id)).toEqual(['s1'])
    expect(results[0].matchedIn).toContain('lyrics')
  })

  it('is case-insensitive', () => {
    const lower = searchSongs(SONGS, 'testament')
    const upper = searchSongs(SONGS, 'TESTAMENT')
    expect(lower.map((r) => r.song.id)).toEqual(upper.map((r) => r.song.id))
  })

  it('handles punctuation and apostrophe variants appropriately', () => {
    const straight = searchSongs(SONGS, "O'Brien")
    const curly = searchSongs(SONGS, 'O\u2019Brien')
    expect(straight.map((r) => r.song.id)).toEqual(['s2'])
    expect(curly.map((r) => r.song.id)).toEqual(['s2'])
  })

  it('search results carry the stable Song ID, not just a display string', () => {
    const results = searchSongs(SONGS, 'Testament')
    expect(results[0].song.id).toBe('s1')
  })

  it('returns no results for a query matching nothing', () => {
    expect(searchSongs(SONGS, 'zzz-nonexistent-zzz')).toEqual([])
  })

  it('returns an empty array for an empty query', () => {
    expect(searchSongs(SONGS, '')).toEqual([])
    expect(searchSongs(SONGS, '   ')).toEqual([])
  })
})

describe('normalizeText', () => {
  it('lowercases, strips punctuation, collapses whitespace, and unifies apostrophes', () => {
    expect(normalizeText('  Hello,   World!  ')).toBe('hello world')
    expect(normalizeText("It's")).toBe(normalizeText('It\u2019s'))
  })

  it('never mutates the original -- purely a derived value (Section 27/28)', () => {
    const original = 'Original Text!'
    normalizeText(original)
    expect(original).toBe('Original Text!')
  })
})
