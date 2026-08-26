// ALT-STAGE4-PART18/19/20: the explicit Scripture presentation state.
// This formalizes what was previously ad-hoc local state
// (openedRange/activeVerseNum) inside OperatorScreen.tsx into a proper,
// independently testable model. The Group is the passage the operator
// originally selected/requested; the Active Verse is whichever single
// verse is currently being navigated -- they are independently mutable,
// per Section 18's explicit requirement.

import { useState, useCallback } from 'react'
import { scriptureRepository } from '../repository/ScriptureRepository'
import type { VerseReference } from '../types'

export interface ScriptureGroup {
  translationId: string
  bookId: string
  chapter: number
  startVerse: number
  endVerse: number
}

export interface ScripturePresentationState {
  group: ScriptureGroup | null
  activeVerse: VerseReference | null

  openGroup(group: ScriptureGroup): void
  closeGroup(): void
  // ALT-STAGE4-PART20: Shift+click group resizing -- extends the group
  // to include the clicked verse, in either direction; never produces an
  // invalid (start > end) range.
  resizeGroup(verse: number): void
  setActiveVerse(verse: number): void
  nextVerse(): void
  previousVerse(): void
}

export function useScripturePresentationState(): ScripturePresentationState {
  const [group, setGroup] = useState<ScriptureGroup | null>(null)
  const [activeVerse, setActiveVerseState] = useState<VerseReference | null>(null)

  const openGroup = useCallback((newGroup: ScriptureGroup) => {
    setGroup(newGroup)
    setActiveVerseState({ translationId: newGroup.translationId, bookId: newGroup.bookId, chapter: newGroup.chapter, verse: newGroup.startVerse })
  }, [])

  const closeGroup = useCallback(() => {
    setGroup(null)
    setActiveVerseState(null)
  }, [])

  const resizeGroup = useCallback((verse: number) => {
    setGroup((prev) => {
      if (!prev) return prev
      return { ...prev, startVerse: Math.min(prev.startVerse, verse), endVerse: Math.max(prev.endVerse, verse) }
    })
  }, [])

  const setActiveVerse = useCallback((verse: number) => {
    setGroup((currentGroup) => {
      if (!currentGroup) return currentGroup
      setActiveVerseState({ translationId: currentGroup.translationId, bookId: currentGroup.bookId, chapter: currentGroup.chapter, verse })
      return currentGroup
    })
  }, [])

  // ALT-STAGE4-PART19: crosses chapter (and book) boundaries via the
  // repository, which delegates to bibleModel's existing, already-tested
  // nextVerseRef/previousVerseRef logic -- not reimplemented here.
  const nextVerse = useCallback(() => {
    setActiveVerseState((current) => {
      if (!current) return current
      const next = scriptureRepository.nextVerse(current)
      return next ?? current
    })
  }, [])

  const previousVerse = useCallback(() => {
    setActiveVerseState((current) => {
      if (!current) return current
      const prev = scriptureRepository.previousVerse(current)
      return prev ?? current
    })
  }, [])

  return { group, activeVerse, openGroup, closeGroup, resizeGroup, setActiveVerse, nextVerse, previousVerse }
}
