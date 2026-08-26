import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePresentationEngine, navigateContent } from './PresentationEngine'
import type { DisplayContent, VerseDisplayContent, SongDisplayContent } from '../screens/OutputStage'
import type { Song } from '../songModel'

// Minimal fixtures -- short, generic placeholder text, not real scripture
// or song content, since this is purely testing the navigation/state
// mechanism, not verifying any actual verse/lyric text.
const VERSE_16: VerseDisplayContent = {
  type: 'verse',
  ref: 'John 3:16',
  translation: 'KJV',
  text: 'placeholder verse text',
  book: 'John',
  chapter: 3,
  verse: 16,
}

const VERSE_20: VerseDisplayContent = {
  type: 'verse',
  ref: 'John 3:20',
  translation: 'KJV',
  text: 'placeholder verse text',
  book: 'John',
  chapter: 3,
  verse: 20,
}

const TEST_SONG: Song = {
  id: 'song-a',
  title: 'Song A',
  artist: 'Test Artist',
  source: 'Imported',
  isHymn: false,
  linesPerSlide: 1,
  sections: [
    { label: 'Verse 1', lines: ['line one', 'line two', 'line three'] },
    { label: 'Verse 2', lines: ['line four', 'line five', 'line six'] },
  ],
}

function songSlide(slideIndex: number, lines: string[]): SongDisplayContent {
  return { type: 'song', title: 'Song A', artist: 'Test Artist', lines, songId: 'song-a', slideIndex }
}

describe('usePresentationEngine', () => {
  // 1. Initial state
  it('starts with preview, live, and foldback all null', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    expect(result.current.preview).toBeNull()
    expect(result.current.live).toBeNull()
    expect(result.current.foldback).toBeNull()
    expect(result.current.commandLog).toEqual([])
  })

  // 2. Stage to Preview
  it('stageToPreview sets preview only', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    act(() => result.current.stageToPreview(VERSE_16))
    expect(result.current.preview).toEqual(VERSE_16)
    expect(result.current.live).toBeNull()
    expect(result.current.foldback).toBeNull()
  })

  // 3. Send to Live
  it('sendToLive sets live only', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    act(() => result.current.sendToLive(VERSE_16))
    expect(result.current.live).toEqual(VERSE_16)
    expect(result.current.preview).toBeNull()
    expect(result.current.foldback).toBeNull()
  })

  // 4. Send to Foldback
  it('sendToFoldback sets foldback only', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    act(() => result.current.sendToFoldback(VERSE_16))
    expect(result.current.foldback).toEqual(VERSE_16)
    expect(result.current.preview).toBeNull()
    expect(result.current.live).toBeNull()
  })

  // 5. Send to Both
  it('sendToBoth sets live and foldback, leaves preview untouched', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    act(() => result.current.sendToBoth(VERSE_16))
    expect(result.current.live).toEqual(VERSE_16)
    expect(result.current.foldback).toEqual(VERSE_16)
    expect(result.current.preview).toBeNull()
  })

  // 6. Push Preview to Live
  it('pushPreviewToLive copies preview content to live', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    act(() => result.current.stageToPreview(VERSE_16))
    act(() => result.current.pushPreviewToLive())
    expect(result.current.live).toEqual(VERSE_16)
    expect(result.current.foldback).toBeNull()
  })

  it('pushPreviewToLive with an empty preview sets live to null (no crash)', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    expect(() => act(() => result.current.pushPreviewToLive())).not.toThrow()
    expect(result.current.live).toBeNull()
  })

  // 7. Clear Preview
  it('clearPreview nulls preview only', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    act(() => {
      result.current.stageToPreview(VERSE_16)
      result.current.sendToLive(VERSE_16)
      result.current.sendToFoldback(VERSE_20)
    })
    act(() => result.current.clearPreview())
    expect(result.current.preview).toBeNull()
    expect(result.current.live).toEqual(VERSE_16)
    expect(result.current.foldback).toEqual(VERSE_20)
  })

  // 8. Clear Live
  it('clearLive nulls live only', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    act(() => {
      result.current.stageToPreview(VERSE_16)
      result.current.sendToLive(VERSE_16)
      result.current.sendToFoldback(VERSE_20)
    })
    act(() => result.current.clearLive())
    expect(result.current.live).toBeNull()
    expect(result.current.preview).toEqual(VERSE_16)
    expect(result.current.foldback).toEqual(VERSE_20)
  })

  // 9. Clear Foldback
  it('clearFoldback nulls foldback only', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    act(() => {
      result.current.stageToPreview(VERSE_16)
      result.current.sendToLive(VERSE_16)
      result.current.sendToFoldback(VERSE_20)
    })
    act(() => result.current.clearFoldback())
    expect(result.current.foldback).toBeNull()
    expect(result.current.preview).toEqual(VERSE_16)
    expect(result.current.live).toEqual(VERSE_16)
  })

  // 10 & 11. Next/Previous Live (verse)
  it('nextLive advances the verse and previousLive steps back', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    act(() => result.current.sendToLive(VERSE_16))
    act(() => result.current.nextLive())
    expect((result.current.live as VerseDisplayContent).verse).toBe(17)
    act(() => result.current.previousLive())
    expect((result.current.live as VerseDisplayContent).verse).toBe(16)
  })

  // 12 & 13. Next/Previous Foldback (song)
  it('nextFoldback advances the song slide and previousFoldback steps back', () => {
    const { result } = renderHook(() => usePresentationEngine([TEST_SONG]))
    act(() => result.current.sendToFoldback(songSlide(0, ['line one'])))
    act(() => result.current.nextFoldback())
    expect((result.current.foldback as SongDisplayContent).slideIndex).toBe(1)
    act(() => result.current.previousFoldback())
    expect((result.current.foldback as SongDisplayContent).slideIndex).toBe(0)
  })

  // 14. Live/Foldback independence -- the single most important test in
  // this suite (Stage 3.1 Sections 4, 8, 9, 10).
  describe('Live/Foldback independence', () => {
    it('navigating Foldback does not change Live (scripture)', () => {
      const { result } = renderHook(() => usePresentationEngine([]))
      act(() => {
        result.current.sendToLive(VERSE_16)
        result.current.sendToFoldback(VERSE_20)
      })
      act(() => result.current.nextFoldback())
      expect((result.current.live as VerseDisplayContent).verse).toBe(16)
      expect((result.current.foldback as VerseDisplayContent).verse).toBe(21)
    })

    it('navigating Live does not change Foldback (scripture)', () => {
      const { result } = renderHook(() => usePresentationEngine([]))
      act(() => {
        result.current.sendToLive(VERSE_16)
        result.current.sendToFoldback(VERSE_20)
      })
      act(() => result.current.nextLive())
      expect((result.current.foldback as VerseDisplayContent).verse).toBe(20)
      expect((result.current.live as VerseDisplayContent).verse).toBe(17)
    })

    it('navigating Foldback does not change Live (song)', () => {
      const { result } = renderHook(() => usePresentationEngine([TEST_SONG]))
      act(() => {
        result.current.sendToLive(songSlide(1, ['line two']))
        result.current.sendToFoldback(songSlide(0, ['line one']))
      })
      act(() => result.current.nextFoldback())
      expect((result.current.live as SongDisplayContent).slideIndex).toBe(1)
      expect((result.current.foldback as SongDisplayContent).slideIndex).toBe(1)
    })

    it('navigating Live does not change Foldback (song)', () => {
      const { result } = renderHook(() => usePresentationEngine([TEST_SONG]))
      act(() => {
        result.current.sendToLive(songSlide(1, ['line two']))
        result.current.sendToFoldback(songSlide(0, ['line one']))
      })
      act(() => result.current.nextLive())
      expect((result.current.foldback as SongDisplayContent).slideIndex).toBe(0)
      expect((result.current.live as SongDisplayContent).slideIndex).toBe(2)
    })

    // The exact sequence from Stage 3.1's Section 8: Send to Both, then
    // navigate one destination, then the other, confirming no
    // cross-destination mutation at any point.
    it('after Send to Both, destinations navigate independently in both directions', () => {
      const { result } = renderHook(() => usePresentationEngine([TEST_SONG]))
      act(() => result.current.sendToBoth(songSlide(0, ['line one'])))
      expect((result.current.live as SongDisplayContent).slideIndex).toBe(0)
      expect((result.current.foldback as SongDisplayContent).slideIndex).toBe(0)

      act(() => result.current.nextFoldback())
      expect((result.current.live as SongDisplayContent).slideIndex).toBe(0)
      expect((result.current.foldback as SongDisplayContent).slideIndex).toBe(1)

      act(() => result.current.nextLive())
      expect((result.current.live as SongDisplayContent).slideIndex).toBe(1)
      expect((result.current.foldback as SongDisplayContent).slideIndex).toBe(1)
    })
  })

  // 15. Preview independence
  it('Preview never changes as a side effect of Live/Foldback commands', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    act(() => result.current.stageToPreview(VERSE_16))
    act(() => {
      result.current.sendToLive(VERSE_20)
      result.current.sendToFoldback(VERSE_20)
      result.current.nextLive()
      result.current.nextFoldback()
      result.current.clearLive()
      result.current.clearFoldback()
    })
    expect(result.current.preview).toEqual(VERSE_16)
  })

  // 16. Translation switching
  it('changeLiveTranslation updates translation and text on live only', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    act(() => {
      result.current.sendToLive(VERSE_16)
      result.current.sendToFoldback(VERSE_16)
    })
    act(() => result.current.changeLiveTranslation('NIV', 'placeholder NIV text'))
    expect((result.current.live as VerseDisplayContent).translation).toBe('NIV')
    expect((result.current.foldback as VerseDisplayContent).translation).toBe('KJV')
  })

  it('setLiveSecondaryTranslation sets and clears the comparison translation', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    act(() => result.current.sendToLive(VERSE_16))
    act(() => result.current.setLiveSecondaryTranslation('NIV', 'placeholder'))
    expect((result.current.live as VerseDisplayContent).secondaryTranslation).toBe('NIV')
    act(() => result.current.setLiveSecondaryTranslation(null, null))
    expect((result.current.live as VerseDisplayContent).secondaryTranslation).toBeUndefined()
  })

  // 17. Command log behaviour
  describe('commandLog', () => {
    it('records a command with destination and timestamp for each action', () => {
      const { result } = renderHook(() => usePresentationEngine([]))
      act(() => result.current.sendToLive(VERSE_16))
      expect(result.current.commandLog.length).toBe(1)
      expect(result.current.commandLog[0].command).toBe('SEND_LIVE')
      expect(result.current.commandLog[0].destination).toBe('live')
      expect(typeof result.current.commandLog[0].timestamp).toBe('number')
    })

    it('records sendToBoth without a single destination (applies to both)', () => {
      const { result } = renderHook(() => usePresentationEngine([]))
      act(() => result.current.sendToBoth(VERSE_16))
      const entry = result.current.commandLog.find((c) => c.command === 'SEND_BOTH')
      expect(entry).toBeDefined()
      expect(entry?.destination).toBeUndefined()
    })

    it('caps the log at 50 entries', () => {
      const { result } = renderHook(() => usePresentationEngine([]))
      act(() => {
        for (let i = 0; i < 60; i++) result.current.sendToLive(VERSE_16)
      })
      expect(result.current.commandLog.length).toBe(50)
    })
  })
})

describe('navigateContent (standalone)', () => {
  it('returns null when given null', () => {
    expect(navigateContent(null, 1, [])).toBeNull()
  })

  it('advances a verse forward and backward', () => {
    const next = navigateContent(VERSE_16, 1, [])
    expect(next).not.toBeNull()
    expect((next as VerseDisplayContent).verse).toBe(17)
    const back = navigateContent(next, -1, [])
    expect((back as VerseDisplayContent).verse).toBe(16)
  })

  it('returns the same content unchanged for a slide with no deck info (documented limitation)', () => {
    const slide: DisplayContent = { type: 'slide', text: 'some slide text' }
    const result = navigateContent(slide, 1, [])
    expect(result).toEqual(slide)
  })

  it('returns the same content unchanged for a timer', () => {
    const timer: DisplayContent = { type: 'timer', sessionTitle: 'Sermon', remainingSeconds: 100, totalSeconds: 300 }
    const result = navigateContent(timer, 1, [])
    expect(result).toEqual(timer)
  })

  it('does not mutate the object passed in (immutability check)', () => {
    const original = { ...VERSE_16 }
    navigateContent(VERSE_16, 1, [])
    expect(VERSE_16).toEqual(original)
  })
})
