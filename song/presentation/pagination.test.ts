import { describe, it, expect } from 'vitest'
import { generateSongPresentationPages, validateCapacity } from './pagination'
import type { Song, SongArrangement } from '../../songModel'
import type { SongPresentationLayoutConfig, ManualPageBreakOverride } from './types'

// ALT-STAGE5-2: all fixture lyrics are fabricated placeholder text
// ("line 1", "chorus 1", etc.), never real song lyrics.

function makeSong(sectionLines: Record<string, string[]>, arrangementSectionIds: string[]): { song: Song; arrangement: SongArrangement } {
  const sections = Object.entries(sectionLines).map(([id, lines]) => ({ id, label: id, lines }))
  const arrangement: SongArrangement = { id: 'arr-1', name: 'Default', sectionIds: arrangementSectionIds }
  const song: Song = {
    id: 'song-1',
    title: 'Test Song',
    artist: '',
    source: 'Imported',
    isHymn: false,
    linesPerSlide: 2,
    sections,
    arrangements: [arrangement],
    defaultArrangementId: arrangement.id,
    metadata: { createdAt: 1, updatedAt: 1 },
  }
  return { song, arrangement }
}

function layout(maxLinesPerPage: number, id = 'layout-1'): SongPresentationLayoutConfig {
  return { id, maxLinesPerPage }
}

describe('Core pagination (Section 48.1-7)', () => {
  it('1. 5 lines / capacity 2 -> pages of 2, 2, 1', () => {
    const { song, arrangement } = makeSong({ verse: ['l1', 'l2', 'l3', 'l4', 'l5'] }, ['verse'])
    const pages = generateSongPresentationPages(song, arrangement, layout(2))
    expect(pages.map((p) => p.lines.length)).toEqual([2, 2, 1])
    expect(pages[2].lines).toEqual(['l5'])
  })

  it('2 & 3. next section always begins a new page; no page ever contains lines from two sections', () => {
    const { song, arrangement } = makeSong({ verse: ['v1', 'v2', 'v3'], chorus: ['c1', 'c2'] }, ['verse', 'chorus'])
    const pages = generateSongPresentationPages(song, arrangement, layout(2))
    // verse: [v1,v2], [v3] -- chorus: [c1,c2] -- 3 pages total, chorus starts fresh
    expect(pages.length).toBe(3)
    expect(pages.every((p) => new Set(p.lines.map((l) => l[0])).size === 1 || p.lines.every((l) => l.startsWith(p.lines[0][0])))).toBe(true)
    // Explicit, unambiguous check: every page's lines all come from the same section prefix.
    for (const p of pages) {
      const prefixes = new Set(p.lines.map((l) => l.replace(/[0-9]/g, '')))
      expect(prefixes.size).toBe(1)
    }
  })

  it('4. 7 lines / capacity 3 -> pages of 3, 3, 1', () => {
    const { song, arrangement } = makeSong({ verse: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7'] }, ['verse'])
    const pages = generateSongPresentationPages(song, arrangement, layout(3))
    expect(pages.map((p) => p.lines.length)).toEqual([3, 3, 1])
  })

  it('5. exact fit (6 lines / capacity 3) produces exactly 2 full pages, no trailing empty page', () => {
    const { song, arrangement } = makeSong({ verse: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6'] }, ['verse'])
    const pages = generateSongPresentationPages(song, arrangement, layout(3))
    expect(pages.map((p) => p.lines.length)).toEqual([3, 3])
  })

  it('6. a one-line section produces exactly one page', () => {
    const { song, arrangement } = makeSong({ tag: ['only line'] }, ['tag'])
    const pages = generateSongPresentationPages(song, arrangement, layout(2))
    expect(pages.length).toBe(1)
    expect(pages[0].lines).toEqual(['only line'])
  })

  it('7. an empty section (zero lines) is omitted from generation, no blank page created', () => {
    const { song, arrangement } = makeSong({ instrumental: [], verse: ['v1'] }, ['instrumental', 'verse'])
    const pages = generateSongPresentationPages(song, arrangement, layout(2))
    expect(pages.length).toBe(1)
    expect(pages[0].sectionId).toBe('verse')
  })
})

describe('Arrangement & occurrence tracking (Section 48.8-10)', () => {
  it('8. a repeated section (Chorus 3x in arrangement) uses the SAME Section ID each time', () => {
    const { song, arrangement } = makeSong({ verse: ['v1'], chorus: ['c1'] }, ['verse', 'chorus', 'verse', 'chorus'])
    const pages = generateSongPresentationPages(song, arrangement, layout(2))
    const chorusPages = pages.filter((p) => p.sectionId === 'chorus')
    expect(chorusPages.length).toBe(2)
    expect(chorusPages.every((p) => p.sectionId === 'chorus')).toBe(true)
  })

  it('9. repeated occurrences are tracked as different sectionOccurrence values', () => {
    const { song, arrangement } = makeSong({ chorus: ['c1'] }, ['chorus', 'chorus', 'chorus'])
    const pages = generateSongPresentationPages(song, arrangement, layout(2))
    expect(pages.map((p) => p.sectionOccurrence)).toEqual([1, 2, 3])
  })

  it('10. arrangement order controls the page sequence, independent of section storage order', () => {
    const { song, arrangement } = makeSong({ verse: ['v1'], chorus: ['c1'], bridge: ['b1'] }, ['chorus', 'bridge', 'verse'])
    const pages = generateSongPresentationPages(song, arrangement, layout(2))
    expect(pages.map((p) => p.sectionId)).toEqual(['chorus', 'bridge', 'verse'])
  })
})

describe('Immutability & regeneration (Section 48.11-13)', () => {
  it('11. canonical lyrics remain unchanged after pagination', () => {
    const { song, arrangement } = makeSong({ verse: ['v1', 'v2', 'v3'] }, ['verse'])
    const before = JSON.stringify(song.sections)
    generateSongPresentationPages(song, arrangement, layout(2))
    expect(JSON.stringify(song.sections)).toBe(before)
  })

  it('12. changing capacity regenerates a different page structure', () => {
    const { song, arrangement } = makeSong({ verse: ['v1', 'v2', 'v3', 'v4'] }, ['verse'])
    const at2 = generateSongPresentationPages(song, arrangement, layout(2))
    const at4 = generateSongPresentationPages(song, arrangement, layout(4))
    expect(at2.length).toBe(2)
    expect(at4.length).toBe(1)
  })

  it('13. capacity change does not mutate the Song object', () => {
    const { song, arrangement } = makeSong({ verse: ['v1', 'v2', 'v3', 'v4'] }, ['verse'])
    const before = JSON.stringify(song)
    generateSongPresentationPages(song, arrangement, layout(2))
    generateSongPresentationPages(song, arrangement, layout(4))
    expect(JSON.stringify(song)).toBe(before)
  })
})

describe('Manual page breaks (Section 48.14-17)', () => {
  it('14. a manual break splits a section at a chosen point, differently from automatic capacity chunking', () => {
    const { song, arrangement } = makeSong({ verse: ['l1', 'l2', 'l3', 'l4'] }, ['verse'])
    const manualBreaks: ManualPageBreakOverride[] = [{ sectionId: 'verse', afterLineIndexes: [1] }]
    const pages = generateSongPresentationPages(song, arrangement, layout(3), { manualBreaks })
    // Automatic at capacity 3 would be [3,1]; manual break after index 1 gives [2,2].
    expect(pages.map((p) => p.lines.length)).toEqual([2, 2])
    expect(pages[0].lines).toEqual(['l1', 'l2'])
    expect(pages[1].lines).toEqual(['l3', 'l4'])
  })

  it('15. manual breaks can NEVER merge two different sections onto one page (absolute invariant)', () => {
    const { song, arrangement } = makeSong({ verse: ['v1', 'v2'], chorus: ['c1', 'c2'] }, ['verse', 'chorus'])
    // Even with an (invalid/out-of-range) attempt, manual breaks are
    // scoped per-section and structurally cannot cross into another
    // section's lines array.
    const manualBreaks: ManualPageBreakOverride[] = [{ sectionId: 'verse', afterLineIndexes: [0] }]
    const pages = generateSongPresentationPages(song, arrangement, layout(10), { manualBreaks })
    for (const p of pages) {
      expect(p.sectionId === 'verse' || p.sectionId === 'chorus').toBe(true)
      // No page mixes v-lines and c-lines.
      const hasV = p.lines.some((l) => l.startsWith('v'))
      const hasC = p.lines.some((l) => l.startsWith('c'))
      expect(hasV && hasC).toBe(false)
    }
  })

  it('16. multiple manual breaks within one section work correctly', () => {
    const { song, arrangement } = makeSong({ verse: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6'] }, ['verse'])
    const manualBreaks: ManualPageBreakOverride[] = [{ sectionId: 'verse', afterLineIndexes: [0, 2, 4] }]
    const pages = generateSongPresentationPages(song, arrangement, layout(10), { manualBreaks })
    expect(pages.map((p) => p.lines)).toEqual([['l1'], ['l2', 'l3'], ['l4', 'l5'], ['l6']])
  })

  it('17. an invalid/stale manual break (out of range) is handled safely, falling back to automatic chunking', () => {
    const { song, arrangement } = makeSong({ verse: ['l1', 'l2'] }, ['verse'])
    const manualBreaks: ManualPageBreakOverride[] = [{ sectionId: 'verse', afterLineIndexes: [99] }] // out of range
    expect(() => generateSongPresentationPages(song, arrangement, layout(2), { manualBreaks })).not.toThrow()
    const pages = generateSongPresentationPages(song, arrangement, layout(2), { manualBreaks })
    expect(pages.length).toBe(1)
    expect(pages[0].lines).toEqual(['l1', 'l2'])
  })
})

describe('Capacity validation (Section 45)', () => {
  it('clamps zero, negative, NaN, and Infinity to a safe minimum', () => {
    expect(validateCapacity(0)).toBe(1)
    expect(validateCapacity(-5)).toBe(1)
    expect(validateCapacity(NaN)).toBe(1)
    expect(validateCapacity(Infinity)).toBe(1)
  })

  it('clamps an unreasonably large value to the upper bound', () => {
    expect(validateCapacity(10000)).toBeLessThanOrEqual(50)
  })

  it('a normal reasonable value passes through unchanged', () => {
    expect(validateCapacity(2)).toBe(2)
    expect(validateCapacity(4)).toBe(4)
  })
})

describe('Error handling (Section 44)', () => {
  it('a broken/deleted Section ID referenced in an arrangement is skipped, not a crash', () => {
    const { song } = makeSong({ verse: ['v1'] }, ['verse'])
    const brokenArrangement: SongArrangement = { id: 'arr-broken', name: 'Broken', sectionIds: ['verse', 'nonexistent-section-id'] }
    expect(() => generateSongPresentationPages(song, brokenArrangement, layout(2))).not.toThrow()
    const pages = generateSongPresentationPages(song, brokenArrangement, layout(2))
    expect(pages.length).toBe(1)
    expect(pages[0].sectionId).toBe('verse')
  })

  it('an empty Song (no sections in the arrangement) returns an empty page list, not a crash', () => {
    const { song } = makeSong({}, [])
    const emptyArrangement: SongArrangement = { id: 'arr-empty', name: 'Empty', sectionIds: [] }
    expect(() => generateSongPresentationPages(song, emptyArrangement, layout(2))).not.toThrow()
    expect(generateSongPresentationPages(song, emptyArrangement, layout(2))).toEqual([])
  })
})
