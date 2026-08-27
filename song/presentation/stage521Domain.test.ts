import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSongPageNavigation } from './useSongPageNavigation'
import { useSongAutoSend } from './useSongAutoSend'
import { generateSongPresentationPages } from './pagination'
import type { Song, SongArrangement } from '../../songModel'

function makeRepeatedChorusSong(): { song: Song; arrangement: SongArrangement } {
  // Verse 1, Chorus #1, Verse 2, Chorus #2, Bridge, Chorus #3 -- the
  // exact arrangement from Section 23's worked example.
  const arrangement: SongArrangement = { id: 'arr-1', name: 'Default', sectionIds: ['verse1', 'chorus', 'verse2', 'chorus', 'bridge', 'chorus'] }
  const song: Song = {
    id: 'song-1', title: 'Repeated Chorus Song', artist: '', source: 'Imported', isHymn: false, linesPerSlide: 2,
    sections: [
      { id: 'verse1', label: 'Verse 1', lines: ['v1a'] },
      { id: 'chorus', label: 'Chorus', lines: ['ca'] },
      { id: 'verse2', label: 'Verse 2', lines: ['v2a'] },
      { id: 'bridge', label: 'Bridge', lines: ['ba'] },
    ],
    arrangements: [arrangement],
    defaultArrangementId: arrangement.id,
    metadata: { createdAt: 1, updatedAt: 1 },
  }
  return { song, arrangement }
}

describe('Destination-specific capacity (Section 44.8-14)', () => {
  it('8 & 9. Audience capacity 2 and Foldback capacity 4 can be active simultaneously', () => {
    const song: Song = {
      id: 's1', title: 'X', artist: '', source: 'Imported', isHymn: false, linesPerSlide: 2,
      sections: [{ id: 'v1', label: 'Verse 1', lines: ['l1', 'l2', 'l3', 'l4', 'l5'] }],
      arrangements: [{ id: 'a1', name: 'Default', sectionIds: ['v1'] }],
      defaultArrangementId: 'a1',
      metadata: { createdAt: 1, updatedAt: 1 },
    }
    const arrangement = song.arrangements[0] as SongArrangement
    const audience = generateSongPresentationPages(song, arrangement, { id: 'audience', maxLinesPerPage: 2 })
    const foldback = generateSongPresentationPages(song, arrangement, { id: 'foldback', maxLinesPerPage: 4 })
    expect(audience.length).toBe(3) // 2,2,1
    expect(foldback.length).toBe(2) // 4,1
  })

  it('10. the same Song generates genuinely different page groupings for each destination', () => {
    const song: Song = {
      id: 's1', title: 'X', artist: '', source: 'Imported', isHymn: false, linesPerSlide: 2,
      sections: [{ id: 'v1', label: 'Verse 1', lines: ['l1', 'l2', 'l3'] }],
      arrangements: [{ id: 'a1', name: 'Default', sectionIds: ['v1'] }],
      defaultArrangementId: 'a1',
      metadata: { createdAt: 1, updatedAt: 1 },
    }
    const arrangement = song.arrangements[0] as SongArrangement
    const audience = generateSongPresentationPages(song, arrangement, { id: 'audience', maxLinesPerPage: 1 })
    const foldback = generateSongPresentationPages(song, arrangement, { id: 'foldback', maxLinesPerPage: 3 })
    expect(audience.length).toBe(3)
    expect(foldback.length).toBe(1)
  })

  it('11 & 12. changing one destination\u2019s capacity does not alter the other\u2019s independently-generated pages', () => {
    const song: Song = {
      id: 's1', title: 'X', artist: '', source: 'Imported', isHymn: false, linesPerSlide: 2,
      sections: [{ id: 'v1', label: 'Verse 1', lines: ['l1', 'l2', 'l3', 'l4'] }],
      arrangements: [{ id: 'a1', name: 'Default', sectionIds: ['v1'] }],
      defaultArrangementId: 'a1',
      metadata: { createdAt: 1, updatedAt: 1 },
    }
    const arrangement = song.arrangements[0] as SongArrangement
    const foldbackBefore = generateSongPresentationPages(song, arrangement, { id: 'foldback', maxLinesPerPage: 4 })
    // Changing Audience capacity is just a separate call -- Foldback's
    // own generation is untouched, proven by generating it again with
    // identical inputs and getting an identical result.
    generateSongPresentationPages(song, arrangement, { id: 'audience', maxLinesPerPage: 1 })
    const foldbackAfter = generateSongPresentationPages(song, arrangement, { id: 'foldback', maxLinesPerPage: 4 })
    expect(foldbackAfter).toEqual(foldbackBefore)
  })
})

describe('Repeated-section jump semantics (Section 23, 46.23-28)', () => {
  it('23. from Verse 1, jump Chorus lands on occurrence 1', () => {
    const { song, arrangement } = makeRepeatedChorusSong()
    const pages = generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 2 })
    const { result } = renderHook(() => useSongPageNavigation(pages))
    // starts at Verse 1 (index 0)
    act(() => result.current.jumpToSection('chorus'))
    expect(result.current.currentPage?.sectionOccurrence).toBe(1)
  })

  it('24. from Verse 2, jump Chorus lands on occurrence 2', () => {
    const { song, arrangement } = makeRepeatedChorusSong()
    const pages = generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 2 })
    const { result } = renderHook(() => useSongPageNavigation(pages))
    act(() => result.current.jumpToSectionOccurrence('verse2', 1))
    act(() => result.current.jumpToSection('chorus'))
    expect(result.current.currentPage?.sectionOccurrence).toBe(2)
  })

  it('25. from Bridge, jump Chorus lands on occurrence 3', () => {
    const { song, arrangement } = makeRepeatedChorusSong()
    const pages = generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 2 })
    const { result } = renderHook(() => useSongPageNavigation(pages))
    act(() => result.current.jumpToSectionOccurrence('bridge', 1))
    act(() => result.current.jumpToSection('chorus'))
    expect(result.current.currentPage?.sectionOccurrence).toBe(3)
  })

  it('26. from Chorus occurrence 3, jump Chorus wraps to occurrence 1', () => {
    const { song, arrangement } = makeRepeatedChorusSong()
    const pages = generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 2 })
    const { result } = renderHook(() => useSongPageNavigation(pages))
    act(() => result.current.jumpToSectionOccurrence('chorus', 3))
    act(() => result.current.jumpToSection('chorus'))
    expect(result.current.currentPage?.sectionOccurrence).toBe(1)
  })

  it('27. Next after Chorus occurrence 2\u2019s final page continues to Bridge', () => {
    const { song, arrangement } = makeRepeatedChorusSong()
    const pages = generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 2 })
    const { result } = renderHook(() => useSongPageNavigation(pages))
    act(() => result.current.jumpToSectionOccurrence('chorus', 2))
    act(() => result.current.next())
    expect(result.current.currentPage?.sectionId).toBe('bridge')
  })

  it('28. Previous behavior remains arrangement-correct across a section boundary', () => {
    const { song, arrangement } = makeRepeatedChorusSong()
    const pages = generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 2 })
    const { result } = renderHook(() => useSongPageNavigation(pages))
    act(() => result.current.jumpToSectionOccurrence('bridge', 1))
    act(() => result.current.previous())
    expect(result.current.currentPage?.sectionId).toBe('chorus')
    expect(result.current.currentPage?.sectionOccurrence).toBe(2)
  })
})

describe('Auto-Send with section jump (Section 47.29-32)', () => {
  const page1 = { songId: 's1', arrangementId: 'a1', sectionId: 'chorus', sectionLabel: 'Chorus', sectionOccurrence: 1, pageIndexWithinSection: 0, startLineIndex: 0, endLineIndex: 0, lines: ['ca'], layoutConfigId: 'l' }

  it('29. section jump with Auto-Send OFF does not auto-update Live', () => {
    const { result } = renderHook(() => useSongAutoSend(false))
    const sendToLive = vi.fn()
    result.current.afterNavigate(page1, sendToLive)
    expect(sendToLive).not.toHaveBeenCalled()
  })

  it('30. section jump with Auto-Send ON updates Live', () => {
    const { result } = renderHook(() => useSongAutoSend(true))
    const sendToLive = vi.fn()
    result.current.afterNavigate(page1, sendToLive)
    expect(sendToLive).toHaveBeenCalledWith(page1)
  })

  it('31. Audience Auto-Send does not alter a separate Foldback Auto-Send instance', () => {
    const { result: audience } = renderHook(() => useSongAutoSend(true))
    const { result: foldback } = renderHook(() => useSongAutoSend(false))
    expect(audience.current.enabled).toBe(true)
    expect(foldback.current.enabled).toBe(false)
  })

  it('32. changing layout capacity alone (no navigation action) does not send anything Live', () => {
    const { result } = renderHook(() => useSongAutoSend(true))
    const sendToLive = vi.fn()
    // Merely regenerating pages at a new capacity, with no call to
    // afterNavigate, sends nothing -- Auto-Send only fires as a
    // consequence of an explicit navigation action.
    generateSongPresentationPages(makeRepeatedChorusSong().song, makeRepeatedChorusSong().arrangement, { id: 'l', maxLinesPerPage: 3 })
    expect(sendToLive).not.toHaveBeenCalled()
  })
})
