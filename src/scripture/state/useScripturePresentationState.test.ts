import { describe, it, expect, beforeAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScripturePresentationState } from './useScripturePresentationState'
import { addImportedChapter } from '../../bibleModel'

// ALT-STAGE4-PART46: synthetic fixture spanning two chapters, so
// chapter-boundary navigation (Section 19) can be tested deterministically
// without depending on the real (partial) KJV dataset.
beforeAll(() => {
  addImportedChapter('Luke', 93, 'TESTNAV', ['first chapter verse one', 'first chapter verse two', 'first chapter verse three'])
  addImportedChapter('Luke', 94, 'TESTNAV', ['second chapter verse one', 'second chapter verse two'])
})

describe('useScripturePresentationState', () => {
  it('starts with no group and no active verse', () => {
    const { result } = renderHook(() => useScripturePresentationState())
    expect(result.current.group).toBeNull()
    expect(result.current.activeVerse).toBeNull()
  })

  it('openGroup sets the group and defaults the active verse to the group start', () => {
    const { result } = renderHook(() => useScripturePresentationState())
    act(() => result.current.openGroup({ translationId: 'testnav', bookId: 'luke', chapter: 93, startVerse: 1, endVerse: 3 }))
    expect(result.current.group).toEqual({ translationId: 'testnav', bookId: 'luke', chapter: 93, startVerse: 1, endVerse: 3 })
    expect(result.current.activeVerse).toEqual({ translationId: 'testnav', bookId: 'luke', chapter: 93, verse: 1 })
  })

  it('setActiveVerse moves the active verse without changing the group', () => {
    const { result } = renderHook(() => useScripturePresentationState())
    act(() => result.current.openGroup({ translationId: 'testnav', bookId: 'luke', chapter: 93, startVerse: 1, endVerse: 3 }))
    act(() => result.current.setActiveVerse(3))
    expect(result.current.activeVerse?.verse).toBe(3)
    expect(result.current.group).toEqual({ translationId: 'testnav', bookId: 'luke', chapter: 93, startVerse: 1, endVerse: 3 }) // unchanged
  })

  it('resizeGroup extends the group to include a later verse', () => {
    const { result } = renderHook(() => useScripturePresentationState())
    act(() => result.current.openGroup({ translationId: 'testnav', bookId: 'luke', chapter: 93, startVerse: 1, endVerse: 2 }))
    act(() => result.current.resizeGroup(3))
    expect(result.current.group).toEqual({ translationId: 'testnav', bookId: 'luke', chapter: 93, startVerse: 1, endVerse: 3 })
  })

  it('resizeGroup extends the group backward when the clicked verse is before the start', () => {
    const { result } = renderHook(() => useScripturePresentationState())
    act(() => result.current.openGroup({ translationId: 'testnav', bookId: 'luke', chapter: 93, startVerse: 2, endVerse: 3 }))
    act(() => result.current.resizeGroup(1))
    expect(result.current.group).toEqual({ translationId: 'testnav', bookId: 'luke', chapter: 93, startVerse: 1, endVerse: 3 })
  })

  it('nextVerse steps forward within a chapter', () => {
    const { result } = renderHook(() => useScripturePresentationState())
    act(() => result.current.openGroup({ translationId: 'testnav', bookId: 'luke', chapter: 93, startVerse: 1, endVerse: 1 }))
    act(() => result.current.nextVerse())
    expect(result.current.activeVerse).toEqual({ translationId: 'testnav', bookId: 'luke', chapter: 93, verse: 2 })
  })

  it('nextVerse crosses a chapter boundary', () => {
    const { result } = renderHook(() => useScripturePresentationState())
    act(() => result.current.openGroup({ translationId: 'testnav', bookId: 'luke', chapter: 93, startVerse: 3, endVerse: 3 }))
    act(() => result.current.nextVerse())
    expect(result.current.activeVerse).toEqual({ translationId: 'testnav', bookId: 'luke', chapter: 94, verse: 1 })
  })

  it('previousVerse crosses a chapter boundary backward', () => {
    const { result } = renderHook(() => useScripturePresentationState())
    act(() => result.current.openGroup({ translationId: 'testnav', bookId: 'luke', chapter: 94, startVerse: 1, endVerse: 1 }))
    act(() => result.current.previousVerse())
    expect(result.current.activeVerse).toEqual({ translationId: 'testnav', bookId: 'luke', chapter: 93, verse: 3 })
  })

  it('closeGroup clears both group and active verse', () => {
    const { result } = renderHook(() => useScripturePresentationState())
    act(() => result.current.openGroup({ translationId: 'testnav', bookId: 'luke', chapter: 93, startVerse: 1, endVerse: 1 }))
    act(() => result.current.closeGroup())
    expect(result.current.group).toBeNull()
    expect(result.current.activeVerse).toBeNull()
  })

  it('navigating the active verse never changes the group (Group vs. Active Verse independence)', () => {
    const { result } = renderHook(() => useScripturePresentationState())
    act(() => result.current.openGroup({ translationId: 'testnav', bookId: 'luke', chapter: 93, startVerse: 1, endVerse: 3 }))
    act(() => result.current.nextVerse())
    act(() => result.current.nextVerse())
    act(() => result.current.nextVerse()) // crosses into chapter 94
    expect(result.current.group).toEqual({ translationId: 'testnav', bookId: 'luke', chapter: 93, startVerse: 1, endVerse: 3 })
  })
})
