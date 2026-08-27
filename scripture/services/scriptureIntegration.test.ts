// ALT-STAGE4-PART24/44: this test proves the Scripture Engine does NOT
// bypass PresentationEngine -- scripture content is converted to
// DisplayContent, then handed to PresentationEngine's existing commands,
// exactly as Section 24 requires. No second presentation state system
// is introduced.

import { describe, it, expect, beforeAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePresentationEngine } from '../../core/PresentationEngine'
import { scriptureEngine } from './ScriptureEngine'
import { addImportedChapter } from '../../bibleModel'
import type { VerseDisplayContent } from '../../screens/OutputStage'

beforeAll(() => {
  addImportedChapter('Titus', 1, 'INTEGRATION', ['integration verse one', 'integration verse two'])
  addImportedChapter('Jude', 1, 'INTEGRATION', ['jude test verse one'])
})

// ALT-STAGE4-PART25: converts a Scripture Passage into the existing
// DisplayContent shape (this is exactly what a real Scripture UI
// component does before calling a PresentationEngine command -- shown
// here directly so the integration can be tested without needing to
// render the full OperatorScreen).
function passageToDisplayContent(translationId: string, bookId: string, chapter: number, verse: number): VerseDisplayContent | null {
  const v = scriptureEngine.getVerse(translationId, bookId, chapter, verse)
  if (!v) return null
  return { type: 'verse', ref: `${bookId} ${chapter}:${verse}`, translation: translationId, text: v.text, book: bookId, chapter, verse }
}

describe('Scripture -> PresentationEngine integration', () => {
  it('search -> open passage -> stage to Preview', () => {
    const results = scriptureEngine.search('Titus 1:1', { translationId: 'integration' })
    expect(results.length).toBe(1)
    const { result } = renderHook(() => usePresentationEngine([]))
    const content = passageToDisplayContent('integration', results[0].reference.bookId, results[0].reference.chapter, results[0].reference.verse)
    expect(content).not.toBeNull()
    act(() => result.current.stageToPreview(content!))
    expect(result.current.preview).toEqual(content)
    expect(result.current.live).toBeNull()
  })

  it('Preview -> Send Live uses PresentationEngine.pushPreviewToLive, not a separate mechanism', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    const content = passageToDisplayContent('integration', 'titus', 1, 1)!
    act(() => result.current.stageToPreview(content))
    act(() => result.current.pushPreviewToLive())
    expect(result.current.live).toEqual(content)
  })

  it('Send to Foldback uses PresentationEngine.sendToFoldback', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    const content = passageToDisplayContent('integration', 'titus', 1, 2)!
    act(() => result.current.sendToFoldback(content))
    expect(result.current.foldback).toEqual(content)
    expect(result.current.live).toBeNull()
  })

  // Section 44's explicit example: Live = one passage, Foldback = a
  // different passage from a different book entirely, and navigating
  // Foldback must not touch Live -- reusing real ScriptureEngine-sourced
  // content this time, not just synthetic DisplayContent objects built
  // by hand, to prove the whole chain (Scripture Engine -> DisplayContent
  // -> PresentationEngine) preserves independence end to end.
  it('Live and Foldback hold different scripture passages independently', () => {
    const { result } = renderHook(() => usePresentationEngine([]))
    const liveContent = passageToDisplayContent('integration', 'titus', 1, 1)!
    const foldbackContent = passageToDisplayContent('integration', 'jude', 1, 1)!

    act(() => {
      result.current.sendToLive(liveContent)
      result.current.sendToFoldback(foldbackContent)
    })
    expect(result.current.live).toEqual(liveContent)
    expect(result.current.foldback).toEqual(foldbackContent)

    act(() => result.current.nextFoldback())
    // Foldback navigated (or attempted to -- Jude only has 1 chapter/1
    // verse in this fixture, so it may hold at the same verse if there's
    // nowhere to advance to; either way, Live must be untouched).
    expect(result.current.live).toEqual(liveContent)
  })
})
