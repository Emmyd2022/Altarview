import { useState, useEffect, type ReactNode } from 'react'
import type { DisplayContent } from './OutputStage'
import { useT } from '../i18n'
import { availableTranslationsFor } from '../verseData'
import SongLyricsScreen from './SongLyricsScreen'
import SermonSlidesScreen from './SermonSlidesScreen'
import TimerScreen from './TimerScreen'
import UpNextScreen from './UpNextScreen'
import type { Song } from '../songModel'
import type { ServiceSession } from '../sessionModel'
import { newPinId, type PinnedItem } from '../pinModel'
import { parseReference, getVerseRange, chapterVerseCount, nextVerseRef, previousVerseRef, rangeLabel, type VerseRef } from '../bibleModel'

// ALT: unified Operator screen -- Scripture, Songs, Slides, Timer, and Up
// Next are pages within this one screen instead of separate top-level
// screens, so the Preview/Live/Pinned panel on the right stays visible no
// matter which page is showing.
export type OperatorPage = 'scripture' | 'songs' | 'slides' | 'timer' | 'up-next'

const TRANSLATIONS = ['NKJV', 'KJV', 'NIV', 'ESV', 'AMP', 'ERV', 'MSG', 'NLT', 'Pidgin']

interface Verse {
  ref: string
  translation: string
  text: string
}

const SAMPLE_VERSES: Verse[] = [
  {
    ref: 'John 3:16',
    translation: 'KJV',
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  },
  {
    ref: 'Psalm 23:1',
    translation: 'KJV',
    text: 'The LORD is my shepherd; I shall not want.',
  },
  {
    ref: 'Romans 8:28',
    translation: 'NIV',
    text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
  },
  {
    ref: 'Philippians 4:13',
    translation: 'NASB',
    text: 'I can do all things through Him who strengthens me.',
  },
  {
    ref: 'Isaiah 40:31',
    translation: 'ESV',
    text: 'But they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.',
  },
  {
    ref: 'Proverbs 3:5–6',
    translation: 'NIV',
    text: 'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
  },
  // ALT: expanded with the fully-loaded John chapters (item 3 -- "enough
  // scriptures for proper testing"), generated from bibleModel.ts so the
  // browsable list isn't limited to 6 hand-picked highlights.
  ...([1, 3, 4] as const).flatMap((chapter) =>
    getVerseRange('John', chapter, 1, chapterVerseCount('John', chapter), 'KJV').map((v) => ({
      ref: `John ${v.chapter}:${v.verse}`,
      translation: v.translation,
      text: v.text,
    })),
  ),
]

const UP_NEXT = [
  { type: 'song', label: 'Amazing Grace' },
  { type: 'scripture', label: 'Romans 8:28 (NIV)' },
  { type: 'slides', label: 'Announcement Slides' },
]

const TYPE_ICON: Record<string, ReactNode> = {
  song: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M5 9V3.5l5-1.5V8" stroke="#8F9885" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="3.5" cy="9" r="1.5" stroke="#8F9885" strokeWidth="1.2" />
      <circle cx="8.5" cy="7.5" r="1.5" stroke="#8F9885" strokeWidth="1.2" />
    </svg>
  ),
  scripture: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <circle cx="5" cy="5" r="3" stroke="#8F9885" strokeWidth="1.2" />
      <path d="M7.5 7.5L10 10" stroke="#8F9885" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  slides: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="2" width="10" height="8" rx="1.5" stroke="#8F9885" strokeWidth="1.2" />
      <path d="M3 5h6M3 7h4" stroke="#8F9885" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
}

function verseToContent(v: Verse): DisplayContent {
  return { type: 'verse', ref: v.ref, translation: v.translation, text: v.text }
}

// ALT-003: Preview and Live are now independent outputs, lifted to App.tsx
// so the Operator screen and the two output screens share the same state
// instead of Operator only ever driving one hardcoded output.
export default function OperatorScreen({
  page,
  onChangePage,
  previewContent,
  liveContent,
  onSendPreview,
  onSendLive,
  onPushToLive,
  onClearPreview,
  onClearLive,
  onChangeLiveTranslation,
  onSetLiveSecondary,
  onOpenPreview,
  onOpenLive,
  songs,
  onChangeSongs,
  onSendPreviewContent,
  onSendLiveContent,
  onSendStageContent,
  sessions,
}: {
  page: OperatorPage
  onChangePage: (page: OperatorPage) => void
  previewContent: DisplayContent | null
  liveContent: DisplayContent | null
  onSendPreview: (v: Verse) => void
  onSendLive: (v: Verse) => void
  onPushToLive: () => void
  onClearPreview: () => void
  onClearLive: () => void
  onChangeLiveTranslation?: (translation: string, text: string) => void
  onSetLiveSecondary?: (translation: string | null, text: string | null) => void
  onOpenPreview?: () => void
  onOpenLive?: () => void
  songs?: Song[]
  onChangeSongs?: (songs: Song[]) => void
  onSendPreviewContent?: (content: DisplayContent) => void
  onSendLiveContent?: (content: DisplayContent) => void
  onSendStageContent?: (content: DisplayContent) => void
  sessions?: ServiceSession[]
}) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [translation, setTranslation] = useState('KJV')
  // ALT-004: detection (is the mic being analyzed) and auto-send (does a
  // confirmed match push straight to Live) are independent toggles.
  const [aiDetect, setAiDetect] = useState(false)
  const [autoSend, setAutoSend] = useState(false)
  // ALT-024/expanded: pinned/anchored items for fast recall mid-service --
  // now supports any resource type (verse, song slide, sermon slide,
  // timer preset, Up Next transition), not just scriptures.
  const [pinned, setPinned] = useState<PinnedItem[]>([])
  // ALT-fix: "Now on Screen" panel widened (260 -> 320 default) and made
  // drag-resizable, since translation compare / longer song lines were
  // cramped at the old fixed width.
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [resizingSidebar, setResizingSidebar] = useState(false)
  // ALT: Scripture page rebuild -- opened verse range (from a reference
  // search like "John 3:16-20" or clicking a result), and multi-select
  // for pinning several verses as one item (FreeShow/ProPresenter-style).
  const [openedRange, setOpenedRange] = useState<{ book: string; chapter: number; start: number; end: number } | null>(null)
  const [selectedVerseKeys, setSelectedVerseKeys] = useState<Set<string>>(new Set())

  function verseKey(book: string, chapter: number, verse: number) {
    return `${book}|${chapter}|${verse}`
  }

  function openReference(ref: { book: string; chapter: number; startVerse: number; endVerse: number }) {
    setOpenedRange({ book: ref.book, chapter: ref.chapter, start: ref.startVerse, end: ref.endVerse })
  }

  const openedVerses = openedRange
    ? getVerseRange(openedRange.book, openedRange.chapter, openedRange.start, openedRange.end, translation)
    : []
  const openedCombinedText = openedVerses.map((v) => v.text).join(' ')
  const openedLabel = openedRange ? rangeLabel(openedRange.book, openedRange.chapter, openedRange.start, openedRange.end) : ''
  // ALT: FreeShow-style context -- show the whole chapter (verses before
  // and after the target range), not just the isolated target verses, so
  // the operator can see what comes next before deciding what to send.
  const chapterVerses = openedRange
    ? getVerseRange(openedRange.book, openedRange.chapter, 1, chapterVerseCount(openedRange.book, openedRange.chapter), translation)
    : []

  function openedRangeToContent(): DisplayContent | null {
    if (!openedRange || openedVerses.length === 0) return null
    return { type: 'verse', ref: openedLabel, translation, text: openedCombinedText }
  }

  // Clicking a verse within the chapter context sets it as the new single-
  // verse target (or extends the range with Shift, matching common list-
  // selection convention) and stages it to Preview.
  function selectVerseInChapter(verseNum: number, extend: boolean) {
    if (!openedRange) return
    if (extend) {
      setOpenedRange({ ...openedRange, start: Math.min(openedRange.start, verseNum), end: Math.max(openedRange.end, verseNum) })
    } else {
      setOpenedRange({ ...openedRange, start: verseNum, end: verseNum })
    }
    const content = openedRangeToContentFor(openedRange.book, openedRange.chapter, extend ? Math.min(openedRange.start, verseNum) : verseNum, extend ? Math.max(openedRange.end, verseNum) : verseNum)
    if (content) onSendPreviewContent?.(content)
  }

  function sendVerseInChapter(verseNum: number) {
    if (!openedRange) return
    setOpenedRange({ ...openedRange, start: verseNum, end: verseNum })
    const content = openedRangeToContentFor(openedRange.book, openedRange.chapter, verseNum, verseNum)
    if (content) {
      onSendPreviewContent?.(content)
      onSendLiveContent?.(content)
      onSendStageContent?.(content)
    }
  }

  function openedRangeToContentFor(book: string, chapter: number, start: number, end: number): DisplayContent | null {
    const verses = getVerseRange(book, chapter, start, end, translation)
    if (verses.length === 0) return null
    return { type: 'verse', ref: rangeLabel(book, chapter, start, end), translation, text: verses.map((v) => v.text).join(' ') }
  }

  function goToNextVerse() {
    if (!openedRange) return
    const next = nextVerseRef({ book: openedRange.book, chapter: openedRange.chapter, verse: openedRange.end })
    if (next) setOpenedRange({ book: next.book, chapter: next.chapter, start: next.verse, end: next.verse })
  }

  function goToPreviousVerse() {
    if (!openedRange) return
    const prev = previousVerseRef({ book: openedRange.book, chapter: openedRange.chapter, verse: openedRange.start })
    if (prev) setOpenedRange({ book: prev.book, chapter: prev.chapter, start: prev.verse, end: prev.verse })
  }

  useEffect(() => {
    if (!resizingSidebar) return
    function onMove(e: MouseEvent) {
      const next = window.innerWidth - e.clientX
      setSidebarWidth(Math.min(520, Math.max(240, next)))
    }
    function onUp() {
      setResizingSidebar(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [resizingSidebar])
  // ALT: controlled "open this specific item" requests, so a pinned item's
  // Open/Send buttons can command Songs/Slides to open the right thing
  // after switching pages.
  const [songOpenRequest, setSongOpenRequest] = useState<{ songId: string; slideIndex?: number } | null>(null)
  const [slideOpenRequest, setSlideOpenRequest] = useState<string | null>(null)
  const [dragPinIdx, setDragPinIdx] = useState<number | null>(null)
  const [dragOverPinIdx, setDragOverPinIdx] = useState<number | null>(null)

  function isPinned(v: Verse) {
    return pinned.some((p) => p.type === 'verse' && p.verseRef === v.ref && p.verseTranslation === v.translation)
  }

  function togglePin(v: Verse) {
    setPinned((prev) =>
      isPinned(v)
        ? prev.filter((p) => !(p.type === 'verse' && p.verseRef === v.ref && p.verseTranslation === v.translation))
        : [
            ...prev,
            {
              id: newPinId(),
              type: 'verse',
              label: v.ref,
              detail: v.translation,
              verseRef: v.ref,
              verseTranslation: v.translation,
              verseText: v.text,
            },
          ],
    )
  }

  function pinItem(item: Omit<PinnedItem, 'id'>) {
    setPinned((prev) => [...prev, { ...item, id: newPinId() }])
  }

  function unpinById(id: string) {
    setPinned((prev) => prev.filter((p) => p.id !== id))
  }

  // ALT: Open switches to the item's page and opens it there, without
  // sending anything anywhere.
  function openPinnedItem(p: PinnedItem) {
    if (p.type === 'verse') {
      onChangePage('scripture')
      if (p.verseRef) setQuery(p.verseRef)
    } else if (p.type === 'song') {
      onChangePage('songs')
      if (p.songTitle) {
        const song = songs?.find((s) => s.title === p.songTitle)
        if (song) setSongOpenRequest({ songId: song.id })
      }
    } else if (p.type === 'slide') {
      onChangePage('slides')
      if (p.slideText) setSlideOpenRequest(p.slideText)
    } else if (p.type === 'timer') {
      onChangePage('timer')
    } else if (p.type === 'up-next') {
      onChangePage('up-next')
    }
  }

  // ALT: Send does everything Open does, PLUS pushes the content to
  // Preview + Live + Stage at once.
  function sendPinnedItem(p: PinnedItem) {
    openPinnedItem(p)
    let content: DisplayContent | null = null
    if (p.type === 'verse' && p.verseRef && p.verseTranslation && p.verseText) {
      content = { type: 'verse', ref: p.verseRef, translation: p.verseTranslation, text: p.verseText }
    } else if (p.type === 'song' && p.songTitle && p.songLines) {
      content = { type: 'song', title: p.songTitle, artist: p.songArtist ?? '', lines: p.songLines }
    } else if (p.type === 'slide' && p.slideText) {
      content = { type: 'slide', text: p.slideText }
    }
    if (content) {
      onSendPreviewContent?.(content)
      onSendLiveContent?.(content)
      onSendStageContent?.(content)
    }
  }

  function reorderPinned(targetIdx: number) {
    if (dragPinIdx === null || dragPinIdx === targetIdx) {
      setDragPinIdx(null)
      setDragOverPinIdx(null)
      return
    }
    setPinned((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragPinIdx, 1)
      next.splice(targetIdx, 0, moved)
      return next
    })
    setDragPinIdx(null)
    setDragOverPinIdx(null)
  }

  const filtered = query.trim()
    ? SAMPLE_VERSES.filter(
        (v) =>
          v.ref.toLowerCase().includes(query.toLowerCase()) ||
          v.text.toLowerCase().includes(query.toLowerCase()),
      )
    : SAMPLE_VERSES

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div
          style={{
            height: 48,
            borderBottom: '1px solid #2A331F',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 20,
            paddingRight: 20,
            gap: 12,
            flexShrink: 0,
          }}
        >
          {/* ALT: page tabs replace the static "Operator" title -- Scripture is
              the default page; Songs/Slides/Timer/Up Next are now pages here
              instead of separate top-level screens. */}
          <div style={{ display: 'flex', gap: 2 }}>
            {([
              ['scripture', 'Scripture'],
              ['songs', 'Songs'],
              ['slides', 'Slides'],
              ['timer', 'Timer'],
              ['up-next', 'Up Next'],
            ] as [OperatorPage, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => onChangePage(id)}
                style={{
                  background: page === id ? 'rgba(168,112,46,0.14)' : 'transparent',
                  border: page === id ? '1px solid rgba(168,112,46,0.4)' : '1px solid transparent',
                  borderRadius: 6,
                  padding: '5px 11px',
                  fontSize: 12,
                  fontWeight: page === id ? 600 : 500,
                  color: page === id ? '#A8702E' : '#8F9885',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <StatusPill />
          <div style={{ flex: 1 }} />
          {onOpenPreview && <TopBarLinkBtn onClick={onOpenPreview} label={t.viewPreview} />}
          {onOpenLive && <TopBarLinkBtn onClick={onOpenLive} label={t.viewLive} />}
        </div>

        {page === 'scripture' && (
        <>
        {/* Search + controls */}
        <div style={{ padding: '14px 20px 0 20px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8F9885',
                  pointerEvents: 'none',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const parsed = parseReference(query)
                    if (parsed) openReference(parsed)
                  }
                }}
                placeholder={t.searchPlaceholder}
                style={{
                  width: '100%',
                  background: '#1B2318',
                  border: '1px solid #2A331F',
                  borderRadius: 8,
                  padding: '8px 12px 8px 32px',
                  fontSize: 13,
                  color: '#EDEAE0',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(168,112,46,0.45)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#2A331F')}
              />
            </div>
            <select
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              style={{
                background: '#1B2318',
                border: '1px solid #2A331F',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                color: '#EDEAE0',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                minWidth: 80,
              }}
            >
              {TRANSLATIONS.map((t) => (
                <option key={t} value={t} style={{ background: '#1B2318' }}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* ALT-004: AI detection + auto-send, two independent toggles */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: '6px 0',
              borderBottom: '1px solid #2A331F',
            }}
          >
            <ToggleRow
              label={t.aiDetection}
              checked={aiDetect}
              onChange={setAiDetect}
            />
            <ToggleRow
              label={t.autoSend}
              checked={autoSend}
              onChange={setAutoSend}
              disabled={!aiDetect}
              hint={!aiDetect ? t.autoSendRequires : undefined}
            />
            <div style={{ fontSize: 11, color: '#8F9885', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {aiDetect ? (
                <>
                  <PulsingDot />
                  {t.listening}
                </>
              ) : (
                t.detectionOff
              )}
            </div>
            <div style={{ fontSize: 10, color: '#3A4430' }}>
              {t.confirmedOnly}
            </div>
          </div>
        </div>

        {/* Multi-select bar (FreeShow-style: Ctrl/Cmd+click to select several, pin as one) */}
        {!openedRange && selectedVerseKeys.size >= 2 && (
          <div style={{ padding: '0 20px 10px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1B2318', border: '1px solid rgba(168,112,46,0.4)', borderRadius: 8, padding: '8px 12px' }}>
              <span style={{ fontSize: 12, color: '#A8702E' }}>{selectedVerseKeys.size} verses selected</span>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => {
                  const picked = filtered.filter((v) => selectedVerseKeys.has(v.ref))
                  if (picked.length === 0) return
                  const combinedRef = picked.map((v) => v.ref).join('; ')
                  const combinedText = picked.map((v) => v.text).join(' ')
                  pinItem({ type: 'verse', label: combinedRef, detail: picked[0].translation, verseRef: combinedRef, verseTranslation: picked[0].translation, verseText: combinedText })
                  setSelectedVerseKeys(new Set())
                }}
                style={{ background: '#A8702E', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: '#10160F', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Pin Selected as One
              </button>
              <button
                onClick={() => setSelectedVerseKeys(new Set())}
                style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 6, padding: '5px 10px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ALT: opened reading view (from a reference search or clicking a
            result) -- FreeShow/ProPresenter-style Next/Previous Verse
            navigation that crosses chapter boundaries automatically. */}
        {openedRange ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 20px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <button
                onClick={() => setOpenedRange(null)}
                style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 6, padding: '5px 12px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← Back to Search
              </button>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#EDEAE0' }}>{openedLabel}</div>
              <div style={{ fontSize: 12, color: '#8F9885' }}>({translation})</div>
              <button
                onClick={() => {
                  if (openedVerses.length === 0) return
                  pinItem({ type: 'verse', label: openedLabel, detail: translation, verseRef: openedLabel, verseTranslation: translation, verseText: openedCombinedText })
                }}
                title="Pin this passage"
                style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 6, padding: '5px 10px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Pin
              </button>
            </div>

            {chapterVerses.length === 0 ? (
              <div style={{ fontSize: 12, color: '#8F9885' }}>
                Not available in {translation} in this prototype's loaded Bible data.
              </div>
            ) : (
              <div style={{ background: '#1B2318', border: '1px solid #2A331F', borderRadius: 8, padding: 14, marginBottom: 14, maxHeight: 360, overflowY: 'auto' }}>
                <p style={{ fontSize: 10, color: '#3A4430', margin: '0 0 10px' }}>
                  Whole chapter shown for context (FreeShow-style) -- click any verse to jump there, Shift+click to
                  extend the range, double-click to send everywhere.
                </p>
                {chapterVerses.map((v) => {
                  const isTarget = openedRange && v.verse >= openedRange.start && v.verse <= openedRange.end
                  return (
                    <div
                      key={v.verse}
                      onClick={(e) => selectVerseInChapter(v.verse, e.shiftKey)}
                      onDoubleClick={() => sendVerseInChapter(v.verse)}
                      style={{
                        fontSize: 13,
                        color: isTarget ? '#EDEAE0' : '#8F9885',
                        background: isTarget ? 'rgba(168,112,46,0.1)' : 'transparent',
                        lineHeight: 1.8,
                        marginBottom: 2,
                        padding: '2px 6px',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ color: isTarget ? '#A8702E' : '#3A4430', fontSize: 10, fontWeight: 600, marginRight: 6 }}>{v.verse}</span>
                      {v.text}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <button onClick={goToPreviousVerse} style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 6, padding: '6px 14px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Previous Verse
              </button>
              <button onClick={goToNextVerse} style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 6, padding: '6px 14px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}>
                Next Verse →
              </button>
            </div>

            <p style={{ fontSize: 10, color: '#3A4430', marginBottom: 14 }}>
              Click to stage (Preview). Double-click anywhere in the passage above to send everywhere (Preview + Live + Stage).
            </p>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  const content = openedRangeToContent()
                  if (content) onSendPreviewContent?.(content)
                }}
                style={{ background: 'transparent', border: '1px solid rgba(168,112,46,0.4)', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 600, color: '#A8702E', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Send to Preview
              </button>
              <button
                onClick={() => {
                  const content = openedRangeToContent()
                  if (content) onSendLiveContent?.(content)
                }}
                style={{ background: '#A8702E', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 600, color: '#10160F', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Send to Live
              </button>
              <button
                onClick={() => {
                  const content = openedRangeToContent()
                  if (content) onSendStageContent?.(content)
                }}
                style={{ background: 'transparent', border: '1px solid #C97A4A', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 600, color: '#C97A4A', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Send to Stage
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 20px 20px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#8F9885', fontSize: 13 }}>
                No verses found for "{query}"
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map((verse, i) => (
                  <VerseCard
                    key={i}
                    verse={verse}
                    isPreview={previewContent?.type === 'verse' && previewContent.ref === verse.ref && previewContent.translation === verse.translation}
                    isLive={liveContent?.type === 'verse' && liveContent.ref === verse.ref && liveContent.translation === verse.translation}
                    isPinned={isPinned(verse)}
                    isSelected={selectedVerseKeys.has(verse.ref)}
                    onTogglePin={() => togglePin(verse)}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        setSelectedVerseKeys((prev) => {
                          const next = new Set(prev)
                          if (next.has(verse.ref)) next.delete(verse.ref)
                          else next.add(verse.ref)
                          return next
                        })
                        return
                      }
                      const parsed = parseReference(verse.ref)
                      if (parsed) openReference(parsed)
                      onSendPreview(verse)
                    }}
                    onDoubleClick={() => {
                      const parsed = parseReference(verse.ref)
                      if (parsed) openReference(parsed)
                      onSendPreview(verse)
                      onSendLive(verse)
                      onSendStageContent?.({ type: 'verse', ref: verse.ref, translation: verse.translation, text: verse.text })
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        </>
        )}

        {/* ALT: other pages -- each keeps its own internal toolbar/layout,
            embedded here instead of being a separate top-level screen. */}
        {page === 'songs' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SongLyricsScreen
              onSendPreview={onSendPreviewContent}
              onSendLive={onSendLiveContent}
              onSendStage={onSendStageContent}
              songs={songs}
              onChangeSongs={onChangeSongs}
              onPin={(item) => pinItem(item)}
              openRequest={songOpenRequest}
              onOpenRequestHandled={() => setSongOpenRequest(null)}
            />
          </div>
        )}
        {page === 'slides' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SermonSlidesScreen
              onSendLive={onSendLiveContent}
              onSendStage={onSendStageContent}
              onPin={(item) => pinItem(item)}
              openRequestText={slideOpenRequest}
              onOpenRequestHandled={() => setSlideOpenRequest(null)}
            />
          </div>
        )}
        {page === 'timer' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <TimerScreen onPin={(item) => pinItem(item)} />
          </div>
        )}
        {page === 'up-next' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <UpNextScreen sessions={sessions ?? []} onPin={(item) => pinItem(item)} />
          </div>
        )}
      </div>

      {/* Drag handle -- resizes the right sidebar */}
      <div
        onMouseDown={() => setResizingSidebar(true)}
        style={{
          width: 5,
          flexShrink: 0,
          cursor: 'col-resize',
          background: resizingSidebar ? 'rgba(168,112,46,0.4)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!resizingSidebar) e.currentTarget.style.background = 'rgba(168,112,46,0.2)'
        }}
        onMouseLeave={(e) => {
          if (!resizingSidebar) e.currentTarget.style.background = 'transparent'
        }}
      />

      {/* Right sidebar */}
      <div
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          borderLeft: '1px solid #2A331F',
          background: '#1B2318',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            height: 48,
            borderBottom: '1px solid #2A331F',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#8F9885', textTransform: 'uppercase' }}>
            {t.nowOnScreen}
          </span>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* PREVIEW box */}
          <OutputBox
            label={t.preview}
            labelColor="#A8702E"
            content={previewContent}
            onClear={onClearPreview}
            extraAction={
              previewContent
                ? { label: t.pushToLive, onClick: onPushToLive }
                : undefined
            }
          />

          {/* LIVE box */}
          <OutputBox label={t.live} labelColor="#6FC98A" content={liveContent} onClear={onClearLive} onChangeTranslation={onChangeLiveTranslation} onSetSecondary={onSetLiveSecondary} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#2A331F', margin: '0 14px' }} />

        {/* ALT-024: Pin/anchor fast-reference panel */}
        <div style={{ padding: '12px 14px' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#8F9885',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {t.pinned} ({pinned.length})
          </div>
          {pinned.length === 0 ? (
            <div style={{ fontSize: 11, color: '#3A4430' }}>
              Pin a verse, song slide, sermon slide, timer preset, or Up Next style for fast recall mid-service.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {pinned.map((p, i) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setDragPinIdx(i)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverPinIdx(i)
                  }}
                  onDrop={() => reorderPinned(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 8px',
                    background: '#10160F',
                    border: dragOverPinIdx === i ? '1px solid rgba(168,112,46,0.5)' : '1px solid #2A331F',
                    borderRadius: 6,
                    opacity: dragPinIdx === i ? 0.5 : 1,
                    cursor: 'grab',
                  }}
                >
                  <PinTypeIcon type={p.type} />
                  <span style={{ fontSize: 11, color: '#EDEAE0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.label} {p.detail && <span style={{ color: '#3A4430' }}>({p.detail})</span>}
                  </span>
                  <button
                    onClick={() => openPinnedItem(p)}
                    title="Open (switches page, does not send)"
                    style={{ background: 'none', border: '1px solid #2A331F', borderRadius: 4, color: '#8F9885', cursor: 'pointer', fontSize: 10, padding: '2px 6px', fontFamily: 'inherit' }}
                  >
                    Open
                  </button>
                  {(p.type === 'verse' || p.type === 'song' || p.type === 'slide') && (
                    <button
                      onClick={() => sendPinnedItem(p)}
                      title="Send to Preview + Live + Stage, and open this page"
                      style={{ background: 'none', border: '1px solid rgba(168,112,46,0.4)', borderRadius: 4, color: '#A8702E', cursor: 'pointer', fontSize: 10, padding: '2px 6px', fontFamily: 'inherit' }}
                    >
                      Send
                    </button>
                  )}
                  <button
                    onClick={() => unpinById(p.id)}
                    title="Unpin"
                    style={{ background: 'none', border: 'none', color: '#8F9885', cursor: 'pointer', fontSize: 13, padding: '0 2px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live indicator */}
        <div style={{ padding: '0 14px 14px 14px' }}>
          <div
            style={{
              background: '#10160F',
              borderRadius: 6,
              border: '1px solid #2A331F',
              padding: '7px 11px',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: liveContent ? '#6FC98A' : '#8F9885',
                boxShadow: liveContent ? '0 0 5px rgba(111,201,138,0.6)' : 'none',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: '#8F9885' }}>
              {liveContent ? t.liveActive : t.liveIdle}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: disabled ? '#8F9885' : '#EDEAE0', fontWeight: 500 }}>{label}</span>
        {hint && <span style={{ fontSize: 10, color: '#3A4430' }}>{hint}</span>}
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          border: 'none',
          background: checked && !disabled ? '#A8702E' : '#2A331F',
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#EDEAE0',
            position: 'absolute',
            top: 3,
            left: checked ? 19 : 3,
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  )
}

function OutputBox({
  label,
  labelColor,
  content,
  onClear,
  extraAction,
  onChangeTranslation,
  onSetSecondary,
}: {
  label: string
  labelColor: string
  content: DisplayContent | null
  onClear: () => void
  extraAction?: { label: string; onClick: () => void }
  onChangeTranslation?: (translation: string, text: string) => void
  onSetSecondary?: (translation: string | null, text: string | null) => void
}) {
  const [showTranslations, setShowTranslations] = useState(false)
  const isVerse = content?.type === 'verse'
  const variants = isVerse ? availableTranslationsFor(content.ref) : []
  const t = useT()
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: labelColor, marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          background: '#000',
          borderRadius: 6,
          border: '1px solid #2A331F',
          aspectRatio: '16/9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 14,
          gap: 8,
        }}
      >
        {content?.type === 'verse' ? (
          <>
            <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: content.secondaryText ? 7.5 : 9, color: '#fff', textAlign: 'center', lineHeight: 1.5 }}>
              {content.text.length > 110 ? content.text.slice(0, 110) + '…' : content.text}
            </div>
            <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 8, color: '#A8702E', textAlign: 'center' }}>
              {content.ref} ({content.translation})
            </div>
            {/* ALT-fix: compare-translations bug -- the small preview mirror
                never rendered the secondary translation even when set. */}
            {content.secondaryText && (
              <>
                <div style={{ width: '60%', height: 1, background: 'rgba(255,255,255,0.15)', margin: '2px 0' }} />
                <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 7.5, color: '#fff', opacity: 0.85, textAlign: 'center', lineHeight: 1.5 }}>
                  {content.secondaryText.length > 110 ? content.secondaryText.slice(0, 110) + '…' : content.secondaryText}
                </div>
                <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 7, color: '#A8702E', opacity: 0.8, textAlign: 'center' }}>
                  {content.ref} ({content.secondaryTranslation})
                </div>
              </>
            )}
          </>
        ) : content?.type === 'song' ? (
          <>
            {content.lines.map((line, i) => (
              <div key={i} style={{ fontFamily: 'Inter, Segoe UI, sans-serif', fontSize: 9, fontWeight: 600, color: '#fff', textAlign: 'center', lineHeight: 1.4 }}>
                {line}
              </div>
            ))}
            <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', fontSize: 7, color: '#A8702E', textAlign: 'center', marginTop: 2 }}>
              {content.title}
            </div>
          </>
        ) : content?.type === 'slide' ? (
          <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', fontSize: 8.5, fontWeight: 500, color: '#fff', textAlign: 'center', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
            {content.text.length > 140 ? content.text.slice(0, 140) + '…' : content.text}
          </div>
        ) : content?.type === 'timer' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: '#8F9885', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {content.sessionTitle}
            </div>
            <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', fontSize: 16, color: '#A8702E', fontVariantNumeric: 'tabular-nums' }}>
              {String(Math.floor(content.remainingSeconds / 60)).padStart(2, '0')}:{String(content.remainingSeconds % 60).padStart(2, '0')}
            </div>
          </div>
        ) : (
          <div
            style={{
              fontFamily: 'Lora, Georgia, serif',
              fontSize: 10,
              color: '#A8702E',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textAlign: 'center',
              fontVariant: 'small-caps',
            }}
          >
            RCCG CAYC Media
          </div>
        )}
      </div>
      {/* ALT-fix: translation switcher, now reachable from Operator directly
          (previously only existed on the fullscreen Live output). */}
      {isVerse && variants.length > 0 && onChangeTranslation && (
        <div style={{ position: 'relative', marginTop: 6 }}>
          <button
            onClick={() => setShowTranslations((v) => !v)}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid #2A331F',
              borderRadius: 5,
              padding: '4px 8px',
              fontSize: 10,
              color: '#8F9885',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Translation: {content.translation || variants[0].translation} ▾
          </button>
          {showTranslations && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                right: 0,
                background: '#1B2318',
                border: '1px solid #2A331F',
                borderRadius: 6,
                overflow: 'hidden',
                zIndex: 20,
              }}
            >
              {variants.map((v) => (
                <button
                  key={v.translation}
                  onClick={() => {
                    onChangeTranslation(v.translation, v.text)
                    setShowTranslations(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: v.translation === content.translation ? 'rgba(168,112,46,0.15)' : 'transparent',
                    border: 'none',
                    padding: '6px 10px',
                    fontSize: 11,
                    color: v.translation === content.translation ? '#A8702E' : '#EDEAE0',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {v.translation}
                </button>
              ))}
            </div>
          )}
          {/* ALT-fix: compare-translations -- shows a second translation
              stacked with the first when turned on (rendering already
              existed in OutputStage; this is the missing operator control). */}
          {onSetSecondary && (
            <div style={{ marginTop: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#8F9885', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!content.secondaryText}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const other = variants.find((v) => v.translation !== content.translation) ?? variants[0]
                      onSetSecondary(other.translation, other.text)
                    } else {
                      onSetSecondary(null, null)
                    }
                  }}
                  style={{ accentColor: '#A8702E' }}
                />
                Compare with a second translation
              </label>
              {content.secondaryText && (
                <select
                  value={content.secondaryTranslation}
                  onChange={(e) => {
                    const v = variants.find((x) => x.translation === e.target.value)
                    if (v) onSetSecondary(v.translation, v.text)
                  }}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    background: '#10160F',
                    border: '1px solid #2A331F',
                    borderRadius: 5,
                    padding: '3px 6px',
                    fontSize: 10,
                    color: '#EDEAE0',
                    fontFamily: 'inherit',
                  }}
                >
                  {variants.filter((v) => v.translation !== content.translation).map((v) => (
                    <option key={v.translation} value={v.translation} style={{ background: '#10160F' }}>
                      {v.translation}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {content && (
          <button
            onClick={onClear}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid #2A331F',
              borderRadius: 5,
              padding: '4px 10px',
              fontSize: 10,
              color: '#8F9885',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#A8702E'
              e.currentTarget.style.color = '#A8702E'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2A331F'
              e.currentTarget.style.color = '#8F9885'
            }}
          >
            {t.clear} {label.toLowerCase()}
          </button>
        )}
        {extraAction && (
          <button
            onClick={extraAction.onClick}
            style={{
              flex: 1,
              background: '#A8702E',
              border: 'none',
              borderRadius: 5,
              padding: '4px 10px',
              fontSize: 10,
              fontWeight: 600,
              color: '#10160F',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#C08A44')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#A8702E')}
          >
            {extraAction.label}
          </button>
        )}
      </div>
    </div>
  )
}

function TopBarLinkBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: '1px solid #2A331F',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 11,
        color: '#8F9885',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#A8702E'
        e.currentTarget.style.color = '#A8702E'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#2A331F'
        e.currentTarget.style.color = '#8F9885'
      }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <rect x="1" y="2" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4 11h4M6 9v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {label}
    </button>
  )
}

function PinTypeIcon({ type }: { type: PinnedItem['type'] }) {
  const icons: Record<PinnedItem['type'], { glyph: string; color: string }> = {
    verse: { glyph: '✦', color: '#A8702E' },
    song: { glyph: '♪', color: '#7BAFD4' },
    slide: { glyph: '▤', color: '#8F9885' },
    timer: { glyph: '⏱', color: '#C97A4A' },
    'up-next': { glyph: '▶', color: '#6FC98A' },
  }
  const { glyph, color } = icons[type]
  return <span style={{ fontSize: 11, color, flexShrink: 0, width: 12, textAlign: 'center' }}>{glyph}</span>
}

function StatusPill() {
  const t = useT()
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: '#10160F',
        border: '1px solid #2A331F',
        borderRadius: 20,
        padding: '3px 10px',
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#A8702E',
          boxShadow: '0 0 4px rgba(168,112,46,0.7)',
        }}
      />
      <span style={{ fontSize: 11, color: '#8F9885' }}>{t.prototypeBuild}</span>
    </div>
  )
}

function PulsingDot() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#A8702E',
        animation: 'pulse-gold 1.4s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes pulse-gold {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </span>
  )
}

function VerseCard({
  verse,
  isPreview,
  isLive,
  isPinned,
  isSelected,
  onTogglePin,
  onClick,
  onDoubleClick,
}: {
  verse: Verse
  isPreview: boolean
  isLive: boolean
  isPinned: boolean
  isSelected: boolean
  onTogglePin: () => void
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title="Click to stage (Preview). Double-click to send everywhere. Ctrl/Cmd+click to multi-select for pinning."
      style={{
        background: isSelected ? 'rgba(168,112,46,0.1)' : '#1B2318',
        border: `1px solid ${isSelected ? 'rgba(168,112,46,0.6)' : isLive ? 'rgba(111,201,138,0.4)' : isPreview ? 'rgba(168,112,46,0.4)' : '#2A331F'}`,
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        cursor: 'pointer',
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onTogglePin()
        }}
        title={isPinned ? 'Unpin' : 'Pin for fast reference'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: isPinned ? 'rgba(168,112,46,0.14)' : 'transparent',
          border: isPinned ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
          borderRadius: 6,
          cursor: 'pointer',
          padding: '4px 8px',
          flexShrink: 0,
          color: isPinned ? '#A8702E' : '#8F9885',
          fontSize: 10,
          fontFamily: 'inherit',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill={isPinned ? 'currentColor' : 'none'}>
          <path d="M7 1.5l1.5 3.5 3.5.5-2.5 2.5.5 3.5L7 9.5 4 11.5l.5-3.5L2 5.5l3.5-.5L7 1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
        {isPinned ? 'Pinned' : 'Pin'}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#A8702E', marginBottom: 5 }}>
          {verse.ref}
          <span style={{ marginLeft: 6, fontWeight: 400, fontSize: 11, color: '#8F9885' }}>
            ({verse.translation})
          </span>
          {isLive && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                color: '#6FC98A',
                background: 'rgba(111,201,138,0.1)',
                border: '1px solid rgba(111,201,138,0.25)',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              Live
            </span>
          )}
          {isPreview && !isLive && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                color: '#A8702E',
                background: 'rgba(168,112,46,0.1)',
                border: '1px solid rgba(168,112,46,0.25)',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              Preview
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#EDEAE0', lineHeight: 1.65 }}>{verse.text}</div>
      </div>
    </div>
  )
}
