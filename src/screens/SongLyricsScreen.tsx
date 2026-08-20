import { useState, useEffect, useRef } from 'react'
import { buildSlides, firstSlideIndexForSection, DEFAULT_SONGS, type Song, type SongSlide } from '../songModel'
import type { DisplayContent } from './OutputStage'
import type { PinnedItem } from '../pinModel'


// ALT-011: sample duplicate-detection result -- in the real app this
// would be computed by comparing titles/lyrics across the library.
// ALT-027: merge candidates now carry full lyrics, split into lines, so
// the review panel can compare actual content -- not just title/artist --
// since duplicates are often the same song by a different artist, or an
// incomplete version against a complete one.
interface MergeCandidate {
  id: string
  a: { title: string; artist: string; lyrics: string[] }
  b: { title: string; artist: string; lyrics: string[] }
}

const MERGE_CANDIDATES: MergeCandidate[] = [
  {
    id: 'm1',
    a: {
      title: 'Amazing Grace',
      artist: 'John Newton',
      lyrics: [
        'Amazing grace, how sweet the sound',
        'That saved a wretch like me',
        'I once was lost, but now am found',
        'Was blind but now I see',
      ],
    },
    b: {
      title: 'Amazing Grace (My Chains Are Gone)',
      artist: 'Chris Tomlin',
      lyrics: [
        'Amazing grace, how sweet the sound',
        'That saved a wretch like me',
        'I once was lost, but now am found',
        'Was blind but now I see',
        "'Twas grace that taught my heart to fear",
        'And grace my fears relieved',
        'My chains are gone, I\'ve been set free',
      ],
    },
  },
]

// ALT-009: quick text entry parsing -- splits on [Section] markers.
function parseQuickEntry(text: string): { section: string; lines: string[] }[] {
  if (!text.trim()) return []
  const hasBracketMarkers = /\[[^\]]+\]/.test(text)
  if (hasBracketMarkers) {
    const parts = text.split(/\[([^\]]+)\]/).filter((s) => s.trim() !== '')
    const result: { section: string; lines: string[] }[] = []
    for (let i = 0; i < parts.length; i += 2) {
      const section = parts[i]?.trim()
      const body = parts[i + 1]?.trim()
      if (section && body) {
        result.push({ section, lines: body.split('\n').map((l) => l.trim()).filter(Boolean) })
      }
    }
    return result
  }
  // ALT-fix: most pasted lyrics have no [Section] markers at all -- fall
  // back to treating blank-line-separated paragraphs as sections, rather
  // than silently producing zero lyrics.
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return paragraphs.map((p, i) => ({
    section: paragraphs.length > 1 ? `Verse ${i + 1}` : 'Verse 1',
    lines: p.split('\n').map((l) => l.trim()).filter(Boolean),
  }))
}

type LibraryTab = 'All Songs' | 'Hymns'

// ALT-027: side-by-side lyrics comparison for the merge review, with a
// simple line-level diff (lines only in A, only in B, or shared) so the
// operator can judge completeness/accuracy before merging -- e.g. an
// incomplete version vs. a complete one, or the same song by a different
// artist with slightly different wording.
function MergeCandidateRow({
  candidate,
  onMerge,
  onIgnore,
}: {
  candidate: MergeCandidate
  onMerge: () => void
  onIgnore: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { a, b } = candidate
  const setA = new Set(a.lyrics)
  const setB = new Set(b.lyrics)

  return (
    <div style={{ background: '#10160F', border: '1px solid #2A331F', borderRadius: 6, marginBottom: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
        <div style={{ flex: 1, fontSize: 12, color: '#EDEAE0' }}>
          {a.title} <span style={{ color: '#8F9885' }}>({a.artist})</span>
          <span style={{ color: '#3A4430', marginLeft: 6 }}>· {a.lyrics.length} lines</span>
        </div>
        <span style={{ color: '#3A4430' }}>↔</span>
        <div style={{ flex: 1, fontSize: 12, color: '#EDEAE0' }}>
          {b.title} <span style={{ color: '#8F9885' }}>({b.artist})</span>
          <span style={{ color: '#3A4430', marginLeft: 6 }}>· {b.lyrics.length} lines</span>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 5, padding: '4px 10px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {expanded ? 'Hide lyrics' : 'Compare lyrics'}
        </button>
        <button
          onClick={onMerge}
          style={{ background: '#A8702E', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#10160F', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Merge
        </button>
        <button
          onClick={onIgnore}
          style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 5, padding: '4px 10px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Ignore
        </button>
      </div>

      {expanded && (
        <div style={{ display: 'flex', gap: 1, borderTop: '1px solid #2A331F' }}>
          <div style={{ flex: 1, padding: '10px 12px', background: '#0d0f0a' }}>
            <div style={{ fontSize: 10, color: '#8F9885', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.title}</div>
            {a.lyrics.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: setB.has(line) ? '#EDEAE0' : '#6FC98A',
                  background: setB.has(line) ? 'transparent' : 'rgba(111,201,138,0.08)',
                  padding: '1px 4px',
                  borderRadius: 3,
                }}
              >
                {line}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, padding: '10px 12px', background: '#0d0f0a', borderLeft: '1px solid #2A331F' }}>
            <div style={{ fontSize: 10, color: '#8F9885', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.title}</div>
            {b.lyrics.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: setA.has(line) ? '#EDEAE0' : '#A8702E',
                  background: setA.has(line) ? 'transparent' : 'rgba(168,112,46,0.08)',
                  padding: '1px 4px',
                  borderRadius: 3,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
      {expanded && (
        <div style={{ padding: '6px 12px 10px', fontSize: 10, color: '#3A4430', borderTop: '1px solid #2A331F' }}>
          <span style={{ color: '#6FC98A' }}>■</span> only in {a.title} &nbsp;&nbsp;
          <span style={{ color: '#A8702E' }}>■</span> only in {b.title}
        </div>
      )}
    </div>
  )
}

export default function SongLyricsScreen({
  onSendPreview,
  onSendLive,
  onSendStage,
  songs: songsProp,
  onChangeSongs,
  onPin,
  openRequest,
  onOpenRequestHandled,
}: {
  onSendPreview?: (content: DisplayContent) => void
  onSendLive?: (content: DisplayContent) => void
  onSendStage?: (content: DisplayContent) => void
  songs?: Song[]
  onChangeSongs?: (songs: Song[]) => void
  onPin?: (item: Omit<PinnedItem, 'id'>) => void
  // ALT: lets a pinned item (or anything else outside this screen) command
  // it to open a specific song, e.g. from the Pinned panel's Open/Send
  // buttons.
  openRequest?: { songId: string; slideIndex?: number } | null
  onOpenRequestHandled?: () => void
} = {}) {
  // ALT: "opened" song replaces the library list with the full lyrics
  // view (EasyWorship/OpenLP style) -- this is the primary way the
  // operator now interacts with a song. "Active Selection" (renamed from
  // "Now Playing") tracks which specific slide was last single/double
  // clicked, for highlighting and for the quick-action row.
  const [openedSongId, setOpenedSongId] = useState<string | null>(null)
  const [activeSlideKey, setActiveSlideKey] = useState<{ songId: string; slideIndex: number } | null>(null)
  const [query, setQuery] = useState('')
  const [bulkSelect, setBulkSelect] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [localSongs, setLocalSongs] = useState(DEFAULT_SONGS)
  const songs = songsProp ?? localSongs
  function setSongs(updater: Song[] | ((prev: Song[]) => Song[])) {
    const next = typeof updater === 'function' ? (updater as (prev: Song[]) => Song[])(songs) : updater
    if (onChangeSongs) onChangeSongs(next)
    else setLocalSongs(next)
  }
  const [tab, setTab] = useState<LibraryTab>('All Songs')
  const [showQuickEntry, setShowQuickEntry] = useState(false)
  const [quickEntryText, setQuickEntryText] = useState('')
  const [quickEntryTitle, setQuickEntryTitle] = useState('')
  const [showMerge, setShowMerge] = useState(false)
  const [showOnlineSearch, setShowOnlineSearch] = useState(false)
  const [onlineQuery, setOnlineQuery] = useState('')
  const [onlineSearchStep, setOnlineSearchStep] = useState<'query' | 'sources'>('query')
  const [selectedOnlineTitle, setSelectedOnlineTitle] = useState('')
  // ALT-fix: the "···" more-options button had no onClick at all.
  const [moreOptionsForId, setMoreOptionsForId] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [mergeCandidates, setMergeCandidates] = useState(MERGE_CANDIDATES)

  const byTab = tab === 'Hymns' ? songs.filter((s) => s.isHymn) : songs
  const filtered = query.trim()
    ? byTab.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.artist.toLowerCase().includes(query.toLowerCase()),
      )
    : byTab

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openedSong = songs.find((s) => s.id === openedSongId) ?? null
  const openedSlides = openedSong ? buildSlides(openedSong) : []
  const activeSlide: SongSlide | null =
    activeSlideKey && activeSlideKey.songId === openedSongId ? openedSlides[activeSlideKey.slideIndex] ?? null : null

  // ALT: consume an external open request (e.g. from a pinned item's
  // Open/Send button), then signal it's been handled so the caller can
  // clear it -- avoids re-triggering on every re-render.
  useEffect(() => {
    if (openRequest) {
      setOpenedSongId(openRequest.songId)
      if (openRequest.slideIndex !== undefined) {
        setActiveSlideKey({ songId: openRequest.songId, slideIndex: openRequest.slideIndex })
      }
      onOpenRequestHandled?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest])

  // ALT: simulated auto-detection -- real detection needs the Deepgram
  // audio pipeline from the project plan (backend work outside this
  // frontend prototype). This simulates the same *logic*: check the local
  // song database first, and if there's no match, report that an online
  // lookup would run next (no real online lookup exists here).
  const [autoDetectOn, setAutoDetectOn] = useState(false)
  const [simulatedInput, setSimulatedInput] = useState('')
  const [detectStatus, setDetectStatus] = useState<'idle' | 'checking' | 'matched' | 'no-match'>('idle')
  const [detectConfidence, setDetectConfidence] = useState(0)

  // ALT-item-8: mirrors EasyVerse's real behavior -- detection runs off the
  // same continuous transcript stream as scripture, and keeps tracking +
  // auto-advancing within the song already being followed as more lyrics
  // come in, rather than re-searching the whole database from scratch on
  // every update. Falls back to a fresh database search only when nothing
  // matches in the currently-followed song (i.e. the song likely changed).
  function runDetection(text: string) {
    setSimulatedInput(text)
    if (!text.trim()) {
      setDetectStatus('idle')
      return
    }
    setDetectStatus('checking')
    const needle = text.trim().toLowerCase()

    // Continuous tracking: check the song already being followed first.
    if (openedSong) {
      const currentSlides = buildSlides(openedSong)
      const matchIdx = currentSlides.findIndex((sl) => sl.lines.some((l) => l.toLowerCase().includes(needle)))
      if (matchIdx !== -1) {
        setActiveSlideKey({ songId: openedSong.id, slideIndex: matchIdx })
        setDetectConfidence(matchConfidence(needle, currentSlides[matchIdx].lines))
        setDetectStatus('matched')
        return
      }
    }

    // Fresh database search -- either nothing was being followed yet, or
    // the lyrics moved to a different song entirely.
    for (const song of songs) {
      const songSlides = buildSlides(song)
      const matchIdx = songSlides.findIndex((sl) => sl.lines.some((l) => l.toLowerCase().includes(needle)))
      if (matchIdx !== -1) {
        setOpenedSongId(song.id)
        setActiveSlideKey({ songId: song.id, slideIndex: matchIdx })
        setDetectConfidence(matchConfidence(needle, songSlides[matchIdx].lines))
        setDetectStatus('matched')
        return
      }
    }
    // Not found locally -- this is where a real online lookup would run.
    setDetectStatus('no-match')
  }

  // Lightweight confidence estimate: how much of the matched line the
  // heard text actually covers -- EasyVerse shows a similar confidence
  // score alongside its sub-300ms scripture matches.
  function matchConfidence(needle: string, lines: string[]): number {
    const line = lines.find((l) => l.toLowerCase().includes(needle))
    if (!line) return 0
    return Math.min(100, Math.round((needle.length / line.length) * 100))
  }

  function openSong(song: Song) {
    setOpenedSongId(song.id)
  }

  function closeSong() {
    setOpenedSongId(null)
  }

  function slideToContent(song: Song, slideLines: string[], idx: number): DisplayContent {
    return { type: 'song', title: song.title, artist: song.artist, lines: slideLines, songId: song.id, slideIndex: idx }
  }

  // ALT: single click = Active Selection + Preview. Double click = Active
  // Selection + Preview + Live + Stage. Applies to both the section
  // quick-jump buttons and individual slide blocks in the full view.
  function singleClickSlide(song: Song, slide: SongSlide, idx: number) {
    setActiveSlideKey({ songId: song.id, slideIndex: idx })
    const content = slideToContent(song, slide.lines, idx)
    onSendPreview?.(content)
  }

  function doubleClickSlide(song: Song, slide: SongSlide, idx: number) {
    setActiveSlideKey({ songId: song.id, slideIndex: idx })
    const content = slideToContent(song, slide.lines, idx)
    onSendPreview?.(content)
    onSendLive?.(content)
    onSendStage?.(content)
  }

  function jumpToSection(sectionIndex: number) {
    if (!openedSong) return
    const idx = firstSlideIndexForSection(openedSlides, sectionIndex)
    const slide = openedSlides[idx]
    if (slide) singleClickSlide(openedSong, slide, idx)
  }

  function updateLinesPerSlide(id: string, lines: number) {
    setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, linesPerSlide: Math.max(1, lines) } : s)))
  }

  function pinSlide(song: Song, slide: SongSlide, idx: number) {
    onPin?.({
      type: 'song',
      label: song.title,
      detail: slide.sectionLabel,
      songTitle: song.title,
      songArtist: song.artist,
      songLines: slide.lines,
    })
  }

  // ALT: pin directly from the library list, without opening the song --
  // pins its first slide as a sensible default.
  function pinFromList(song: Song) {
    const slides = buildSlides(song)
    if (slides[0]) pinSlide(song, slides[0], 0)
  }

  const [quickEntryError, setQuickEntryError] = useState('')
  // ALT-fix: section labels in Parsed Preview are now editable per section
  // -- an input+datalist combo lets the operator pick a common label
  // (Verse 2, Chorus, Intro, etc.) or type any custom one.
  const [sectionLabelOverrides, setSectionLabelOverrides] = useState<Record<number, string>>({})

  function saveQuickEntry() {
    if (!quickEntryTitle.trim()) {
      setQuickEntryError('Please enter a song title before saving.')
      return
    }
    if (parsedPreview.length === 0) {
      setQuickEntryError('No lyrics detected -- paste the lyrics above (blank line between sections).')
      return
    }
    setQuickEntryError('')
    const newSong: Song = {
      id: `qe-${Date.now()}`,
      title: quickEntryTitle.trim(),
      artist: 'Quick entry',
      source: 'Imported',
      isHymn: false,
      linesPerSlide: 2,
      sections: parsedPreview.map((s, i) => ({ label: sectionLabelOverrides[i] ?? s.section, lines: s.lines })),
    }
    setSongs((prev) => [...prev, newSong])
    setQuickEntryTitle('')
    setQuickEntryText('')
    setSectionLabelOverrides({})
    setShowQuickEntry(false)
    // ALT-fix: open the newly saved song right away as undeniable proof
    // it actually saved, instead of the panel just closing with nothing
    // to show for it.
    setOpenedSongId(newSong.id)
  }

  const parsedPreview = parseQuickEntry(quickEntryText)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top bar */}
      <div
        style={{
          height: 48,
          borderBottom: '1px solid #2A331F',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 20,
          paddingRight: 20,
          gap: 10,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: '#EDEAE0', letterSpacing: '0.02em' }}>
          Song Lyrics
        </span>
        <StatusPill />
        <div style={{ flex: 1 }} />
        {bulkSelect && selected.size > 0 && (
          <>
            <span style={{ fontSize: 11, color: '#8F9885' }}>{selected.size} selected</span>
            <button
              onClick={() => {
                setSongs((prev) => prev.map((s) => (selected.has(s.id) ? { ...s, isHymn: true } : s)))
              }}
              style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Mark as Hymn
            </button>
            <button
              onClick={() => {
                setSongs((prev) => prev.filter((s) => !selected.has(s.id)))
                setSelected(new Set())
              }}
              style={{ background: 'transparent', border: '1px solid rgba(255,96,96,0.3)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#ff6060', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Delete Selected
            </button>
          </>
        )}
        <button
          onClick={() => {
            setBulkSelect(!bulkSelect)
            setSelected(new Set())
          }}
          title="Select multiple songs for bulk actions (rename, delete, add to playlist)"
          style={{
            background: 'transparent',
            border: '1px solid #2A331F',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: bulkSelect ? '#A8702E' : '#8F9885',
            cursor: 'pointer',
            fontFamily: 'inherit',
            borderColor: bulkSelect ? 'rgba(168,112,46,0.4)' : '#2A331F',
          }}
        >
          {bulkSelect ? 'Cancel' : 'Select Multiple'}
        </button>
        <button
          onClick={() => setShowMerge(!showMerge)}
          style={{
            background: 'transparent',
            border: mergeCandidates.length ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: mergeCandidates.length ? '#A8702E' : '#8F9885',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Merge Duplicates{mergeCandidates.length ? ` (${mergeCandidates.length})` : ''}
        </button>
        <button
          onClick={() => setShowQuickEntry(!showQuickEntry)}
          style={{
            background: 'transparent',
            border: '1px solid #2A331F',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
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
          Quick Text Entry
        </button>
        <button
          onClick={() => setShowOnlineSearch((v) => !v)}
          style={{
            background: showOnlineSearch ? 'rgba(168,112,46,0.14)' : 'transparent',
            border: showOnlineSearch ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: showOnlineSearch ? '#A8702E' : '#8F9885',
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 8L11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Search online lyrics
        </button>
        <button
          onClick={() => importInputRef.current?.click()}
          style={{
            background: '#A8702E',
            border: 'none',
            borderRadius: 6,
            padding: '5px 13px',
            fontSize: 11,
            fontWeight: 600,
            color: '#10160F',
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#C08A44')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#A8702E')}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Import Song
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* ALT: AI auto-detection (simulated) -- since there's no real
            mic/audio input in this prototype, a text field stands in for
            "what's being sung." Real detection needs the Deepgram audio
            pipeline from the project plan. */}
        <div style={{ background: '#1B2318', border: '1px solid #2A331F', borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: autoDetectOn ? 10 : 0, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoDetectOn}
              onChange={(e) => {
                setAutoDetectOn(e.target.checked)
                if (!e.target.checked) {
                  setSimulatedInput('')
                  setDetectStatus('idle')
                }
              }}
              style={{ accentColor: '#A8702E' }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#EDEAE0' }}>AI auto-detect (simulated)</span>
            <span style={{ fontSize: 10, color: '#3A4430' }}>-- checks local database, then would check online</span>
          </label>

          {autoDetectOn && (
            <>
              <input
                value={simulatedInput}
                onChange={(e) => runDetection(e.target.value)}
                placeholder="Simulate what is being sung, e.g. amazing grace how sweet"
                style={{
                  width: '100%',
                  background: '#10160F',
                  border: '1px solid #2A331F',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: '#EDEAE0',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  marginBottom: 8,
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: detectStatus === 'matched' ? '#6FC98A' : detectStatus === 'no-match' ? '#ff6060' : detectStatus === 'checking' ? '#A8702E' : '#3A4430',
                  }}
                />
                <span style={{ color: '#8F9885' }}>
                  {detectStatus === 'idle' && 'Waiting for input...'}
                  {detectStatus === 'checking' && 'Checking local database...'}
                  {detectStatus === 'matched' && `Matched locally (${detectConfidence}% confidence) -- tracking "${openedSong?.title}"`}
                  {detectStatus === 'no-match' && 'Not found locally -- would check online next (no online lookup in this prototype)'}
                </span>
                {/* ALT-item-9: unrecognized lyrics can be saved straight to
                    the local library, so the same phrase is found locally
                    (fast) instead of falling through to no-match next time. */}
                {detectStatus === 'no-match' && (
                  <button
                    onClick={() => {
                      setQuickEntryTitle('')
                      setQuickEntryText(`[Verse 1]
${simulatedInput}`)
                      setShowQuickEntry(true)
                    }}
                    style={{ background: 'transparent', border: '1px solid rgba(168,112,46,0.4)', borderRadius: 5, padding: '2px 9px', fontSize: 10, color: '#A8702E', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Save as New Song
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* ALT: Search online lyrics -- simulated result set, since there is
            no real lyrics API wired up in this prototype. */}
        {showOnlineSearch && (
          <div style={{ background: '#1B2318', border: '1px solid rgba(168,112,46,0.3)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            {onlineSearchStep === 'query' ? (
              <>
                <input
                  value={onlineQuery}
                  onChange={(e) => setOnlineQuery(e.target.value)}
                  placeholder="Search for a song title or artist online..."
                  style={{ width: '100%', background: '#10160F', border: '1px solid #2A331F', borderRadius: 6, padding: '7px 10px', fontSize: 12, color: '#EDEAE0', outline: 'none', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }}
                />
                {onlineQuery.trim() ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={{ fontSize: 10, color: '#3A4430', margin: '0 0 4px' }}>
                      No live lyrics API is connected in this prototype -- picking a title shows possible
                      sources to choose from, then opens Quick Text Entry so you can paste and preview the
                      real lyrics before saving anything.
                    </p>
                    {[`${onlineQuery} (Live)`, `${onlineQuery} (Studio Version)`].map((title, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10160F', border: '1px solid #2A331F', borderRadius: 6, padding: '8px 10px' }}>
                        <span style={{ flex: 1, fontSize: 12, color: '#EDEAE0' }}>{title}</span>
                        <button
                          onClick={() => {
                            setSelectedOnlineTitle(title)
                            setOnlineSearchStep('sources')
                          }}
                          style={{ background: '#A8702E', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 10, fontWeight: 600, color: '#10160F', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Use This Title
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 11, color: '#3A4430', margin: 0 }}>
                    Type a song title or artist to search (simulated -- no live lyrics API connected in this prototype).
                  </p>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setOnlineSearchStep('query')}
                  style={{ background: 'transparent', border: 'none', color: '#8F9885', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', padding: 0, marginBottom: 10 }}
                >
                  ← Back to results
                </button>
                <p style={{ fontSize: 11, color: '#EDEAE0', margin: '0 0 10px' }}>
                  Sources for <strong>{selectedOnlineTitle}</strong> -- pick the correct match:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {['Genius Lyrics', 'Official Lyric Video (YouTube)', 'AZLyrics'].map((source, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10160F', border: '1px solid #2A331F', borderRadius: 6, padding: '8px 10px' }}>
                      <span style={{ flex: 1, fontSize: 12, color: '#EDEAE0' }}>{source}</span>
                      <button
                        onClick={() => {
                          setQuickEntryTitle(selectedOnlineTitle)
                          setQuickEntryText('')
                          setShowOnlineSearch(false)
                          setOnlineQuery('')
                          setOnlineSearchStep('query')
                          setShowQuickEntry(true)
                        }}
                        style={{ background: '#A8702E', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 10, fontWeight: 600, color: '#10160F', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Select This Version
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ALT-fix: Import Song now opens the OS file dialog directly on
            one click (via a hidden input + ref), instead of showing a
            visible intermediate panel the user had to click again. */}
        <input
          ref={importInputRef}
          type="file"
          accept=".txt,.pdf,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const dotIndex = file.name.lastIndexOf('.')
            const baseName = dotIndex > 0 ? file.name.slice(0, dotIndex) : file.name
            setSongs((prev) => [
              ...prev,
              {
                id: `import-${Date.now()}`,
                title: baseName,
                artist: 'Imported file',
                source: 'Imported',
                isHymn: false,
                linesPerSlide: 2,
                sections: [{ label: 'Verse 1', lines: ['Lyrics not yet parsed -- edit via Quick Text Entry'] }],
              },
            ])
            e.target.value = ''
          }}
          style={{ display: 'none' }}
        />

        {/* ALT-009: Quick text entry */}
        {showQuickEntry && (
          <div
            style={{
              background: '#1B2318',
              border: '1px solid rgba(168,112,46,0.3)',
              borderRadius: 8,
              padding: 14,
              marginBottom: 16,
              display: 'flex',
              gap: 14,
            }}
          >
            <div style={{ flex: 1 }}>
              <input
                value={quickEntryTitle}
                onChange={(e) => setQuickEntryTitle(e.target.value)}
                placeholder="Song title"
                style={{
                  width: '100%',
                  background: '#10160F',
                  border: '1px solid #2A331F',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 12,
                  color: '#EDEAE0',
                  outline: 'none',
                  fontFamily: 'inherit',
                  marginBottom: 8,
                }}
              />
              <textarea
                value={quickEntryText}
                onChange={(e) => setQuickEntryText(e.target.value)}
                placeholder={'[Verse 1]\nAmazing grace how sweet the sound\n\n[Chorus]\nPraise God from whom all blessings flow'}
                rows={8}
                style={{
                  width: '100%',
                  background: '#10160F',
                  border: '1px solid #2A331F',
                  borderRadius: 6,
                  padding: 10,
                  fontSize: 12,
                  color: '#EDEAE0',
                  outline: 'none',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />
              <button
                onClick={saveQuickEntry}
                style={{
                  marginTop: 8,
                  background: '#A8702E',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#10160F',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Save Song
              </button>
              {quickEntryError && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#ff6060' }}>{quickEntryError}</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: '#8F9885', textTransform: 'uppercase', marginBottom: 8 }}>
                Parsed preview
              </div>
              {parsedPreview.length === 0 ? (
                <div style={{ fontSize: 11, color: '#3A4430' }}>
                  Paste lyrics above (blank line between sections), or mark sections with [Verse 1], [Chorus], etc.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <datalist id="section-label-options">
                    <option value="Verse 1" />
                    <option value="Verse 2" />
                    <option value="Verse 3" />
                    <option value="Verse 4" />
                    <option value="Pre-Chorus" />
                    <option value="Chorus" />
                    <option value="Chorus 1" />
                    <option value="Chorus 2" />
                    <option value="Bridge" />
                    <option value="Intro" />
                    <option value="Outro" />
                    <option value="Vamp" />
                    <option value="Interlude" />
                    <option value="Tag" />
                  </datalist>
                  {parsedPreview.map((sec, i) => (
                    <div key={i} style={{ background: '#10160F', border: '1px solid #2A331F', borderRadius: 6, padding: '8px 10px' }}>
                      <input
                        list="section-label-options"
                        value={sectionLabelOverrides[i] ?? sec.section}
                        onChange={(e) =>
                          setSectionLabelOverrides((prev) => ({ ...prev, [i]: e.target.value }))
                        }
                        style={{
                          background: 'transparent',
                          border: '1px solid #2A331F',
                          borderRadius: 4,
                          padding: '2px 6px',
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#A8702E',
                          outline: 'none',
                          fontFamily: 'inherit',
                          marginBottom: 4,
                          width: 130,
                        }}
                      />
                      {sec.lines.map((line, j) => (
                        <div key={j} style={{ fontSize: 11, color: '#EDEAE0', lineHeight: 1.6 }}>{line}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ALT-011: Merge Duplicates review panel */}
        {showMerge && (
          <div
            style={{
              background: '#1B2318',
              border: '1px solid rgba(168,112,46,0.3)',
              borderRadius: 8,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: '#EDEAE0', marginBottom: 10 }}>
              Possible duplicate songs
            </div>
            {mergeCandidates.length === 0 ? (
              <div style={{ fontSize: 12, color: '#8F9885' }}>No duplicates left to review.</div>
            ) : (
              mergeCandidates.map((c) => (
                <MergeCandidateRow
                  key={c.id}
                  candidate={c}
                  onMerge={() => setMergeCandidates((prev) => prev.filter((x) => x.id !== c.id))}
                  onIgnore={() => setMergeCandidates((prev) => prev.filter((x) => x.id !== c.id))}
                />
              ))
            )}
          </div>
        )}

        {/* ALT: opened song -- replaces the library list entirely with the
            full lyrics view (EasyWorship/OpenLP style), so the operator
            sees the whole song structure and can click any section/slide
            directly. Single click = Active Selection + Preview. Double
            click = Active Selection + Preview + Live + Stage. */}
        {openedSong ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <button
                onClick={closeSong}
                style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 6, padding: '5px 12px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← Back to Songs
              </button>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#EDEAE0' }}>{openedSong.title}</div>
              <div style={{ fontSize: 12, color: '#8F9885' }}>{openedSong.artist}</div>
              {onPin && (
                <button
                  onClick={() => (activeSlide ? pinSlide(openedSong, activeSlide, activeSlideKey!.slideIndex) : pinFromList(openedSong))}
                  title="Pin this song"
                  style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 6, padding: '5px 10px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Pin
                </button>
              )}
            </div>

            {/* ALT-item-4: lines/slide moved up here, next to section jump buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} title="Lines per slide">
                <input
                  type="number"
                  min={1}
                  value={openedSong.linesPerSlide}
                  onChange={(e) => updateLinesPerSlide(openedSong.id, Number(e.target.value))}
                  style={{ width: 36, background: '#10160F', border: '1px solid #2A331F', borderRadius: 5, padding: '4px 5px', fontSize: 11, color: '#EDEAE0', textAlign: 'center', fontFamily: 'inherit' }}
                />
                <span style={{ fontSize: 10, color: '#8F9885' }}>lines/slide</span>
              </div>
              <div style={{ width: 1, height: 18, background: '#2A331F' }} />
              {openedSong.sections.map((sec, idx) => (
                <button
                  key={idx}
                  onClick={() => jumpToSection(idx)}
                  onDoubleClick={() => {
                    const i = firstSlideIndexForSection(openedSlides, idx)
                    const slide = openedSlides[i]
                    if (slide) doubleClickSlide(openedSong, slide, i)
                  }}
                  style={{
                    background: activeSlide?.sectionIndex === idx ? 'rgba(168,112,46,0.15)' : '#1B2318',
                    border: activeSlide?.sectionIndex === idx ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
                    borderRadius: 5,
                    padding: '5px 11px',
                    fontSize: 11,
                    color: activeSlide?.sectionIndex === idx ? '#A8702E' : '#8F9885',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {activeSlide && (
              <div style={{ fontSize: 11, color: '#A8702E', marginBottom: 8 }}>
                Active Selection: {activeSlide.sectionLabel}
              </div>
            )}
            <p style={{ fontSize: 10, color: '#3A4430', margin: '0 0 12px' }}>
              Click a section to stage it (Preview). Double-click to send everywhere (Preview + Live + Stage).
            </p>

            {/* Full clickable slide list, grouped by section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {openedSong.sections.map((sec, secIdx) => (
                <div key={secIdx}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#8F9885', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    {sec.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {openedSlides
                      .map((s, i) => ({ s, i }))
                      .filter(({ s }) => s.sectionIndex === secIdx)
                      .map(({ s, i }) => {
                        const isActive = activeSlideKey?.songId === openedSong.id && activeSlideKey.slideIndex === i
                        return (
                          <div
                            key={i}
                            onClick={() => singleClickSlide(openedSong, s, i)}
                            onDoubleClick={() => doubleClickSlide(openedSong, s, i)}
                            style={{
                              background: isActive ? 'rgba(168,112,46,0.12)' : '#1B2318',
                              border: isActive ? '1px solid rgba(168,112,46,0.5)' : '1px solid #2A331F',
                              borderRadius: 6,
                              padding: '10px 12px',
                              cursor: 'pointer',
                            }}
                          >
                            {s.lines.map((line, li) => (
                              <div key={li} style={{ fontSize: 13, color: isActive ? '#EDEAE0' : '#c9cbc6', lineHeight: 1.7 }}>{line}</div>
                            ))}
                          </div>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ALT-012: Hymns grouped separately but one tab away */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {(['All Songs', 'Hymns'] as LibraryTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    background: tab === t ? 'rgba(168,112,46,0.14)' : 'transparent',
                    border: tab === t ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
                    borderRadius: 6,
                    padding: '5px 12px',
                    fontSize: 11,
                    fontWeight: tab === t ? 600 : 400,
                    color: tab === t ? '#A8702E' : '#8F9885',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
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
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M9 9L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter song library…"
                style={{
                  width: '100%',
                  background: '#1B2318',
                  border: '1px solid #2A331F',
                  borderRadius: 8,
                  padding: '7px 12px 7px 30px',
                  fontSize: 13,
                  color: '#EDEAE0',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(168,112,46,0.4)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#2A331F')}
              />
            </div>

            {/* Song list */}
            <div
              style={{
                background: '#1B2318',
                border: '1px solid #2A331F',
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              {filtered.map((song, i) => (
                <div
                  key={song.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '11px 14px',
                    borderBottom: i < filtered.length - 1 ? '1px solid #2A331F' : 'none',
                    gap: 10,
                    background: selected.has(song.id) ? 'rgba(168,112,46,0.06)' : 'transparent',
                    cursor: bulkSelect ? 'pointer' : 'default',
                  }}
                  onClick={() => bulkSelect && toggleSelect(song.id)}
                  onDoubleClick={() => !bulkSelect && openSong(song)}
                >
                  {bulkSelect && (
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: selected.has(song.id) ? '1.5px solid #A8702E' : '1.5px solid #2A331F',
                        background: selected.has(song.id) ? '#A8702E' : 'transparent',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selected.has(song.id) && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5l2.5 2.5 4-4" stroke="#10160F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  )}
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 6,
                      background: '#10160F',
                      border: '1px solid #2A331F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 10.5V4l7-2v7" stroke="#8F9885" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="3.5" cy="10.5" r="1.5" stroke="#8F9885" strokeWidth="1.2" />
                      <circle cx="10.5" cy="9" r="1.5" stroke="#8F9885" strokeWidth="1.2" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#EDEAE0', marginBottom: 2 }}>
                      {song.title}
                      {song.isHymn && (
                        <span style={{ marginLeft: 6, fontSize: 9, color: '#8F9885', border: '1px solid #2A331F', borderRadius: 4, padding: '1px 5px' }}>
                          HYMN
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#8F9885' }}>{song.artist}</div>
                  </div>
                  {/* ALT-item-1: Imported/Online badge removed -- not useful */}
                  {/* ALT-item-4: per-row lines/slide removed -- moved into the opened view */}
                  {!bulkSelect && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        pinFromList(song)
                      }}
                      title="Pin this song"
                      style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 5, padding: '4px 8px', fontSize: 10, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                    >
                      Pin
                    </button>
                  )}
                  {/* ALT-item-2: "Play" renamed to "Open" */}
                  {!bulkSelect && (
                    <button
                      onClick={() => openSong(song)}
                      style={{
                        background: openedSongId === song.id ? 'rgba(168,112,46,0.15)' : 'transparent',
                        border: openedSongId === song.id ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
                        borderRadius: 5,
                        padding: '4px 10px',
                        fontSize: 10,
                        color: openedSongId === song.id ? '#A8702E' : '#8F9885',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        flexShrink: 0,
                      }}
                    >
                      Open
                    </button>
                  )}
                  {!bulkSelect && (
                    <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setMoreOptionsForId(moreOptionsForId === song.id ? null : song.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#8F9885',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: 5,
                        display: 'flex',
                        fontSize: 16,
                        lineHeight: 1,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#EDEAE0')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#8F9885')}
                      title="More options"
                    >
                      ···
                    </button>
                    {moreOptionsForId === song.id && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '110%',
                          right: 0,
                          background: '#1B2318',
                          border: '1px solid #2A331F',
                          borderRadius: 6,
                          overflow: 'hidden',
                          minWidth: 120,
                          zIndex: 20,
                        }}
                      >
                        <button
                          onClick={() => {
                            const newTitle = window.prompt('Rename song', song.title)
                            if (newTitle && newTitle.trim()) {
                              setSongs((prev) => prev.map((s) => (s.id === song.id ? { ...s, title: newTitle.trim() } : s)))
                            }
                            setMoreOptionsForId(null)
                          }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '7px 12px', fontSize: 11, color: '#EDEAE0', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => {
                            setSongs((prev) => [...prev, { ...song, id: `dup-${Date.now()}`, title: `${song.title} (Copy)` }])
                            setMoreOptionsForId(null)
                          }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '7px 12px', fontSize: 11, color: '#EDEAE0', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => {
                            setSongs((prev) => prev.filter((s) => s.id !== song.id))
                            setMoreOptionsForId(null)
                          }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '7px 12px', fontSize: 11, color: '#ff6060', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Drop zone */}
            <div
              style={{
                border: '1.5px dashed #2A331F',
                borderRadius: 8,
                padding: '28px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(168,112,46,0.35)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2A331F')}
            >
              <div style={{ color: '#3A4430' }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 4v14M8 12l6-8 6 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 20v2a2 2 0 002 2h16a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ fontSize: 13, color: '#8F9885', lineHeight: 1.6 }}>
                Drag a file here or click to import
              </div>
              <div style={{ fontSize: 11, color: '#3A4430' }}>
                Supports PDF and other document formats
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatusPill() {
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
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#A8702E', boxShadow: '0 0 4px rgba(168,112,46,0.7)' }} />
      <span style={{ fontSize: 11, color: '#8F9885' }}>Prototype build</span>
    </div>
  )
}
