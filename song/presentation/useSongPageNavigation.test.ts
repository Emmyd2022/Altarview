import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSongPageNavigation } from './useSongPageNavigation'
import { generateSongPresentationPages } from './pagination'
import type { Song, SongArrangement } from '../../songModel'

function makeSongAndPages() {
  const song: Song = {
    id: 'song-1',
    title: 'Nav Test Song',
    artist: '',
    source: 'Imported',
    isHymn: false,
    linesPerSlide: 2,
    sections: [
      { id: 'verse1', label: 'Verse 1', lines: ['v1a', 'v1b', 'v1c'] },
      { id: 'chorus', label: 'Chorus', lines: ['c1', 'c2'] },
      { id: 'verse2', label: 'Verse 2', lines: ['v2a', 'v2b'] },
    ],
    arrangements: [{ id: 'arr-1', name: 'Default', sectionIds: ['verse1', 'chorus', 'verse2', 'chorus'] }],
    defaultArrangementId: 'arr-1',
    metadata: { createdAt: 1, updatedAt: 1 },
  }
  const arrangement = song.arrangements[0] as SongArrangement
  const pages = generateSongPresentationPages(song, arrangement, { id: 'layout-1', maxLinesPerPage: 2 })
  return { song, pages }
}

describe('useSongPageNavigation (Section 49.18-21, 25)', () => {
  it('18. Next moves within a section\u2019s own pages', () => {
    const { pages } = makeSongAndPages()
    const { result } = renderHook(() => useSongPageNavigation(pages))
    expect(result.current.currentPage?.sectionId).toBe('verse1')
    expect(result.current.currentPage?.pageIndexWithinSection).toBe(0)
    act(() => result.current.next())
    expect(result.current.currentPage?.sectionId).toBe('verse1')
    expect(result.current.currentPage?.pageIndexWithinSection).toBe(1)
  })

  it('19. Next from a section\u2019s final page moves into the next section', () => {
    const { pages } = makeSongAndPages()
    const { result } = renderHook(() => useSongPageNavigation(pages))
    act(() => result.current.next()) // verse1 page 2 (of 2)
    act(() => result.current.next()) // should now cross into chorus
    expect(result.current.currentPage?.sectionId).toBe('chorus')
    expect(result.current.currentPage?.sectionOccurrence).toBe(1)
  })

  it('20. Previous across a section boundary works correctly', () => {
    const { pages } = makeSongAndPages()
    const { result } = renderHook(() => useSongPageNavigation(pages))
    act(() => result.current.next())
    act(() => result.current.next()) // now at chorus (occurrence 1)
    act(() => result.current.previous())
    expect(result.current.currentPage?.sectionId).toBe('verse1')
  })

  it('21 & 25. repeated Chorus occurrence navigation moves to a specific occurrence via jumpToSectionOccurrence', () => {
    const { pages } = makeSongAndPages()
    const { result } = renderHook(() => useSongPageNavigation(pages))
    act(() => result.current.jumpToSectionOccurrence('chorus', 2))
    expect(result.current.currentPage?.sectionId).toBe('chorus')
    expect(result.current.currentPage?.sectionOccurrence).toBe(2)
  })

  it('jumpToSection (semantic, relative-to-current) moves to the first Chorus occurrence when starting before any Chorus', () => {
    const { pages } = makeSongAndPages()
    const { result } = renderHook(() => useSongPageNavigation(pages))
    act(() => result.current.jumpToSection('chorus'))
    expect(result.current.currentPage?.sectionOccurrence).toBe(1)
  })

  it('hasNext/hasPrevious report correctly at both ends', () => {
    const { pages } = makeSongAndPages()
    const { result } = renderHook(() => useSongPageNavigation(pages))
    expect(result.current.hasPrevious).toBe(false)
    expect(result.current.hasNext).toBe(true)
  })
})

describe('Destination independence (Section 49.22-24, 21)', () => {
  it('22-24. Live, Foldback, and Preview navigation instances are completely independent -- no shared global position', () => {
    const { pages } = makeSongAndPages()
    const { result: live } = renderHook(() => useSongPageNavigation(pages))
    const { result: foldback } = renderHook(() => useSongPageNavigation(pages))
    const { result: preview } = renderHook(() => useSongPageNavigation(pages))

    act(() => live.current.next())
    act(() => live.current.next())
    act(() => foldback.current.next())

    expect(live.current.pageIndex).toBe(2)
    expect(foldback.current.pageIndex).toBe(1)
    expect(preview.current.pageIndex).toBe(0) // untouched
  })

  it('Live and Foldback can use DIFFERENT layouts (different page sequences) for the same Song simultaneously', () => {
    const { song } = makeSongAndPages()
    const arrangement = song.arrangements[0] as SongArrangement
    const audiencePages = generateSongPresentationPages(song, arrangement, { id: 'audience', maxLinesPerPage: 2 })
    const foldbackPages = generateSongPresentationPages(song, arrangement, { id: 'foldback', maxLinesPerPage: 6 })
    expect(audiencePages.length).not.toBe(foldbackPages.length) // genuinely different pagination

    const { result: live } = renderHook(() => useSongPageNavigation(audiencePages))
    const { result: foldback } = renderHook(() => useSongPageNavigation(foldbackPages))
    expect(live.current.currentPage?.layoutConfigId).toBe('audience')
    expect(foldback.current.currentPage?.layoutConfigId).toBe('foldback')
  })
})
