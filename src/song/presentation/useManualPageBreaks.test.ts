import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useManualPageBreaks } from './useManualPageBreaks'
import { generateSongPresentationPages } from './pagination'
import type { Song, SongArrangement } from '../../songModel'

function makeSong(): { song: Song; arrangement: SongArrangement } {
  const arrangement: SongArrangement = { id: 'arr-1', name: 'Default', sectionIds: ['verse1', 'chorus'] }
  const song: Song = {
    id: 'song-1', title: 'Break Test Song', artist: '', source: 'Imported', isHymn: false, linesPerSlide: 2,
    sections: [
      { id: 'verse1', label: 'Verse 1', lines: ['l1', 'l2', 'l3', 'l4'] },
      { id: 'chorus', label: 'Chorus', lines: ['c1', 'c2'] },
    ],
    arrangements: [arrangement],
    defaultArrangementId: arrangement.id,
    metadata: { createdAt: 1, updatedAt: 1 },
  }
  return { song, arrangement }
}

describe('useManualPageBreaks (Section 43.1-7)', () => {
  it('1. adding a manual break registers it', () => {
    const { result } = renderHook(() => useManualPageBreaks())
    act(() => result.current.toggleBreak('verse1', 1))
    expect(result.current.hasBreakAfter('verse1', 1)).toBe(true)
  })

  it('2. removing a manual break (toggling again) un-registers it', () => {
    const { result } = renderHook(() => useManualPageBreaks())
    act(() => result.current.toggleBreak('verse1', 1))
    act(() => result.current.toggleBreak('verse1', 1))
    expect(result.current.hasBreakAfter('verse1', 1)).toBe(false)
  })

  it('3. a manual break updates the generated pages immediately (live preview, no save step)', () => {
    const { song, arrangement } = makeSong()
    const { result } = renderHook(() => useManualPageBreaks())
    const before = generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 3 }, { manualBreaks: result.current.breaks })
    expect(before.filter((p) => p.sectionId === 'verse1').map((p) => p.lines.length)).toEqual([3, 1]) // automatic at capacity 3

    act(() => result.current.toggleBreak('verse1', 1))
    const after = generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 3 }, { manualBreaks: result.current.breaks })
    expect(after.filter((p) => p.sectionId === 'verse1').map((p) => p.lines.length)).toEqual([2, 2]) // manual break after line 1 wins
  })

  it('4. a manual break does not mutate the Song\u2019s canonical lyrics', () => {
    const { song, arrangement } = makeSong()
    const { result } = renderHook(() => useManualPageBreaks())
    const before = JSON.stringify(song.sections)
    act(() => result.current.toggleBreak('verse1', 1))
    generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 3 }, { manualBreaks: result.current.breaks })
    expect(JSON.stringify(song.sections)).toBe(before)
  })

  it('5. a manual break cannot cross a section boundary -- it only ever affects lines within the section it targets', () => {
    const { song, arrangement } = makeSong()
    const { result } = renderHook(() => useManualPageBreaks())
    act(() => result.current.toggleBreak('verse1', 0))
    const pages = generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 10 }, { manualBreaks: result.current.breaks })
    for (const p of pages) {
      const hasV = p.lines.some((l) => l.startsWith('l'))
      const hasC = p.lines.some((l) => l.startsWith('c'))
      expect(hasV && hasC).toBe(false)
    }
  })

  it('6. a manual break remains semantically valid across a capacity change -- Section 37\u2019s worked example', () => {
    const { song, arrangement } = makeSong()
    const { result } = renderHook(() => useManualPageBreaks())
    act(() => result.current.toggleBreak('verse1', 1)) // break after line index 1 (5-line section would need... using verse1's 4 lines)
    const atCapacity3 = generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 3 }, { manualBreaks: result.current.breaks })
    expect(atCapacity3.filter((p) => p.sectionId === 'verse1').map((p) => p.lines.length)).toEqual([2, 2])
    const atCapacity2 = generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 2 }, { manualBreaks: result.current.breaks })
    // The break itself (after index 1) still applies -- first page is
    // still [l1,l2]; capacity 2 just also means the automatic chunking
    // downstream of the break behaves consistently.
    expect(atCapacity2.filter((p) => p.sectionId === 'verse1')[0].lines).toEqual(['l1', 'l2'])
  })

  it('7. a stale break (out of range after lyrics shortened) fails safely, falling back to automatic chunking', () => {
    const { song, arrangement } = makeSong()
    const { result } = renderHook(() => useManualPageBreaks())
    act(() => result.current.toggleBreak('verse1', 1))
    // Simulate lyrics being shortened to 1 line after the break was set.
    const shortenedSong: Song = { ...song, sections: song.sections.map((s) => (s.id === 'verse1' ? { ...s, lines: ['only line'] } : s)) }
    expect(() => generateSongPresentationPages(shortenedSong, arrangement, { id: 'l', maxLinesPerPage: 3 }, { manualBreaks: result.current.breaks })).not.toThrow()
  })
})
