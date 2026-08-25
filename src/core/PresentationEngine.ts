// ALT-STAGE3: the Presentation Engine. This is now the single
// authoritative source of Preview/Live/Foldback state -- no UI component
// should ever call a raw setState on these three; everything goes
// through the command functions this hook returns, matching Section 2's
// "Do NOT allow individual UI components to independently manage Live,
// Preview, and Foldback state."
//
// "Foldback" here is the conceptual destination described in the brief.
// The existing codebase's "Stage" naming (StageScreen, stageContent,
// useStageTimer, "Send to Stage") is kept as-is at the file/prop level
// to avoid an unnecessary, risky rename of already-working code -- but
// architecturally, Stage IS the Foldback destination throughout this
// engine and everywhere Destination is used.

import { useState, useCallback } from 'react'
import type { DisplayContent } from '../screens/OutputStage'
import type { Song } from '../songModel'
import { buildSlides } from '../songModel'
import { nextVerseRef, previousVerseRef, getVerseRange, rangeLabel } from '../bibleModel'

export type Destination = 'preview' | 'live' | 'foldback'

// ALT-STAGE3-PART20: lightweight command log -- not a full event-sourcing
// system (deliberately not over-engineered per the brief's own guidance),
// just enough that a future AI layer or Remote Control client can observe
// what commands fired without needing to know how any UI works. Kept as
// a simple in-memory ring buffer.
export interface PresentationCommandEvent {
  command: string
  destination?: Destination
  timestamp: number
}

const MAX_COMMAND_LOG = 50

export interface PresentationEngine {
  preview: DisplayContent | null
  live: DisplayContent | null
  foldback: DisplayContent | null
  commandLog: PresentationCommandEvent[]

  stageToPreview(content: DisplayContent): void
  sendToLive(content: DisplayContent): void
  sendToFoldback(content: DisplayContent): void
  // ALT-STAGE3-PART13: sends the same content to both Live and Foldback
  // at once. After this call, the two are independent again -- navigating
  // one does not affect the other, since each destination just holds its
  // own copy of the content from this point on.
  sendToBoth(content: DisplayContent): void
  pushPreviewToLive(): void

  clearPreview(): void
  clearLive(): void
  clearFoldback(): void

  // ALT-STAGE3-PART5/9: generic navigation -- dispatches to the correct
  // content-type-specific logic (verse vs. song today; slide/timer have
  // no generic navigation defined yet, see navigate() below) and only
  // ever touches the ONE destination's state, never any other.
  nextLive(): void
  previousLive(): void
  nextFoldback(): void
  previousFoldback(): void

  changeLiveTranslation(translation: string, text: string): void
  setLiveSecondaryTranslation(translation: string | null, text: string | null): void
}

// ALT-STAGE3-PART3/5: the actual content-vs-position navigation logic.
// Exported standalone (not just used internally) so it's independently
// testable and so a future Foldback deck-navigation extension can reuse
// it without needing the whole hook.
export function navigateContent(current: DisplayContent | null, direction: 1 | -1, songs: Song[]): DisplayContent | null {
  if (!current) return current

  if (current.type === 'verse' && current.book && current.chapter !== undefined && current.verse !== undefined) {
    const ref = { book: current.book, chapter: current.chapter, verse: current.verse }
    const next = direction === 1 ? nextVerseRef(ref) : previousVerseRef(ref)
    if (!next) return current
    const verses = getVerseRange(next.book, next.chapter, next.verse, next.verse, current.translation)
    if (verses.length === 0) return current
    return {
      type: 'verse',
      ref: rangeLabel(next.book, next.chapter, next.verse, next.verse),
      translation: current.translation,
      text: verses[0].text,
      book: next.book,
      chapter: next.chapter,
      verse: next.verse,
    }
  }

  if (current.type === 'song' && current.songId && current.slideIndex !== undefined) {
    const song = songs.find((s) => s.id === current.songId)
    if (!song) return current
    const slides = buildSlides(song)
    const nextIndex = current.slideIndex + direction
    const slide = slides[nextIndex]
    if (!slide) return current
    return { type: 'song', title: song.title, artist: song.artist, lines: slide.lines, songId: song.id, slideIndex: nextIndex }
  }

  // ALT-STAGE3-PART18: slides and timers have no generic next/previous
  // defined yet -- slide decks aren't lifted to shared state this stage
  // (Section 26's "do not build the complete system yet" applies), and a
  // timer isn't something you "navigate" in this sense. Both are natural
  // future extensions of this same function once that data exists.
  return current
}

export function usePresentationEngine(songs: Song[]): PresentationEngine {
  const [preview, setPreview] = useState<DisplayContent | null>(null)
  const [live, setLive] = useState<DisplayContent | null>(null)
  const [foldback, setFoldback] = useState<DisplayContent | null>(null)
  const [commandLog, setCommandLog] = useState<PresentationCommandEvent[]>([])

  const logCommand = useCallback((command: string, destination?: Destination) => {
    setCommandLog((prev) => [...prev.slice(-(MAX_COMMAND_LOG - 1)), { command, destination, timestamp: Date.now() }])
  }, [])

  const stageToPreview = useCallback((content: DisplayContent) => {
    setPreview(content)
    logCommand('STAGE_PREVIEW', 'preview')
  }, [logCommand])

  const sendToLive = useCallback((content: DisplayContent) => {
    setLive(content)
    logCommand('SEND_LIVE', 'live')
  }, [logCommand])

  const sendToFoldback = useCallback((content: DisplayContent) => {
    setFoldback(content)
    logCommand('SEND_FOLDBACK', 'foldback')
  }, [logCommand])

  const sendToBoth = useCallback((content: DisplayContent) => {
    setLive(content)
    setFoldback(content)
    logCommand('SEND_BOTH')
  }, [logCommand])

  const pushPreviewToLive = useCallback(() => {
    setLive((prevLive) => {
      logCommand('SEND_LIVE', 'live')
      return preview
    })
  }, [preview, logCommand])

  const clearPreview = useCallback(() => {
    setPreview(null)
    logCommand('CLEAR_PREVIEW', 'preview')
  }, [logCommand])

  const clearLive = useCallback(() => {
    setLive(null)
    logCommand('CLEAR_LIVE', 'live')
  }, [logCommand])

  const clearFoldback = useCallback(() => {
    setFoldback(null)
    logCommand('CLEAR_FOLDBACK', 'foldback')
  }, [logCommand])

  const nextLive = useCallback(() => {
    setLive((prev) => navigateContent(prev, 1, songs))
    logCommand('NEXT_LIVE', 'live')
  }, [songs, logCommand])

  const previousLive = useCallback(() => {
    setLive((prev) => navigateContent(prev, -1, songs))
    logCommand('PREVIOUS_LIVE', 'live')
  }, [songs, logCommand])

  const nextFoldback = useCallback(() => {
    setFoldback((prev) => navigateContent(prev, 1, songs))
    logCommand('NEXT_FOLDBACK', 'foldback')
  }, [songs, logCommand])

  const previousFoldback = useCallback(() => {
    setFoldback((prev) => navigateContent(prev, -1, songs))
    logCommand('PREVIOUS_FOLDBACK', 'foldback')
  }, [songs, logCommand])

  const changeLiveTranslation = useCallback((translation: string, text: string) => {
    setLive((prev) => (prev && prev.type === 'verse' ? { ...prev, translation, text } : prev))
  }, [])

  const setLiveSecondaryTranslation = useCallback((translation: string | null, text: string | null) => {
    setLive((prev) =>
      prev && prev.type === 'verse' ? { ...prev, secondaryTranslation: translation ?? undefined, secondaryText: text ?? undefined } : prev,
    )
  }, [])

  return {
    preview,
    live,
    foldback,
    commandLog,
    stageToPreview,
    sendToLive,
    sendToFoldback,
    sendToBoth,
    pushPreviewToLive,
    clearPreview,
    clearLive,
    clearFoldback,
    nextLive,
    previousLive,
    nextFoldback,
    previousFoldback,
    changeLiveTranslation,
    setLiveSecondaryTranslation,
  }
}
