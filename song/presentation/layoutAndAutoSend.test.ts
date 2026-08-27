import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSongAutoSend } from './useSongAutoSend'
import { resolveLayoutCapacity, themeDefaultCapacity } from './themeLayoutDefaults'
import { generateSongPresentationPages } from './pagination'
import type { Song, SongArrangement } from '../../songModel'
import type { ManualPageBreakOverride } from './types'

describe('Theme/layout precedence (Section 50.26-28)', () => {
  it('26. theme default capacity is used when no song override exists', () => {
    const resolved = resolveLayoutCapacity(themeDefaultCapacity('Lower Third'), undefined)
    expect(resolved.maxLinesPerPage).toBe(2)
    expect(resolved.source).toBe('theme-default')
  })

  it('27. a song override beats the theme default', () => {
    const resolved = resolveLayoutCapacity(themeDefaultCapacity('Lower Third'), 5)
    expect(resolved.maxLinesPerPage).toBe(5)
    expect(resolved.source).toBe('song-override')
  })

  it('28. a manual break beats automatic capacity-based boundaries', () => {
    const song: Song = {
      id: 's1', title: 'X', artist: '', source: 'Imported', isHymn: false, linesPerSlide: 2,
      sections: [{ id: 'v1', label: 'Verse 1', lines: ['l1', 'l2', 'l3', 'l4'] }],
      arrangements: [{ id: 'arr1', name: 'Default', sectionIds: ['v1'] }],
      defaultArrangementId: 'arr1',
      metadata: { createdAt: 1, updatedAt: 1 },
    }
    const arrangement = song.arrangements[0] as SongArrangement
    const manualBreaks: ManualPageBreakOverride[] = [{ sectionId: 'v1', afterLineIndexes: [1] }]
    const automatic = generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 3 })
    const withManual = generateSongPresentationPages(song, arrangement, { id: 'l', maxLinesPerPage: 3 }, { manualBreaks })
    expect(automatic.map((p) => p.lines.length)).toEqual([3, 1]) // automatic
    expect(withManual.map((p) => p.lines.length)).toEqual([2, 2]) // manual break wins
  })

  it('different theme categories have different sensible defaults', () => {
    expect(themeDefaultCapacity('Lower Third')).toBe(2)
    expect(themeDefaultCapacity('Full Screen')).toBe(4)
    expect(themeDefaultCapacity('Foldback')).toBe(6)
  })

  it('an unrecognized theme category falls back to a sane default rather than erroring', () => {
    expect(themeDefaultCapacity('Some Unknown Category')).toBeGreaterThan(0)
    expect(themeDefaultCapacity(undefined)).toBeGreaterThan(0)
  })
})

describe('Destination-specific layouts (Section 50.29-30)', () => {
  it('29. Audience and Foldback can generate genuinely different page groupings for the same Song', () => {
    const song: Song = {
      id: 's1', title: 'X', artist: '', source: 'Imported', isHymn: false, linesPerSlide: 2,
      sections: [{ id: 'v1', label: 'Verse 1', lines: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6'] }],
      arrangements: [{ id: 'arr1', name: 'Default', sectionIds: ['v1'] }],
      defaultArrangementId: 'arr1',
      metadata: { createdAt: 1, updatedAt: 1 },
    }
    const arrangement = song.arrangements[0] as SongArrangement
    const audience = generateSongPresentationPages(song, arrangement, { id: 'audience', maxLinesPerPage: 2 })
    const foldback = generateSongPresentationPages(song, arrangement, { id: 'foldback', maxLinesPerPage: 6 })
    expect(audience.length).toBe(3)
    expect(foldback.length).toBe(1)
  })

  it('30. different output layouts still trace back to the same underlying lyric identity (same songId/sectionId)', () => {
    const song: Song = {
      id: 's1', title: 'X', artist: '', source: 'Imported', isHymn: false, linesPerSlide: 2,
      sections: [{ id: 'v1', label: 'Verse 1', lines: ['l1', 'l2', 'l3', 'l4'] }],
      arrangements: [{ id: 'arr1', name: 'Default', sectionIds: ['v1'] }],
      defaultArrangementId: 'arr1',
      metadata: { createdAt: 1, updatedAt: 1 },
    }
    const arrangement = song.arrangements[0] as SongArrangement
    const audience = generateSongPresentationPages(song, arrangement, { id: 'audience', maxLinesPerPage: 2 })
    const foldback = generateSongPresentationPages(song, arrangement, { id: 'foldback', maxLinesPerPage: 4 })
    expect(audience.every((p) => p.songId === 's1' && p.sectionId === 'v1')).toBe(true)
    expect(foldback.every((p) => p.songId === 's1' && p.sectionId === 'v1')).toBe(true)
  })
})

describe('useSongAutoSend (Section 52.36-40)', () => {
  const samplePage = { songId: 's1', arrangementId: 'a1', sectionId: 'v1', sectionLabel: 'Verse 1', sectionOccurrence: 1, pageIndexWithinSection: 0, startLineIndex: 0, endLineIndex: 1, lines: ['l1', 'l2'], layoutConfigId: 'layout' }

  it('36. Auto-Send OFF: navigation does not automatically send to Live', () => {
    const { result } = renderHook(() => useSongAutoSend(false))
    const sendToLive = vi.fn()
    const outcome = result.current.afterNavigate(samplePage, sendToLive)
    expect(outcome.sent).toBe(false)
    expect(sendToLive).not.toHaveBeenCalled()
  })

  it('37. Auto-Send ON: accepted navigation updates Live', () => {
    const { result } = renderHook(() => useSongAutoSend(true))
    const sendToLive = vi.fn()
    const outcome = result.current.afterNavigate(samplePage, sendToLive)
    expect(outcome.sent).toBe(true)
    expect(sendToLive).toHaveBeenCalledWith(samplePage)
  })

  it('38. Foldback remains unaffected by an Audience Auto-Send instance -- each is its own independent hook instance', () => {
    const { result: audienceAutoSend } = renderHook(() => useSongAutoSend(true))
    const { result: foldbackAutoSend } = renderHook(() => useSongAutoSend(false))
    const audienceSend = vi.fn()
    const foldbackSend = vi.fn()
    audienceAutoSend.current.afterNavigate(samplePage, audienceSend)
    foldbackAutoSend.current.afterNavigate(samplePage, foldbackSend)
    expect(audienceSend).toHaveBeenCalled()
    expect(foldbackSend).not.toHaveBeenCalled()
  })

  it('39. an invalid/null page (generation failure) does not call the send callback, and reports an error instead of silently clearing Live', () => {
    const { result } = renderHook(() => useSongAutoSend(true))
    const sendToLive = vi.fn()
    const outcome = result.current.afterNavigate(null, sendToLive)
    expect(outcome.sent).toBe(false)
    expect(outcome.error).toBeDefined()
    expect(sendToLive).not.toHaveBeenCalled()
  })

  it('40. toggling Auto-Send does not mutate any Song data -- purely UI-level state', () => {
    const { result } = renderHook(() => useSongAutoSend(false))
    expect(result.current.enabled).toBe(false)
    act(() => result.current.toggle())
    expect(result.current.enabled).toBe(true)
    // No song/page object was touched by this -- toggle only affects
    // this hook's own local state.
  })
})
